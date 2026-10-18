-- events_edge: same columns as events.sql, rows chosen to break naive queries. PostgreSQL.
--
-- users(user_id PK, name, country, plan, signup_date)
-- events(event_id PK, user_id NULL, event_type, ts)
-- logins(user_id, login_date)   no key: duplicates are possible
-- Edge cases:
--   * user 1: gap of exactly 30:00 (same session) then 30:01 (new session);
--     events 3 and 4 are a double-fired duplicate with the same ts.
--   * user 2: purchase with no earlier funnel step in that session... and event 6 (visit)
--     has a larger event_id but an earlier ts than event 5: order by ts, not by id.
--   * events 7, 8: anonymous visits (user_id NULL) at the same ts.
--   * user 4: session crosses midnight (23:59:59 -> 00:00:30).
--   * user 3 has no events at all; user 4 never logs in.
--   * logins: user 1 logs in twice on 2024-01-01 (use DISTINCT dates), streak spans
--     the year boundary; user 2 streak spans leap day 2024-02-29; single-day streaks.

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
  (1, 'Asha', 'IN', 'pro',  '2023-12-20'),
  (2, 'Ben',  'US', 'free', '2024-01-15'),
  (3, 'Chen', 'SG', 'free', '2024-01-20'),
  (4, 'Dara', 'IN', 'pro',  '2024-02-01');

INSERT INTO events (event_id, user_id, event_type, ts) VALUES
  (1,  1,    'visit',        '2024-02-01 10:00:00'),
  (2,  1,    'view_product', '2024-02-01 10:30:00'),
  (3,  1,    'add_to_cart',  '2024-02-01 11:00:01'),
  (4,  1,    'add_to_cart',  '2024-02-01 11:00:01'),
  (5,  2,    'purchase',     '2024-02-02 09:00:00'),
  (6,  2,    'visit',        '2024-02-02 08:55:00'),
  (7,  NULL, 'visit',        '2024-02-02 12:00:00'),
  (8,  NULL, 'visit',        '2024-02-02 12:00:00'),
  (9,  4,    'visit',        '2024-02-03 23:59:59'),
  (10, 4,    'checkout',     '2024-02-04 00:00:30'),
  (11, 4,    'purchase',     '2024-02-04 00:01:00');

INSERT INTO logins (user_id, login_date) VALUES
  (1, '2023-12-30'), (1, '2023-12-31'), (1, '2024-01-01'), (1, '2024-01-01'), (1, '2024-01-02'),
  (2, '2024-02-28'), (2, '2024-02-29'), (2, '2024-03-01'), (2, '2024-03-03'),
  (3, '2024-05-05');
