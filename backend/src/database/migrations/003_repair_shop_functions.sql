-- Function to find repair shops within a radius
CREATE OR REPLACE FUNCTION nearby_repair_shops(
  lat double precision,
  lng double precision,
  radius_km double precision
)
RETURNS SETOF repair_shops
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM repair_shops
  WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000  -- Convert km to meters
  );
$$;

-- Index for faster spatial queries
CREATE INDEX IF NOT EXISTS repair_shops_location_idx ON repair_shops USING GIST(location);

-- Function to find repair shops by service within a radius
CREATE OR REPLACE FUNCTION nearby_repair_shops_by_service(
  lat double precision,
  lng double precision,
  radius_km double precision,
  service_name text
)
RETURNS SETOF repair_shops
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM repair_shops
  WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000  -- Convert km to meters
  )
  AND services @> ARRAY[service_name];
$$;

-- Function to get repair shops with distance from a point
CREATE OR REPLACE FUNCTION repair_shops_with_distance(
  lat double precision,
  lng double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  services text[],
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    name,
    services,
    ST_Distance(
      location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 as distance_km
  FROM repair_shops
  ORDER BY distance_km;
$$; 