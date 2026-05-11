-- ============================================================
--  ArtsyVibe Seed Data
--  Run this file against your PostgreSQL database to populate
--  all tables with 10 rows of dummy data each.
--  Order matters — parent tables are inserted before children.
-- ============================================================

-- 1. USERS (base table for ISA hierarchy)
INSERT INTO users (name, email, password, role) VALUES
  ('Layla Hassan',    'layla@example.com',   'hashed_pw_1',  'ARTISAN'),
  ('Omar Khalid',     'omar@example.com',    'hashed_pw_2',  'ARTISAN'),
  ('Sara Ahmed',      'sara@example.com',    'hashed_pw_3',  'ARTISAN'),
  ('Nour Ali',        'nour@example.com',    'hashed_pw_4',  'ARTISAN'),
  ('Yusuf Mansour',   'yusuf@example.com',   'hashed_pw_5',  'ARTISAN'),
  ('Fatima Zahra',    'fatima@example.com',  'hashed_pw_6',  'CUSTOMER'),
  ('Kareem Nasser',   'kareem@example.com',  'hashed_pw_7',  'CUSTOMER'),
  ('Dina Samir',      'dina@example.com',    'hashed_pw_8',  'CUSTOMER'),
  ('Rami Fawzy',      'rami@example.com',    'hashed_pw_9',  'CUSTOMER'),
  ('Hana Mostafa',    'hana@example.com',    'hashed_pw_10', 'CUSTOMER'),
  ('Admin One',       'admin1@example.com',  'hashed_pw_11', 'ADMIN'),
  ('Admin Two',       'admin2@example.com',  'hashed_pw_12', 'ADMIN');

-- 2. ARTISANS (user_id 1–5)
INSERT INTO artisans (user_id, shop_name, biography, profile_picture) VALUES
  (1, 'Layla Ceramics',     'Handcrafted pottery from the heart of Cairo.',        'layla.jpg'),
  (2, 'Omar Woodworks',     'Carved wooden art inspired by Andalusian heritage.',  'omar.jpg'),
  (3, 'Sara Textiles',      'Vibrant hand-woven fabrics using natural dyes.',      'sara.jpg'),
  (4, 'Nour Jewels',        'Silver and gemstone jewelry with Moroccan motifs.',   'nour.jpg'),
  (5, 'Yusuf Leathercraft', 'Premium leather goods stitched by hand.',             'yusuf.jpg');

-- 3. CUSTOMERS (user_id 6–10)
INSERT INTO customers (user_id, address, phone) VALUES
  (6,  '12 Nile St, Cairo',       '+20-100-111-2222'),
  (7,  '88 Corniche Rd, Alex',    '+20-101-333-4444'),
  (8,  '5 Tahrir Sq, Cairo',      '+20-102-555-6666'),
  (9,  '3 Palm Ave, Giza',        '+20-103-777-8888'),
  (10, '77 Delta Blvd, Mansoura', '+20-104-999-0000');

-- 4. ADMINS (user_id 11–12)
INSERT INTO admins (user_id) VALUES (11), (12);

-- 5. PRODUCT CATEGORIES
INSERT INTO product_categories (name) VALUES
  ('Ceramics'),
  ('Woodwork'),
  ('Textiles'),
  ('Jewelry'),
  ('Leather'),
  ('Paintings'),
  ('Glasswork'),
  ('Candles'),
  ('Basketry'),
  ('Metalwork');

-- 6. PRODUCTS
--    category_id: 1=Ceramics, 2=Woodwork, 3=Textiles, 4=Jewelry, 5=Leather
--    artisan_id matches user_id of the artisan
INSERT INTO products (title, description, price, stock_quantity, adding_date, category, image_url, artisan_name, is_auction_item, artisan_id, category_id) VALUES
  ('Blue Nile Vase',        'Hand-thrown earthenware vase with cobalt glaze.',      85.00,  12, '2025-01-10', 'Ceramics', '/images/vase.jpg',     'Layla Hassan',    false, 1, 1),
  ('Carved Cedar Box',      'Decorative box with geometric Andalusian carvings.',  120.00,   8, '2025-01-15', 'Woodwork', '/images/box.jpg',      'Omar Khalid',     false, 2, 2),
  ('Berber Table Runner',   'Hand-woven runner in traditional red and gold tones.', 60.00,  20, '2025-01-20', 'Textiles', '/images/runner.jpg',   'Sara Ahmed',      false, 3, 3),
  ('Silver Crescent Ring',  'Sterling silver ring with crescent moon motif.',       45.00,  30, '2025-02-01', 'Jewelry',  '/images/ring.jpg',     'Nour Ali',        false, 4, 4),
  ('Leather Journal Cover', 'Hand-stitched full-grain leather journal wrap.',       75.00,  15, '2025-02-10', 'Leather',  '/images/journal.jpg',  'Yusuf Mansour',   false, 5, 5),
  ('Desert Sunset Plate',   'Ceramic plate painted with desert landscape.',         95.00,   6, '2025-02-15', 'Ceramics', '/images/plate.jpg',    'Layla Hassan',    true,  1, 1),
  ('Olive Wood Bowl',       'Rustic bowl turned from reclaimed olive wood.',       110.00,   4, '2025-03-01', 'Woodwork', '/images/bowl.jpg',     'Omar Khalid',     true,  2, 2),
  ('Indigo Throw Blanket',  'Lightweight indigo-dyed cotton blanket.',              90.00,  10, '2025-03-05', 'Textiles', '/images/blanket.jpg',  'Sara Ahmed',      false, 3, 3),
  ('Gold Filigree Earrings','Delicate gold-plated filigree drop earrings.',         55.00,  25, '2025-03-10', 'Jewelry',  '/images/earrings.jpg', 'Nour Ali',        false, 4, 4),
  ('Camel Leather Wallet',  'Slim bifold wallet in natural camel leather.',         50.00,  18, '2025-03-15', 'Leather',  '/images/wallet.jpg',   'Yusuf Mansour',   false, 5, 5);

-- 7. AUCTIONS
INSERT INTO auctions (starting_bid, current_highest_bid, highest_bidder_name, start_time, end_time, status, product_id, admin_id) VALUES
  ( 80.00,  95.00, 'Kareem Nasser', '2025-04-01 10:00:00', '2025-05-01 10:00:00', 'ACTIVE',   6,    11),
  (100.00, 115.00, 'Dina Samir',    '2025-04-02 12:00:00', '2025-05-02 12:00:00', 'ACTIVE',   7,    11),
  ( 50.00,  70.00, 'Rami Fawzy',    '2025-03-01 09:00:00', '2025-04-01 09:00:00', 'ENDED',    NULL, 12),
  ( 60.00,  60.00, NULL,            '2025-05-01 08:00:00', '2025-06-01 08:00:00', 'UPCOMING', NULL, 12),
  ( 40.00,  55.00, 'Hana Mostafa',  '2025-03-15 11:00:00', '2025-04-15 11:00:00', 'ENDED',    NULL, 11),
  ( 90.00,  90.00, NULL,            '2025-05-10 14:00:00', '2025-06-10 14:00:00', 'UPCOMING', NULL, 12),
  ( 70.00,  85.00, 'Fatima Zahra',  '2025-04-05 10:00:00', '2025-05-05 10:00:00', 'ACTIVE',   NULL, 11),
  (120.00, 140.00, 'Kareem Nasser', '2025-03-20 09:00:00', '2025-04-20 09:00:00', 'ENDED',    NULL, 12),
  ( 55.00,  55.00, NULL,            '2025-05-15 16:00:00', '2025-06-15 16:00:00', 'UPCOMING', NULL, 11),
  ( 75.00,  88.00, 'Dina Samir',    '2025-04-10 13:00:00', '2025-05-10 13:00:00', 'ACTIVE',   NULL, 12);

-- 8. ORDERS
INSERT INTO orders (date, status, total_amount, shipping_address, customer_id) VALUES
  ('2025-03-01', 'DELIVERED',   145.00, '12 Nile St, Cairo',        6),
  ('2025-03-05', 'SHIPPED',     120.00, '88 Corniche Rd, Alex',      7),
  ('2025-03-10', 'PROCESSING',   60.00, '5 Tahrir Sq, Cairo',        8),
  ('2025-03-15', 'DELIVERED',   170.00, '3 Palm Ave, Giza',          9),
  ('2025-03-20', 'CANCELLED',    45.00, '77 Delta Blvd, Mansoura',  10),
  ('2025-04-01', 'DELIVERED',   200.00, '12 Nile St, Cairo',         6),
  ('2025-04-05', 'SHIPPED',      75.00, '88 Corniche Rd, Alex',      7),
  ('2025-04-10', 'PROCESSING',  110.00, '5 Tahrir Sq, Cairo',        8),
  ('2025-04-15', 'DELIVERED',    90.00, '3 Palm Ave, Giza',          9),
  ('2025-04-20', 'PENDING',      55.00, '77 Delta Blvd, Mansoura',  10);

-- 9. WISHLISTS (one per customer)
INSERT INTO wishlists (date_created, customer_id) VALUES
  ('2025-01-05', 6),
  ('2025-01-10', 7),
  ('2025-01-15', 8),
  ('2025-01-20', 9),
  ('2025-01-25', 10);

-- 10. BIDS
INSERT INTO bids (bid_amount, bid_time, customer_id, auction_id) VALUES
  ( 85.00, '2025-04-02 10:15:00', 6,  1),
  ( 90.00, '2025-04-03 11:00:00', 7,  1),
  ( 95.00, '2025-04-04 09:30:00', 7,  1),
  (105.00, '2025-04-05 14:00:00', 8,  2),
  (110.00, '2025-04-06 15:30:00', 9,  2),
  (115.00, '2025-04-07 16:00:00', 8,  2),
  ( 65.00, '2025-03-10 10:00:00', 9,  3),
  ( 70.00, '2025-03-15 12:00:00', 9,  3),
  ( 50.00, '2025-04-12 11:00:00', 10, 7),
  ( 55.00, '2025-04-20 09:00:00', 6,  10);

-- 11. ORDER ITEMS
INSERT INTO order_items (quantity, price, order_id, product_id) VALUES
  (1, 85.00,  1, 1),
  (1, 60.00,  1, 3),
  (1, 120.00, 2, 2),
  (1, 60.00,  3, 3),
  (2, 85.00,  4, 1),
  (1, 45.00,  5, 4),
  (1, 95.00,  6, 6),
  (1, 75.00,  7, 5),
  (1, 110.00, 8, 7),
  (1, 90.00,  9, 8);

-- 12. PAYMENTS
INSERT INTO payments (transaction_details, date, status, amount, payment_method, order_id) VALUES
  ('TXN-001-2025', '2025-03-01', 'COMPLETED', 145.00, 'CREDIT_CARD',   1),
  ('TXN-002-2025', '2025-03-05', 'COMPLETED', 120.00, 'PAYPAL',        2),
  ('TXN-003-2025', '2025-03-10', 'PENDING',    60.00, 'BANK_TRANSFER', 3),
  ('TXN-004-2025', '2025-03-15', 'COMPLETED', 170.00, 'CREDIT_CARD',   4),
  ('TXN-005-2025', '2025-03-20', 'REFUNDED',   45.00, 'PAYPAL',        5),
  ('TXN-006-2025', '2025-04-01', 'COMPLETED', 200.00, 'CREDIT_CARD',   6),
  ('TXN-007-2025', '2025-04-05', 'COMPLETED',  75.00, 'BANK_TRANSFER', 7),
  ('TXN-008-2025', '2025-04-10', 'PENDING',   110.00, 'CREDIT_CARD',   8),
  ('TXN-009-2025', '2025-04-15', 'COMPLETED',  90.00, 'PAYPAL',        9),
  ('TXN-010-2025', '2025-04-20', 'PENDING',    55.00, 'BANK_TRANSFER', 10);

-- 13. REVIEWS
INSERT INTO reviews (rating, comment, date, customer_id, product_id) VALUES
  (5, 'Absolutely stunning vase, exactly as described!',        '2025-03-05', 6,  1),
  (4, 'Beautiful craftsmanship, slight shipping delay.',        '2025-03-10', 7,  2),
  (5, 'Love the colors and texture of the table runner.',       '2025-03-15', 8,  3),
  (4, 'Elegant ring, fits perfectly.',                          '2025-03-20', 9,  4),
  (3, 'Good quality but smaller than expected.',                '2025-03-25', 10, 5),
  (5, 'The plate is a true work of art!',                       '2025-04-05', 6,  6),
  (5, 'Olive wood bowl smells amazing and looks gorgeous.',     '2025-04-10', 7,  7),
  (4, 'Super soft blanket, great for cool evenings.',           '2025-04-15', 8,  8),
  (5, 'Earrings are delicate and beautifully made.',            '2025-04-20', 9,  9),
  (4, 'Solid leather wallet, very compact and stylish.',        '2025-04-25', 10, 10);

-- 14. WISHLIST ITEMS
INSERT INTO wishlist_items (date_added, wishlist_id, product_id) VALUES
  ('2025-02-01', 1, 2),
  ('2025-02-05', 1, 4),
  ('2025-02-10', 2, 1),
  ('2025-02-15', 2, 5),
  ('2025-02-20', 3, 3),
  ('2025-02-25', 3, 7),
  ('2025-03-01', 4, 6),
  ('2025-03-05', 4, 9),
  ('2025-03-10', 5, 8),
  ('2025-03-15', 5, 10);
