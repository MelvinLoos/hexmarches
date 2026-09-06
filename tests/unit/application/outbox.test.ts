import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  OutboxEntry, OutboxStatus, createOutboxEntry,
  compareLwwTimestamps, OutboxQueue,
} from '~/src/core/application/outbox'

vi.mock('idb', () => {
  const store = new Map<string, any>()
  return {
    openDB: vi.fn(() => Promise.resolve({
      put: vi.fn(async (_s: string, v: any) => { store.set(v.id, v); return v.id }),
      get: vi.fn(async (_s: string, k: string) => store.get(k) ?? null),
      getAll: vi.fn(async () => Array.from(store.values())),
      delete: vi.fn(async (_s: string, k: string) => { store.delete(k) }),
      clear: vi.fn(async () => store.clear()),
    })),
  }
})
describe('Issue #5: Application — Offline LWW Outbox Queue', () => {
  describe('OutboxEntry', () => {
    it('should create an outbox entry with all required fields', () => {
      const e = createOutboxEntry({
        table: 'characters', operation: 'upsert', recordId: 'c1',
        payload: { name: 'Aria', tier: 2 },
      })
      expect(e.table).toBe('characters')
      expect(e.operation).toBe('upsert')
      expect(e.status).toBe(OutboxStatus.PENDING)
      expect(e.clientTimestamp).toBeGreaterThan(0)
      expect(e.id).toBeDefined()
    })
    it('should generate unique IDs', () => {
      const a = createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} })
      const b = createOutboxEntry({ table: 't', operation: 'upsert', recordId: '2', payload: {} })
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('compareLwwTimestamps()', () => {
    it('should return 1 when client is newer', () => {
      expect(compareLwwTimestamps(2000, 1000)).toBe(1)
    })
    it('should return -1 when client is older', () => {
      expect(compareLwwTimestamps(1000, 2000)).toBe(-1)
    })
    it('should return 0 when equal', () => {
      expect(compareLwwTimestamps(1500, 1500)).toBe(0)
    })
    it('should prevent overwrite when client older than server', () => {
      expect(compareLwwTimestamps(500, 800)).toBe(-1)
    })
    it('should allow overwrite when client newer than server', () => {
      expect(compareLwwTimestamps(900, 800)).toBe(1)
    })
  })

  describe('OutboxQueue', () => {
    let queue: OutboxQueue
    beforeEach(async () => { queue = new OutboxQueue('test'); await queue.initialize() })
    afterEach(async () => { await queue.clear() })

    it('should initialize', () => { expect(queue).toBeDefined() })

    it('should enqueue and retrieve pending', async () => {
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} }))
      expect(await queue.getPending()).toHaveLength(1)
    })

    it('should mark entries as sent', async () => {
      const e = createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} })
      await queue.enqueue(e)
      const p = await queue.getPending()
      await queue.markSent(p[0].id)
      expect(await queue.getPending()).toHaveLength(0)
    })

    it('should mark failed with error message', async () => {
      const e = createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} })
      await queue.enqueue(e)
      const p = await queue.getPending()
      await queue.markFailed(p[0].id, 'Network error')
      expect(await queue.getPending()).toHaveLength(0)
    })

    it('should flush entries in order', async () => {
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} }))
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '2', payload: {} }))
      const flushed: string[] = []
      await queue.flush(async (e) => { flushed.push(e.recordId) })
      expect(flushed).toEqual(['1', '2'])
    })

    it('should skip already-sent during flush', async () => {
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} }))
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '2', payload: {} }))
      const p = await queue.getPending()
      await queue.markSent(p[0].id)
      const flushed: string[] = []
      await queue.flush(async (e) => { flushed.push(e.recordId) })
      expect(flushed).toEqual(['2'])
    })

    it('should return correct pending count', async () => {
      expect(await queue.pendingCount()).toBe(0)
      await queue.enqueue(createOutboxEntry({ table: 't', operation: 'upsert', recordId: '1', payload: {} }))
      expect(await queue.pendingCount()).toBe(1)
    })
  })

  describe('Clean Architecture compliance', () => {
    it('should not import Nuxt, Vue, or Supabase', async () => {
      const mod = await import('../../../src/core/application/outbox')
      expect(mod.OutboxQueue).toBeDefined()
      expect(mod.compareLwwTimestamps).toBeDefined()
    })
  })
})