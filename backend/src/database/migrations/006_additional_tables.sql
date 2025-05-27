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

-- Create product images table
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repair shop services table
CREATE TABLE public.repair_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repair shop services junction table
CREATE TABLE public.repair_shop_services (
    shop_id UUID REFERENCES public.repair_shops(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.repair_services(id) ON DELETE CASCADE,
    price_range JSONB,
    estimated_duration INTERVAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (shop_id, service_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify existing tables

-- Add category reference to products table
ALTER TABLE public.products 
    DROP COLUMN category,
    ADD COLUMN category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- Drop images array from products table (now using product_images table)
ALTER TABLE public.products 
    DROP COLUMN images;

-- Drop services array from repair_shops table (now using repair_shop_services table)
ALTER TABLE public.repair_shops 
    DROP COLUMN services;

-- Add indexes
CREATE INDEX conversations_participant1_id_idx ON public.conversations(participant1_id);
CREATE INDEX conversations_participant2_id_idx ON public.conversations(participant2_id);
CREATE INDEX product_images_product_id_idx ON public.product_images(product_id);
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_read_idx ON public.notifications(read);
CREATE INDEX repair_shop_services_shop_id_idx ON public.repair_shop_services(shop_id);
CREATE INDEX repair_shop_services_service_id_idx ON public.repair_shop_services(service_id);

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_shop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() IN (participant1_id, participant2_id));

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IN (participant1_id, participant2_id));

-- Product categories policies
CREATE POLICY "Product categories are viewable by everyone"
    ON public.product_categories FOR SELECT
    USING (true);

-- Product images policies
CREATE POLICY "Product images are viewable by everyone"
    ON public.product_images FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their product images"
    ON public.product_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_images.product_id
            AND products.user_id = auth.uid()
        )
    );

-- Repair services policies
CREATE POLICY "Repair services are viewable by everyone"
    ON public.repair_services FOR SELECT
    USING (true);

-- Repair shop services policies
CREATE POLICY "Repair shop services are viewable by everyone"
    ON public.repair_shop_services FOR SELECT
    USING (true);

CREATE POLICY "Repair shops can manage their services"
    ON public.repair_shop_services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.repair_shops
            WHERE repair_shops.id = repair_shop_services.shop_id
            AND repair_shops.user_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Add triggers for updating timestamps
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_services_updated_at
    BEFORE UPDATE ON public.repair_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 