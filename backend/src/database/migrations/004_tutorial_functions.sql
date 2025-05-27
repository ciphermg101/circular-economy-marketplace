-- Function to increment tutorial views atomically
CREATE OR REPLACE FUNCTION increment_tutorial_views(tutorial_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tutorials
  SET views = views + 1
  WHERE id = tutorial_id;
END;
$$;

-- Function to increment tutorial likes atomically
CREATE OR REPLACE FUNCTION increment_tutorial_likes(tutorial_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tutorials
  SET likes = likes + 1
  WHERE id = tutorial_id;
END;
$$;

-- Function to decrement tutorial likes atomically
CREATE OR REPLACE FUNCTION decrement_tutorial_likes(tutorial_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tutorials
  SET likes = GREATEST(likes - 1, 0)  -- Ensure likes don't go below 0
  WHERE id = tutorial_id;
END;
$$;

-- Create tutorial_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS tutorial_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tutorial_id uuid REFERENCES tutorials(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tutorial_likes_user_id_idx ON tutorial_likes(user_id);
CREATE INDEX IF NOT EXISTS tutorial_likes_tutorial_id_idx ON tutorial_likes(tutorial_id);
CREATE INDEX IF NOT EXISTS tutorials_author_id_idx ON tutorials(author_id);
CREATE INDEX IF NOT EXISTS tutorials_category_idx ON tutorials(category);
CREATE INDEX IF NOT EXISTS tutorials_difficulty_idx ON tutorials(difficulty);
CREATE INDEX IF NOT EXISTS tutorials_views_idx ON tutorials(views DESC);
CREATE INDEX IF NOT EXISTS tutorials_likes_idx ON tutorials(likes DESC);

-- Function to get related tutorials based on tags
CREATE OR REPLACE FUNCTION get_related_tutorials(
  p_tutorial_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS SETOF tutorials
LANGUAGE sql
STABLE
AS $$
  WITH tutorial_tags AS (
    SELECT tags FROM tutorials WHERE id = p_tutorial_id
  )
  SELECT DISTINCT t.*
  FROM tutorials t, tutorial_tags tt
  WHERE t.id != p_tutorial_id
  AND t.tags && tt.tags  -- Check for any tag overlap
  ORDER BY array_length(array(
    SELECT UNNEST(t.tags)
    INTERSECT
    SELECT UNNEST(tt.tags)
  ), 1) DESC,  -- Order by number of matching tags
  t.views DESC
  LIMIT p_limit;
$$; 