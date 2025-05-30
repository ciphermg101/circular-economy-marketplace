-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Create RLS policies for products
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Users can create products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for repair shops
CREATE POLICY "Repair shops are viewable by everyone"
    ON repair_shops FOR SELECT
    USING (true);

-- Create RLS policies for transactions
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create RLS policies for disputes
CREATE POLICY "Users can view own disputes"
    ON disputes FOR SELECT
    USING (auth.uid() = reported_by_id);

CREATE POLICY "Users can create disputes"
    ON disputes FOR INSERT
    WITH CHECK (auth.uid() = reported_by_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Create RLS policies for tutorial likes
CREATE POLICY "Users can view own tutorial likes"
    ON tutorial_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create tutorial likes"
    ON tutorial_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for refresh tokens
CREATE POLICY "Users can view own refresh tokens"
    ON refresh_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own refresh tokens"
    ON refresh_tokens FOR UPDATE, DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for product impacts
CREATE POLICY "Users can view own product impacts"
    ON product_impacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create product impacts"
    ON product_impacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for product reviews
CREATE POLICY "Users can view own product reviews"
    ON product_reviews FOR SELECT
    USING (auth.uid() = userId);

CREATE POLICY "Users can create product reviews"
    ON product_reviews FOR INSERT
    WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own product reviews"
    ON product_reviews FOR UPDATE
    USING (auth.uid() = userId);

CREATE POLICY "Users can delete own product reviews"
    ON product_reviews FOR DELETE
    USING (auth.uid() = userId);