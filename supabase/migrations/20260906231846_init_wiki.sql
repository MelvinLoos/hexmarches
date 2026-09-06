-- Migration: init_wiki
-- Creates the baseline wiki_nodes table with ltree hierarchy and full-text search.
-- CRITICAL: Uses only id + path ltree for hierarchy. No parent_id or children columns.

-- ── Extensions ────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA extensions;

-- ── Wiki Nodes Table ──────────────────────────────────────────────

CREATE TABLE public.wiki_nodes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text DEFAULT '',
  path        ltree NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  search_vector tsvector
);

-- ── Indexes ───────────────────────────────────────────────────────

-- GIST index for ltree hierarchical queries (ancestor/descendant lookups)
CREATE INDEX idx_wiki_nodes_path ON public.wiki_nodes USING GIST (path);

-- GIN index for full-text search
CREATE INDEX idx_wiki_nodes_search ON public.wiki_nodes USING GIN (search_vector);

-- ── Triggers ──────────────────────────────────────────────────────

-- Auto-update search_vector from title + content on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.wiki_nodes_search_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wiki_nodes_search
  BEFORE INSERT OR UPDATE ON public.wiki_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.wiki_nodes_search_update();

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wiki_nodes_updated_at
  BEFORE UPDATE ON public.wiki_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── Full-Text Search RPC ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_wiki(search_query text)
RETURNS TABLE (
  id          uuid,
  title       text,
  content     text,
  path        ltree,
  created_at  timestamptz,
  updated_at  timestamptz,
  rank        real,
  headline    text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    wn.id,
    wn.title,
    wn.content,
    wn.path,
    wn.created_at,
    wn.updated_at,
    ts_rank(wn.search_vector, query) AS rank,
    ts_headline(
      'english',
      COALESCE(wn.content, ''),
      query,
      'StartSel=<b>, StopSel=</b>, MaxWords=50, MinWords=20'
    ) AS headline
  FROM public.wiki_nodes wn,
       websearch_to_tsquery('english', search_query) query
  WHERE wn.search_vector @@ query
  ORDER BY rank DESC;
$$;
