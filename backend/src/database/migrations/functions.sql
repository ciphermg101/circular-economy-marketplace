-- Merged functions.sql

-- Create updated transaction_status type
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'pending',
        'payment_initiated',
        'payment_completed',
        'payment_failed',
        'shipped',
        'delivered',
        'completed',
        'disputed',
        'refunded',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create dispute_reason enum if not exists
DO $$ BEGIN
    CREATE TYPE dispute_reason AS ENUM (
        'item_not_received',
        'item_not_as_described',
        'damaged_item',
        'wrong_item',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Common Functions for Database Operations

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate coordinates
CREATE OR REPLACE FUNCTION validate_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location IS NOT NULL THEN
        -- Extract coordinates
        SELECT 
            ST_X(NEW.location::geometry) as lng,
            ST_Y(NEW.location::geometry) as lat
        INTO NEW.location;
        
        -- Validate coordinate ranges
        IF NOT (
            ST_X(NEW.location::geometry) BETWEEN -180 AND 180 AND
            ST_Y(NEW.location::geometry) BETWEEN -90 AND 90
        ) THEN
            RAISE EXCEPTION 'Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to find products within a radius
CREATE OR REPLACE FUNCTION nearby_products(
  lat double precision,
  lng double precision,
  radius_km double precision
)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM products
  WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000  -- Convert km to meters
  );
$$;

-- Function to find nearby repair shops
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

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  ) / 1000;  -- Convert meters to kilometers
$$; 

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

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_marketplace_impact_totals()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY marketplace_impact_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create trigger for updated_at using the common function
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON product_impacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Reference the common function

-- Create materialized view for marketplace totals
CREATE MATERIALIZED VIEW marketplace_impact_totals AS
SELECT
    SUM(carbon_saved) AS total_carbon_saved,
    SUM(water_saved) AS total_water_saved,
    SUM(waste_saved) AS total_waste_saved,
    SUM(energy_saved) AS total_energy_saved
FROM product_impacts;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_marketplace_impact_totals ON marketplace_impact_totals (total_carbon_saved, total_water_saved, total_waste_saved, total_energy_saved);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_marketplace_impact_totals()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY marketplace_impact_totals;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_marketplace_impact_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_impacts
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_marketplace_impact_totals();

-- Index for faster spatial queries
CREATE INDEX IF NOT EXISTS products_location_idx ON products USING GIST(location);
CREATE INDEX IF NOT EXISTS repair_shops_location_idx ON repair_shops USING GIST(location);