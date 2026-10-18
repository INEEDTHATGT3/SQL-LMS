-- shop: an Indian online store, orders across 2023-2024. PostgreSQL. Prices in INR.
--
-- categories(category_id PK, name, parent_id FK -> categories NULL)   3 roots, 2 levels deep
-- products(product_id PK, name, category_id FK NULL, price numeric(10,2), stock)
--   * 16 'Designing Data-Intensive Applications' was never ordered (stock 0).
-- customers(customer_id PK, name, email UNIQUE NULL, city NULL, signup_date, referred_by FK -> customers NULL)
--   * 11 Arnav Bose never ordered. Two customers named Diya Patel (2, 12).
-- orders(order_id PK, customer_id FK, order_date, status)
--   status in placed | shipped | delivered | cancelled | returned
--   * cancelled 5, 19 and placed 29, 30 have no payment.
-- order_items(order_id, product_id, quantity, unit_price)   PK (order_id, product_id)
--   * unit_price is the price paid, sometimes below the list price (sales).
-- payments(payment_id PK, order_id FK, paid_at timestamp, amount numeric(10,2), method)
--   * order 17 is split over two payments; returned orders 7 and 23 have a negative refund row.
--   * COD orders (4, 10, 22) are paid days after the order date.
-- Sibling shop_edge.sql has the same columns with edge-case rows.

CREATE TABLE categories (
  category_id  integer PRIMARY KEY,
  name         text NOT NULL,
  parent_id    integer REFERENCES categories(category_id)
);

CREATE TABLE products (
  product_id   integer PRIMARY KEY,
  name         text NOT NULL,
  category_id  integer REFERENCES categories(category_id),
  price        numeric(10,2) NOT NULL,
  stock        integer NOT NULL DEFAULT 0
);

CREATE TABLE customers (
  customer_id  integer PRIMARY KEY,
  name         text NOT NULL,
  email        text UNIQUE,
  city         text,
  signup_date  date NOT NULL,
  referred_by  integer REFERENCES customers(customer_id)
);

CREATE TABLE orders (
  order_id     integer PRIMARY KEY,
  customer_id  integer NOT NULL REFERENCES customers(customer_id),
  order_date   date NOT NULL,
  status       text NOT NULL CHECK (status IN ('placed', 'shipped', 'delivered', 'cancelled', 'returned'))
);

CREATE TABLE order_items (
  order_id     integer NOT NULL REFERENCES orders(order_id),
  product_id   integer NOT NULL REFERENCES products(product_id),
  quantity     integer NOT NULL,
  unit_price   numeric(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE payments (
  payment_id   integer PRIMARY KEY,
  order_id     integer NOT NULL REFERENCES orders(order_id),
  paid_at      timestamp NOT NULL,
  amount       numeric(10,2) NOT NULL,
  method       text NOT NULL
);

INSERT INTO categories (category_id, name, parent_id) VALUES
  (1, 'Electronics', NULL),
  (2, 'Phones',      1),
  (3, 'Laptops',     1),
  (4, 'Accessories', 1),
  (5, 'Home',        NULL),
  (6, 'Kitchen',     5),
  (7, 'Furniture',   5),
  (8, 'Books',       NULL);

INSERT INTO products (product_id, name, category_id, price, stock) VALUES
  (1,  'Pixel 8',                                2, 59999.00,  12),
  (2,  'Galaxy S23',                             2, 64999.00,   8),
  (3,  'iPhone 15',                              2, 79900.00,   5),
  (4,  'ThinkPad E14',                           3, 72000.00,   4),
  (5,  'MacBook Air M2',                         3, 99900.00,   3),
  (6,  'USB-C Charger',                          4,  1499.00, 120),
  (7,  'Wireless Earbuds',                       4,  3499.00,  60),
  (8,  'Laptop Sleeve',                          4,   999.00,  80),
  (9,  'Mixer Grinder',                          6,  3999.00,  25),
  (10, 'Air Fryer',                              6,  6499.00,  15),
  (11, 'Pressure Cooker',                        6,  2199.00,  40),
  (12, 'Study Table',                            7,  8999.00,   7),
  (13, 'Office Chair',                           7, 11999.00,   6),
  (14, 'Clean Code',                             8,   599.00,  50),
  (15, 'Database System Concepts',               8,   899.00,  30),
  (16, 'Designing Data-Intensive Applications',  8,  1299.00,   0);

INSERT INTO customers (customer_id, name, email, city, signup_date, referred_by) VALUES
  (1,  'Aarav Shah',      'aarav.shah@mail.in',      'Mumbai',    '2022-11-05', NULL),
  (2,  'Diya Patel',      'diya.patel@mail.in',      'Ahmedabad', '2022-12-18', 1),
  (3,  'Ishaan Roy',      'ishaan.roy@mail.in',      'Kolkata',   '2023-01-09', NULL),
  (4,  'Ananya Iyer',     'ananya.iyer@mail.in',     'Chennai',   '2023-02-14', 2),
  (5,  'Vivaan Gupta',    'vivaan.gupta@mail.in',    'Delhi',     '2023-03-30', 1),
  (6,  'Kiara Menon',     'kiara.menon@mail.in',     'Bengaluru', '2023-05-21', NULL),
  (7,  'Reyansh Kapoor',  'reyansh.kapoor@mail.in',  'Delhi',     '2023-08-02', 5),
  (8,  'Myra Joshi',      'myra.joshi@mail.in',      'Pune',      '2023-10-11', NULL),
  (9,  'Aditya Rao',      'aditya.rao@mail.in',      'Hyderabad', '2024-01-19', 6),
  (10, 'Sneha Kulkarni',  'sneha.kulkarni@mail.in',  'Pune',      '2024-04-07', 8),
  (11, 'Arnav Bose',      'arnav.bose@mail.in',      'Kolkata',   '2024-06-25', NULL),
  (12, 'Diya Patel',      'diya.p@mail.in',          'Mumbai',    '2024-09-03', 4);

INSERT INTO orders (order_id, customer_id, order_date, status) VALUES
  (1,  1,  '2023-01-12', 'delivered'),
  (2,  2,  '2023-01-28', 'delivered'),
  (3,  3,  '2023-02-15', 'delivered'),
  (4,  1,  '2023-03-03', 'delivered'),
  (5,  4,  '2023-03-22', 'cancelled'),
  (6,  5,  '2023-04-10', 'delivered'),
  (7,  2,  '2023-05-05', 'returned'),
  (8,  6,  '2023-06-18', 'delivered'),
  (9,  1,  '2023-07-01', 'delivered'),
  (10, 3,  '2023-08-09', 'delivered'),
  (11, 7,  '2023-09-14', 'delivered'),
  (12, 5,  '2023-10-27', 'delivered'),
  (13, 8,  '2023-11-11', 'delivered'),
  (14, 4,  '2023-11-24', 'delivered'),
  (15, 6,  '2023-12-31', 'delivered'),
  (16, 1,  '2024-01-05', 'delivered'),
  (17, 9,  '2024-01-22', 'delivered'),
  (18, 2,  '2024-02-29', 'delivered'),
  (19, 7,  '2024-03-15', 'cancelled'),
  (20, 3,  '2024-04-18', 'delivered'),
  (21, 10, '2024-05-02', 'delivered'),
  (22, 5,  '2024-06-07', 'delivered'),
  (23, 8,  '2024-07-19', 'returned'),
  (24, 1,  '2024-08-08', 'delivered'),
  (25, 9,  '2024-09-10', 'delivered'),
  (26, 6,  '2024-10-01', 'shipped'),
  (27, 12, '2024-11-15', 'shipped'),
  (28, 4,  '2024-11-29', 'delivered'),
  (29, 10, '2024-12-20', 'placed'),
  (30, 2,  '2024-12-28', 'placed');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1,  6,  2,  1499.00), (1,  14, 1,   599.00),
  (2,  1,  1, 59999.00),
  (3,  9,  1,  3999.00), (3,  11, 2,  2199.00),
  (4,  7,  1,  3499.00),
  (5,  5,  1, 99900.00),
  (6,  4,  1, 72000.00), (6,  8,  1,   999.00),
  (7,  10, 1,  6499.00),
  (8,  2,  1, 64999.00), (8,  6,  1,  1499.00),
  (9,  15, 2,   899.00),
  (10, 12, 1,  8999.00),
  (11, 3,  1, 79900.00), (11, 7,  2,  3499.00),
  (12, 13, 1, 11999.00),
  (13, 9,  1,  3799.00),
  (14, 15, 1,   899.00),
  (15, 10, 1,  5999.00), (15, 6,  1,  1499.00),
  (16, 1,  1, 57999.00),
  (17, 5,  1, 99900.00), (17, 8,  1,   999.00),
  (18, 7,  1,  3299.00), (18, 14, 3,   599.00),
  (19, 4,  1, 72000.00),
  (20, 13, 2, 11499.00),
  (21, 2,  1, 62999.00), (21, 6,  2,  1499.00),
  (22, 12, 1,  8999.00),
  (23, 10, 1,  6499.00),
  (24, 3,  1, 79900.00),
  (25, 11, 1,  2199.00),
  (26, 7,  2,  3499.00),
  (27, 14, 1,   599.00),
  (28, 4,  1, 69999.00), (28, 8,  1,   999.00),
  (29, 1,  1, 59999.00),
  (30, 13, 1, 11999.00);

INSERT INTO payments (payment_id, order_id, paid_at, amount, method) VALUES
  (1,  1,  '2023-01-12 10:15:00',   3597.00, 'card'),
  (2,  2,  '2023-01-28 19:40:00',  59999.00, 'upi'),
  (3,  3,  '2023-02-15 13:05:00',   8397.00, 'upi'),
  (4,  4,  '2023-03-06 12:00:00',   3499.00, 'cod'),
  (5,  6,  '2023-04-10 11:20:00',  72999.00, 'card'),
  (6,  7,  '2023-05-05 16:45:00',   6499.00, 'upi'),
  (7,  7,  '2023-05-20 10:00:00',  -6499.00, 'upi'),
  (8,  8,  '2023-06-18 09:10:00',  66498.00, 'card'),
  (9,  9,  '2023-07-01 22:55:00',   1798.00, 'upi'),
  (10, 10, '2023-08-12 14:00:00',   8999.00, 'cod'),
  (11, 11, '2023-09-14 18:25:00',  86898.00, 'card'),
  (12, 12, '2023-10-27 12:40:00',  11999.00, 'netbanking'),
  (13, 13, '2023-11-11 00:05:00',   3799.00, 'upi'),
  (14, 14, '2023-11-24 15:30:00',    899.00, 'upi'),
  (15, 15, '2023-12-31 23:50:00',   7498.00, 'card'),
  (16, 16, '2024-01-05 10:10:00',  57999.00, 'card'),
  (17, 17, '2024-01-22 17:00:00',  60000.00, 'card'),
  (18, 17, '2024-01-22 17:03:00',  40899.00, 'upi'),
  (19, 18, '2024-02-29 20:20:00',   5096.00, 'upi'),
  (20, 20, '2024-04-18 11:45:00',  22998.00, 'netbanking'),
  (21, 21, '2024-05-02 09:30:00',  65997.00, 'card'),
  (22, 22, '2024-06-10 13:15:00',   8999.00, 'cod'),
  (23, 23, '2024-07-19 19:05:00',   6499.00, 'card'),
  (24, 23, '2024-08-02 10:30:00',  -6499.00, 'card'),
  (25, 24, '2024-08-08 21:10:00',  79900.00, 'card'),
  (26, 25, '2024-09-10 08:55:00',   2199.00, 'upi'),
  (27, 26, '2024-10-01 12:00:00',   6998.00, 'upi'),
  (28, 27, '2024-11-15 16:35:00',    599.00, 'upi'),
  (29, 28, '2024-11-29 23:59:00',  70998.00, 'card');

-- Appended for L4 basics drills (B401, B403). Keep identical schema in shop_edge.
-- bookings: gym equipment bookings for the CHECK-constraint drill (B401).
--   Every existing row has end_ts > start_ts on purpose: drill B401's graded
--   exercise adds CHECK (end_ts > start_ts), which must not reject seed rows.
CREATE TABLE bookings (
  booking_id   integer PRIMARY KEY,
  equipment_id integer NOT NULL,
  start_ts     timestamp NOT NULL,
  end_ts       timestamp NOT NULL
);

INSERT INTO bookings (booking_id, equipment_id, start_ts, end_ts) VALUES
  (1, 101, '2024-05-01 08:00', '2024-05-01 09:00'),
  (2, 101, '2024-05-01 10:00', '2024-05-01 11:00'),
  (3, 102, '2024-05-01 08:30', '2024-05-01 09:30');

-- team_docs: per-tenant documents for the row-level-security drill (B403).
CREATE TABLE team_docs (
  doc_id    integer PRIMARY KEY,
  tenant_id integer NOT NULL,
  body      text NOT NULL
);

INSERT INTO team_docs (doc_id, tenant_id, body) VALUES
  (1, 7, 'onboarding guide'),
  (2, 7, 'roadmap 2024'),
  (3, 9, 'private roadmap');
