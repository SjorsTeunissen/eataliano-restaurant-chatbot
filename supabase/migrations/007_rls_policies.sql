-- Migration 007: Row Level Security policies
-- Strategy:
--   - Public (anon) read access for menu, locations, gallery
--   - Anon can INSERT reservations and orders (chatbot flow)
--   - Anon can manage own chat sessions
--   - Authenticated (admin) has full access to all tables

-- ============================================================
-- LOCATIONS
-- ============================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read active locations
CREATE POLICY "locations_select_public"
  ON locations FOR SELECT
  USING (true);

-- Only authenticated users can modify locations
CREATE POLICY "locations_insert_authenticated"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "locations_update_authenticated"
  ON locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "locations_delete_authenticated"
  ON locations FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read menu categories
CREATE POLICY "menu_categories_select_public"
  ON menu_categories FOR SELECT
  USING (true);

-- Only authenticated users can modify categories
CREATE POLICY "menu_categories_insert_authenticated"
  ON menu_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "menu_categories_update_authenticated"
  ON menu_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "menu_categories_delete_authenticated"
  ON menu_categories FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- MENU ITEMS
-- ============================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read available menu items
CREATE POLICY "menu_items_select_public"
  ON menu_items FOR SELECT
  USING (true);

-- Only authenticated users can modify menu items
CREATE POLICY "menu_items_insert_authenticated"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "menu_items_update_authenticated"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "menu_items_delete_authenticated"
  ON menu_items FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- RESERVATIONS
-- ============================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can create a reservation (chatbot flow)
CREATE POLICY "reservations_insert_public"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read reservations
CREATE POLICY "reservations_select_authenticated"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update reservations
CREATE POLICY "reservations_update_authenticated"
  ON reservations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete reservations
CREATE POLICY "reservations_delete_authenticated"
  ON reservations FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create an order (chatbot/public flow)
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read orders
CREATE POLICY "orders_select_authenticated"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update orders
CREATE POLICY "orders_update_authenticated"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete orders
CREATE POLICY "orders_delete_authenticated"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can create order items (part of order creation)
CREATE POLICY "order_items_insert_public"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read order items
CREATE POLICY "order_items_select_authenticated"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update order items
CREATE POLICY "order_items_update_authenticated"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete order items
CREATE POLICY "order_items_delete_authenticated"
  ON order_items FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read, create, and update chat sessions
-- (sessions are identified by session_token stored in localStorage)
CREATE POLICY "chat_sessions_select_public"
  ON chat_sessions FOR SELECT
  USING (true);

CREATE POLICY "chat_sessions_insert_public"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "chat_sessions_update_public"
  ON chat_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete chat sessions
CREATE POLICY "chat_sessions_delete_authenticated"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- GALLERY IMAGES
-- ============================================================
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read active gallery images
CREATE POLICY "gallery_images_select_public"
  ON gallery_images FOR SELECT
  USING (true);

-- Only authenticated users can modify gallery images
CREATE POLICY "gallery_images_insert_authenticated"
  ON gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "gallery_images_update_authenticated"
  ON gallery_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "gallery_images_delete_authenticated"
  ON gallery_images FOR DELETE
  TO authenticated
  USING (true);
