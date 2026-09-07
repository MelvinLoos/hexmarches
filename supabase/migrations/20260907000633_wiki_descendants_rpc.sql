-- Migration: wiki_descendants_rpc
-- Adds an RPC function for ltree descendant queries (path <@ parent_path).

CREATE OR REPLACE FUNCTION public.get_wiki_descendants(parent_path ltree)
RETURNS SETOF public.wiki_nodes
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.wiki_nodes WHERE path <@ parent_path ORDER BY path;
$$;
