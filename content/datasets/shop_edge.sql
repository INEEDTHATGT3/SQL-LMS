-- shop_edge: same columns as shop.sql, rows chosen to break naive queries. PostgreSQL.
--
-- categories(category_id PK, name, parent_id NULL)      3 levels: Electronics > Accessories > Cables
-- products(product_id PK, name, category_id NULL, price, stock)
-- customers(customer_id PK, name, email UNIQUE NULL, city NULL, signup_date, referred_by NULL)
-- orders(order_id PK, customer_id, order_date, status)
-- order_items(order_id, product_id, quantity, unit_price)   PK (order_id, product_id)
-- payments(payment_id PK, order_id, paid_at, amount, method)
-- Edge cases:
--   * category 4 'Gift Cards' has no products; product 4 has NULL category; product 3 costs 0.00.
--   * customer 1 has NULL email and NULL city; 2 differs from 1 only by letter case;
--     7 has an apostrophe (O'Brien); 6 and 7 never ordered.
--   * orders on 2023-12-31 / 2024-01-01 (year boundary) and two orders on leap day 2024-02-29.
--   * order 6 has no items; order 8 is delivered but unpaid;
--     cancelled order 3 was still paid; order 5 was charged twice (overpaid).
--   * order 7 returned: +1998 then -1998, so it nets to 0.
--   * payments 3 and 4 share the same paid_at.

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
  (3, 'Accessories', 1),
  (4, 'Gift Cards',  NULL),
  (5, 'Cables',      3);

INSERT INTO products (product_id, name, category_id, price, stock) VALUES
  (1, 'Pixel 8',           2,    59999.00,    5),
  (2, 'USB-C Cable',       5,      499.00,  100),
  (3, 'Free Sticker Pack', 3,        0.00, 1000),
  (4, 'Mystery Box',       NULL,   999.00,    0),
  (5, 'Phone Case',        3,      499.00,    0),
  (6, 'Refurbished Phone', 2,    29999.00,    2);

INSERT INTO customers (customer_id, name, email, city, signup_date, referred_by) VALUES
  (1, 'Aarav Shah',   NULL,                 NULL,     '2023-12-31', NULL),
  (2, 'aarav shah',   'Aarav.Shah@mail.in', 'Mumbai', '2024-01-01', NULL),
  (3, 'Meera Nair',   'meera@mail.in',      'Kochi',  '2024-02-29', 1),
  (4, 'Test User',    'test@mail.in',       NULL,     '2024-03-01', 3),
  (5, 'Kabir Rao',    'kabir@mail.in',      'Delhi',  '2024-03-01', 3),
  (6, 'Zara Khan',    'zara@mail.in',       'Delhi',  '2024-06-15', 5),
  (7, 'Sean O''Brien', 'sean@mail.ie',      'Dublin', '2024-07-04', NULL);

INSERT INTO orders (order_id, customer_id, order_date, status) VALUES
  (1, 1, '2023-12-31', 'delivered'),
  (2, 1, '2024-01-01', 'delivered'),
  (3, 2, '2024-01-01', 'cancelled'),
  (4, 3, '2024-02-29', 'delivered'),
  (5, 3, '2024-02-29', 'delivered'),
  (6, 5, '2024-03-01', 'placed'),
  (7, 4, '2024-03-02', 'returned'),
  (8, 5, '2024-12-31', 'delivered');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 59999.00), (1, 3, 5, 0.00),
  (2, 2, 3,   499.00),
  (3, 2, 1,   499.00),
  (4, 5, 1,   449.00),
  (5, 5, 1,   499.00), (5, 3, 1, 0.00),
  (7, 4, 2,   999.00),
  (8, 2, 10,  449.00), (8, 1, 1, 57999.00);

INSERT INTO payments (payment_id, order_id, paid_at, amount, method) VALUES
  (1, 1, '2023-12-31 23:59:59', 59999.00, 'card'),
  (2, 2, '2024-01-01 00:00:00',  1497.00, 'upi'),
  (3, 4, '2024-02-29 12:00:00',   449.00, 'upi'),
  (4, 5, '2024-02-29 12:00:00',   499.00, 'upi'),
  (5, 5, '2024-02-29 12:05:00',   499.00, 'upi'),
  (6, 7, '2024-03-02 10:00:00',  1998.00, 'card'),
  (7, 7, '2024-03-10 10:00:00', -1998.00, 'card'),
  (8, 3, '2024-01-01 09:00:00',   499.00, 'card');

-- Appended for L4 basics drills (B401, B403). Same schema as shop.sql; edge rows.
CREATE TABLE bookings (
  booking_id   integer PRIMARY KEY,
  equipment_id integer NOT NULL,
  start_ts     timestamp NOT NULL,
  end_ts       timestamp NOT NULL
);

INSERT INTO bookings (booking_id, equipment_id, start_ts, end_ts) VALUES
  (1, 101, '2024-05-01 08:00', '2024-05-01 09:00'),
  (2, 102, '2024-05-01 09:00', '2024-05-01 10:00');

CREATE TABLE team_docs (
  doc_id    integer PRIMARY KEY,
  tenant_id integer NOT NULL,
  body      text NOT NULL
);

INSERT INTO team_docs (doc_id, tenant_id, body) VALUES
  (1, 7, 'onboarding guide'),
  (2, 9, 'roadmap 2024');
