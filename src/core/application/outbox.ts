// ─── Offline LWW Outbox Queue ───────────────────────────────────────
// Application layer — orchestrates IndexedDB outbox for offline-first mutations
// Per docs/architecture/03-blueprint.md §3.2:
//   LWW (Last-Write-Wins) client-timestamp reconciliation strategy

import { openDB, IDBPDatabase } from 'idb'

// ─── Types ─────────────────────────────────────────────────────────

export enum OutboxStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export interface OutboxEntry {
  id: string
  table: string
  operation: 'upsert' | 'delete'
  recordId: string
  payload: Record<string, unknown>
  clientTimestamp: number
  status: OutboxStatus
  error?: string
}

export interface CreateEntryInput {
  table: string
  operation: 'upsert' | 'delete'
  recordId: string
  payload: Record<string, unknown>
}

let entryCounter = 0

export function createOutboxEntry(input: CreateEntryInput): OutboxEntry {
  return {
    id: `outbox-${Date.now()}-${++entryCounter}`,
    table: input.table,
    operation: input.operation,
    recordId: input.recordId,
    payload: input.payload,
    clientTimestamp: Date.now(),
    status: OutboxStatus.PENDING,
  }
}

// ─── LWW Reconciliation ────────────────────────────────────────────

/**
 * Compare two timestamps using Last-Write-Wins strategy.
 * Returns 1 if client is newer (can overwrite server),
 * -1 if server is newer (should not overwrite),
 * 0 if equal.
 */
export function compareLwwTimestamps(
  clientTimestamp: number,
  serverUpdatedAt: number
): number {
  if (clientTimestamp > serverUpdatedAt) return 1
  if (clientTimestamp < serverUpdatedAt) return -1
  return 0
}

// ─── Outbox Queue ──────────────────────────────────────────────────

const OUTBOX_STORE = 'outbox'

export class OutboxQueue {
  private db: IDBPDatabase | null = null
  private readonly dbName: string

  constructor(dbName: string) {
    this.dbName = dbName
  }

  async initialize(): Promise<void> {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
        }
      },
    })
  }

  async enqueue(entry: OutboxEntry): Promise<void> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    await this.db.put(OUTBOX_STORE, entry)
  }

  async getPending(): Promise<OutboxEntry[]> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    const all = await this.db.getAll(OUTBOX_STORE)
    return all.filter(e => e.status === OutboxStatus.PENDING)
  }

  async getAll(): Promise<OutboxEntry[]> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    return this.db.getAll(OUTBOX_STORE)
  }

  async markSent(id: string): Promise<void> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    const entry = await this.db.get(OUTBOX_STORE, id)
    if (entry) {
      entry.status = OutboxStatus.SENT
      entry.error = undefined
      await this.db.put(OUTBOX_STORE, entry)
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    const entry = await this.db.get(OUTBOX_STORE, id)
    if (entry) {
      entry.status = OutboxStatus.FAILED
      entry.error = error
      await this.db.put(OUTBOX_STORE, entry)
    }
  }

  async pendingCount(): Promise<number> {
    const pending = await this.getPending()
    return pending.length
  }

  async flush(
    processor: (entry: OutboxEntry) => Promise<void>
  ): Promise<void> {
    const pending = await this.getPending()
    for (const entry of pending) {
      try {
        await processor(entry)
        await this.markSent(entry.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await this.markFailed(entry.id, message)
      }
    }
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('OutboxQueue not initialized')
    await this.db.clear(OUTBOX_STORE)
  }
}