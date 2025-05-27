-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_intent_id text,
  refund_id text,
  refunded_amount decimal(10,2),
  tracking_number text,
  shipping_address text,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  reported_by_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason dispute_reason NOT NULL,
  description text NOT NULL,
  evidence_urls text[],
  resolution text,
  resolved_at timestamptz,
  resolved_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  refund_amount decimal(10,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create transaction_status enum if not exists
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM (
    'pending',
    'payment_initiated',
    'payment_completed',
    'shipped',
    'delivered',
    'completed',
    'disputed',
    'cancelled',
    'refunded'
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reported_by_id ON disputes(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by_id ON disputes(resolved_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a transaction can be disputed
CREATE OR REPLACE FUNCTION can_dispute_transaction(transaction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  transaction_status transaction_status;
  dispute_count integer;
BEGIN
  -- Get transaction status
  SELECT status INTO transaction_status
  FROM transactions
  WHERE id = transaction_id;

  -- Get number of existing disputes
  SELECT COUNT(*) INTO dispute_count
  FROM disputes
  WHERE transaction_id = transaction_id;

  -- Can dispute if transaction is completed/delivered and no existing disputes
  RETURN (
    transaction_status IN ('completed', 'delivered')
    AND dispute_count = 0
  );
END;
$$; 