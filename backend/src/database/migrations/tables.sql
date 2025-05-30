-- tables.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    verification_status TEXT DEFAULT 'unverified',
    type TEXT DEFAULT 'buyer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    condition TEXT NOT NULL,
    category TEXT NOT NULL,
    location GEOGRAPHY(POINT),
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repair_shops table
CREATE TABLE IF NOT EXISTS repair_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(user_id),
    name TEXT NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT),
    business_hours JSONB,
    rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to validate business_hours format for each weekday
    CONSTRAINT business_hours_format CHECK (
        (
            (business_hours->>'monday' IS NULL OR (
                (business_hours->'monday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'monday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'tuesday' IS NULL OR (
                (business_hours->'tuesday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'tuesday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'wednesday' IS NULL OR (
                (business_hours->'wednesday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'wednesday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'thursday' IS NULL OR (
                (business_hours->'thursday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'thursday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'friday' IS NULL OR (
                (business_hours->'friday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'friday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'saturday' IS NULL OR (
                (business_hours->'saturday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'saturday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            )) AND
            (business_hours->>'sunday' IS NULL OR (
                (business_hours->'sunday'->>'open')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' AND
                (business_hours->'sunday'->>'close')::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
            ))
        )
    )
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending', -- Reference the enum
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  reported_by_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason dispute_reason NOT NULL, -- Reference the enum
  description text NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

-- Create product categories table
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tutorial_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS tutorial_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tutorial_id uuid REFERENCES tutorials(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
  updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp
);

-- Create product_impacts table
CREATE TABLE IF NOT EXISTS product_impacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products ON DELETE CASCADE UNIQUE,
    carbon_saved decimal NOT NULL DEFAULT 0 CHECK (carbon_saved >= 0),
    water_saved decimal NOT NULL DEFAULT 0 CHECK (water_saved >= 0),
    waste_saved decimal NOT NULL DEFAULT 0 CHECK (waste_saved >= 0),
    energy_saved decimal NOT NULL DEFAULT 0 CHECK (energy_saved >= 0),
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating int,
    comment text,
    productId uuid REFERENCES products(id) ON DELETE CASCADE,
    userId uuid REFERENCES profiles(id) ON DELETE CASCADE,
    isVerifiedPurchase boolean DEFAULT false,
    metadata jsonb,
    createdAt timestamp with time zone DEFAULT current_timestamp,
    updatedAt timestamp with time zone DEFAULT current_timestamp
);

-- Create indexes
CREATE INDEX IF NOT EXISTS products_location_idx ON products USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_shops_user_id ON repair_shops(user_id);
CREATE INDEX IF NOT EXISTS repair_shops_location_idx ON repair_shops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX conversations_participant1_id_idx ON public.conversations(participant1_id);
CREATE INDEX conversations_participant2_id_idx ON public.conversations(participant2_id);
CREATE INDEX tutorial_likes_user_id_idx ON tutorial_likes(user_id);
CREATE INDEX tutorial_likes_tutorial_id_idx ON tutorial_likes(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id_expires_at ON refresh_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_product_impacts_product_id ON product_impacts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_impacts_savings ON product_impacts(carbon_saved, water_saved, waste_saved, energy_saved);
CREATE INDEX IF NOT EXISTS IDX_PRODUCT_REVIEWS_PRODUCT ON product_reviews(productId);
CREATE INDEX IF NOT EXISTS IDX_PRODUCT_REVIEWS_USER ON product_reviews(userId);
CREATE INDEX IF NOT EXISTS IDX_PRODUCT_REVIEWS_RATING ON product_reviews(rating);