-- Add composite indexes for common query patterns
CREATE INDEX conversations_participants_last_message_idx 
    ON public.conversations(participant1_id, participant2_id, last_message_at DESC);

CREATE INDEX conversations_recent_messages_idx 
    ON public.conversations(last_message_at DESC);

-- Index for hierarchical category queries
CREATE INDEX product_categories_parent_tree_idx 
    ON public.product_categories USING btree(parent_id, name);

-- Composite index for product images ordering
CREATE INDEX product_images_position_idx 
    ON public.product_images(product_id, position);

-- Index for repair services by category
CREATE INDEX repair_services_category_idx 
    ON public.repair_services(category, name);

-- Composite index for repair shop services with price range
CREATE INDEX repair_shop_services_price_idx 
    ON public.repair_shop_services USING gin(price_range);

-- Index for unread notifications
CREATE INDEX notifications_unread_user_idx 
    ON public.notifications(user_id) 
    WHERE read = false;

-- Add validation constraints

-- Ensure last_message_at is not in the future
ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_last_message_time_check
    CHECK (last_message_at <= NOW());

-- Ensure participant1_id and participant2_id are different
ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_different_participants_check
    CHECK (participant1_id != participant2_id);

-- Product categories constraints
ALTER TABLE public.product_categories
    ADD CONSTRAINT product_categories_name_length_check
    CHECK (char_length(name) BETWEEN 2 AND 100),
    ADD CONSTRAINT product_categories_no_self_parent_check
    CHECK (id != parent_id);

-- Product images constraints
ALTER TABLE public.product_images
    ADD CONSTRAINT product_images_url_check
    CHECK (url ~ '^https?://'),
    ADD CONSTRAINT product_images_position_check
    CHECK (position >= 0);

-- Repair services constraints
ALTER TABLE public.repair_services
    ADD CONSTRAINT repair_services_name_length_check
    CHECK (char_length(name) BETWEEN 2 AND 100),
    ADD CONSTRAINT repair_services_category_check
    CHECK (category IN ('electronics', 'furniture', 'clothing', 'appliances', 'automotive', 'other'));

-- Repair shop services constraints
ALTER TABLE public.repair_shop_services
    ADD CONSTRAINT repair_shop_services_price_range_check
    CHECK (
        price_range ? 'min' AND 
        price_range ? 'max' AND 
        (price_range->>'min')::numeric >= 0 AND 
        (price_range->>'max')::numeric >= (price_range->>'min')::numeric
    ),
    ADD CONSTRAINT repair_shop_services_duration_check
    CHECK (estimated_duration > '0 minutes'::interval);

-- Notifications constraints
ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('system', 'booking', 'message', 'product', 'repair', 'review')),
    ADD CONSTRAINT notifications_title_length_check
    CHECK (char_length(title) BETWEEN 1 AND 200),
    ADD CONSTRAINT notifications_message_length_check
    CHECK (char_length(message) BETWEEN 1 AND 1000);

-- Add partial indexes for common filtered queries
CREATE INDEX products_active_idx ON public.products(created_at)
    WHERE status = 'active';

CREATE INDEX repair_shops_verified_idx ON public.repair_shops(created_at)
    WHERE is_verified = true;

-- Add text search capabilities
CREATE INDEX product_categories_text_search_idx ON public.product_categories
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX repair_services_text_search_idx ON public.repair_services
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, ''))); 