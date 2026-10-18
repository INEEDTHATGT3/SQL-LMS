-- events: product analytics for a shopping app, January 2024. PostgreSQL.
--
-- users(user_id PK, name, country, plan 'free' | 'pro', signup_date)
-- events(event_id PK, user_id FK NULL, event_type, ts timestamp)
--   event_type funnel: visit -> view_product -> add_to_cart -> checkout -> purchase
--   users reaching each step: 8 -> 7 -> 6 -> 4 -> 3
--   Sessions (new session after a gap > 30 minutes):
--     user 1 has two sessions on 2024-01-10; user 2 comes back on 01-11;
--     user 3 idles 40 minutes before checkout; user 8's session crosses midnight.
-- logins(user_id FK, login_date)   one row per user per day here (no key: see events_edge)
--   Streaks (gaps and islands): user 1 -> 3 + 2 days, user 2 -> 4, user 5 -> 5 across
--   the Jan/Feb boundary, user 7 -> 3 + 2, user 4 -> three single days, user 8 never logs in.
-- Sibling events_edge.sql has the same columns with edge-case rows.

CREATE TABLE users (
  user_id      integer PRIMARY KEY,
  name         text NOT NULL,
  country      text NOT NULL,
  plan         text NOT NULL CHECK (plan IN ('free', 'pro')),
  signup_date  date NOT NULL
);

CREATE TABLE events (
  event_id    integer PRIMARY KEY,
  user_id     integer REFERENCES users(user_id),
  event_type  text NOT NULL,
  ts          timestamp NOT NULL
);

CREATE TABLE logins (
  user_id     integer NOT NULL REFERENCES users(user_id),
  login_date  date NOT NULL
);

INSERT INTO users (user_id, name, country, plan, signup_date) VALUES
  (1, 'Asha',   'IN', 'pro',  '2024-01-02'),
  (2, 'Ben',    'US', 'free', '2024-01-03'),
  (3, 'Chen',   'SG', 'free', '2024-01-03'),
  (4, 'Dara',   'IN', 'pro',  '2024-01-05'),
  (5, 'Eli',    'GB', 'free', '2024-01-06'),
  (6, 'Fatima', 'AE', 'free', '2024-01-08'),
  (7, 'Gopal',  'IN', 'free', '2024-01-09'),
  (8, 'Hana',   'JP', 'pro',  '2024-01-10');

INSERT INTO events (event_id, user_id, event_type, ts) VALUES
  (1,  1, 'visit',        '2024-01-10 09:00:00'),
  (2,  1, 'view_product', '2024-01-10 09:02:30'),
  (3,  1, 'add_to_cart',  '2024-01-10 09:05:00'),
  (4,  1, 'checkout',     '2024-01-10 09:07:10'),
  (5,  1, 'purchase',     '2024-01-10 09:08:00'),
  (6,  1, 'visit',        '2024-01-10 14:30:00'),
  (7,  1, 'view_product', '2024-01-10 14:31:00'),
  (8,  2, 'visit',        '2024-01-10 10:00:00'),
  (9,  2, 'view_product', '2024-01-10 10:01:00'),
  (10, 2, 'add_to_cart',  '2024-01-10 10:04:00'),
  (11, 2, 'visit',        '2024-01-11 18:00:00'),
  (12, 2, 'checkout',     '2024-01-11 18:06:00'),
  (13, 3, 'visit',        '2024-01-11 08:15:00'),
  (14, 3, 'view_product', '2024-01-11 08:20:00'),
  (15, 3, 'view_product', '2024-01-11 08:26:00'),
  (16, 3, 'add_to_cart',  '2024-01-11 08:40:00'),
  (17, 3, 'checkout',     '2024-01-11 09:20:00'),
  (18, 3, 'purchase',     '2024-01-11 09:22:00'),
  (19, 4, 'visit',        '2024-01-12 12:00:00'),
  (20, 4, 'view_product', '2024-01-12 12:10:00'),
  (21, 5, 'visit',        '2024-01-12 20:00:00'),
  (22, 5, 'view_product', '2024-01-12 20:05:00'),
  (23, 5, 'add_to_cart',  '2024-01-12 20:06:00'),
  (24, 6, 'visit',        '2024-01-13 07:30:00'),
  (25, 7, 'visit',        '2024-01-13 11:00:00'),
  (26, 7, 'view_product', '2024-01-13 11:04:00'),
  (27, 7, 'add_to_cart',  '2024-01-13 11:05:00'),
  (28, 7, 'visit',        '2024-01-14 11:00:00'),
  (29, 7, 'view_product', '2024-01-14 11:02:00'),
  (30, 8, 'visit',        '2024-01-14 22:50:00'),
  (31, 8, 'view_product', '2024-01-14 23:10:00'),
  (32, 8, 'view_product', '2024-01-14 23:45:00'),
  (33, 8, 'add_to_cart',  '2024-01-15 00:05:00'),
  (34, 8, 'checkout',     '2024-01-15 00:12:00'),
  (35, 8, 'purchase',     '2024-01-15 00:15:00');

INSERT INTO logins (user_id, login_date) VALUES
  (1, '2024-01-01'), (1, '2024-01-02'), (1, '2024-01-03'), (1, '2024-01-05'), (1, '2024-01-06'),
  (2, '2024-01-02'), (2, '2024-01-03'), (2, '2024-01-04'), (2, '2024-01-05'),
  (3, '2024-01-10'),
  (4, '2024-01-01'), (4, '2024-01-03'), (4, '2024-01-05'),
  (5, '2024-01-28'), (5, '2024-01-29'), (5, '2024-01-30'), (5, '2024-01-31'), (5, '2024-02-01'),
  (6, '2024-01-07'), (6, '2024-01-08'),
  (7, '2024-01-15'), (7, '2024-01-16'), (7, '2024-01-17'), (7, '2024-01-20'), (7, '2024-01-21');
