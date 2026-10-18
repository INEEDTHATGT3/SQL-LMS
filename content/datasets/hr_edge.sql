-- hr_edge: same columns as hr.sql, rows chosen to break naive queries. PostgreSQL.
--
-- departments(dept_id PK, dept_name UNIQUE, location)
-- employees(emp_id PK, first_name, last_name, email UNIQUE NULL, dept_id NULL,
--           manager_id NULL, hire_date, salary numeric(10,2) NULL, job_title, commission NULL)
-- Edge cases:
--   * NULL dept_id: 1 (CEO) and 6 (intern) vanish from INNER JOINs with departments.
--   * Two roots with manager_id NULL (1 and 6): the hierarchy has two trees.
--   * Research (4) is empty; in Support (5) all three salaries are equal
--     (no 2nd-highest salary there: the answer must be NULL / no row).
--   * 2nd-highest overall salary is a tie (2 and 3 both 150000).
--   * Exact duplicates of name + dept + salary (4, 5); emails differing only in case (4, 11).
--   * salary 0 (6) and NULL (12); commission negative (10, a clawback) and 0 (11).
--   * Same hire_date for 7, 8, 9 (ties for ORDER BY, ROW_NUMBER vs RANK).

CREATE TABLE departments (
  dept_id    integer PRIMARY KEY,
  dept_name  text NOT NULL UNIQUE,
  location   text NOT NULL
);

CREATE TABLE employees (
  emp_id      integer PRIMARY KEY,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  email       text UNIQUE,
  dept_id     integer REFERENCES departments(dept_id),
  manager_id  integer REFERENCES employees(emp_id),
  hire_date   date NOT NULL,
  salary      numeric(10,2),
  job_title   text NOT NULL,
  commission  numeric(10,2)
);

INSERT INTO departments (dept_id, dept_name, location) VALUES
  (1, 'Executive',   'Mumbai'),
  (2, 'Engineering', 'Bengaluru'),
  (3, 'Sales',       'Mumbai'),
  (4, 'Research',    'Hyderabad'),
  (5, 'Support',     'Pune');

INSERT INTO employees (emp_id, first_name, last_name, email, dept_id, manager_id, hire_date, salary, job_title, commission) VALUES
  (1,  'Anita',  'Rao',     'anita.rao@acme.io',     NULL, NULL, '2014-02-10', 250000.00, 'Chief Executive Officer', NULL),
  (2,  'Vikram', 'Mehta',   'vikram.mehta@acme.io',  2,    1,    '2015-06-01', 150000.00, 'VP Engineering',          NULL),
  (3,  'Sara',   'Khan',    'sara.khan@acme.io',     3,    1,    '2016-01-15', 150000.00, 'VP Sales',                NULL),
  (4,  'Priya',  'Sharma',  'priya.sharma@acme.io',  2,    2,    '2018-04-02',  90000.00, 'Engineer',                NULL),
  (5,  'Priya',  'Sharma',  NULL,                    2,    2,    '2019-04-02',  90000.00, 'Engineer',                NULL),
  (6,  'Dev',    'Patel',   'dev.patel@acme.io',     NULL, NULL, '2024-06-03',      0.00, 'Intern',                  NULL),
  (7,  'Nisha',  'Bose',    'nisha.bose@acme.io',    5,    1,    '2020-01-06',  60000.00, 'Support Lead',            NULL),
  (8,  'Omar',   'Sheikh',  'omar.sheikh@acme.io',   5,    7,    '2020-01-06',  60000.00, 'Support Engineer',        NULL),
  (9,  'Ravi',   'Kumar',   NULL,                    5,    7,    '2020-01-06',  60000.00, 'Support Engineer',        NULL),
  (10, 'Leela',  'Das',     'leela.das@acme.io',     3,    3,    '2021-03-01',  70000.00, 'Account Executive',   -2500.00),
  (11, 'Joy',    'Sen',     'PRIYA.SHARMA@acme.io',  3,    3,    '2021-03-01',  70000.00, 'Account Executive',       0.00),
  (12, 'Zoe',    'Thomas',  'zoe.thomas@acme.io',    2,    4,    '2024-12-31',      NULL, 'Contract Engineer',       NULL);

-- Appended for L3 basics drills (B301, B302). Same schema as hr.sql; edge rows.
CREATE TABLE audit_log (
  entry_id  integer PRIMARY KEY,
  action    text NOT NULL,
  created   text NOT NULL
);

INSERT INTO audit_log (entry_id, action, created) VALUES
  (1, 'login',  '2024-01-15 00:00:00'),
  (2, 'login',  '2024-01-15 23:59:59'),
  (3, 'logout', '2024-01-16 00:00:01');

CREATE TABLE users (
  user_id         integer PRIMARY KEY,
  username        text NOT NULL,
  deactivated_at  timestamptz
);

INSERT INTO users (user_id, username, deactivated_at) VALUES
  (1, 'arjun', NULL),
  (2, 'diya',  NULL),
  (3, 'kabir', '2024-02-01 10:00:00+00');
