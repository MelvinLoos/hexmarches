-- HexMarches Seed Data
-- Inserted after all migrations on `supabase db reset`.
-- Provides a deterministic baseline for local development and testing.

-- Seed data uses valid ltree paths (lowercase alphanumeric + underscore, dot-separated).
-- All paths are under the 'campaign' root for hierarchical querying.

INSERT INTO public.wiki_nodes (title, content, path, entity_type)
VALUES
  ('Campaign Root', 'The root of the HexMarches campaign wiki. All content lives under this node.', 'campaign', 'GENERAL'),
  ('Locations', 'All locations in the campaign world.', 'campaign.locations', 'GENERAL'),
  ('Factions', 'Factions and organizations that shape the world.', 'campaign.factions', 'GENERAL'),
  ('NPCs', 'Non-player characters that inhabit the realm.', 'campaign.npcs', 'GENERAL'),
  ('Dark Forest', 'A spooky forest filled with danger and mystery. Many adventurers have entered but few have returned.', 'campaign.locations.forest', 'LOCATION'),
  ('The Harpers', 'A secret organization of spies and bards working to preserve knowledge and freedom.', 'campaign.factions.harpers', 'FACTION'),
  ('Elder Cave', 'A deep cave within the Dark Forest. Rumored to hold ancient treasures.', 'campaign.locations.forest.cave', 'LOCATION'),
  ('Gandalf', 'A wise wizard who guides heroes on their quests.', 'campaign.npcs.gandalf', 'NPC');