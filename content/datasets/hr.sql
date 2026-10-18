-- hr: a small company (21 employees, 7 departments). PostgreSQL.
--
-- departments(dept_id PK, dept_name UNIQUE, location)
--   Research (7) has no employees: LEFT JOIN / NOT EXISTS practice.
-- employees(emp_id PK, first_name, last_name, email UNIQUE NULL,
--           dept_id FK -> departments NULL, manager_id FK -> employees NULL,
--           hire_date, salary numeric(10,2) NULL, job_title, commission numeric(10,2) NULL)
--   * Anita Rao (1) is the CEO: manager_id NULL. Everyone else reports up to her.
--   * Name duplicates: two Priya Sharma (5, 8), two Rahul Verma (11, 20).
--   * Salary ties: 120000 (5, 6), 95000 (9, 10), 85000 (12, 13), 52000 (15, 20).
--   * NULL email: 8, 15, 19. commission is NULL outside Sales; 20 has commission 0.
-- Sibling hr_edge.sql has the same columns with edge-case rows.

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
  (1, 'Executive',       'Mumbai'),
  (2, 'Engineering',     'Bengaluru'),
  (3, 'Sales',           'Mumbai'),
  (4, 'Marketing',       'Delhi'),
  (5, 'Finance',         'Mumbai'),
  (6, 'Human Resources', 'Pune'),
  (7, 'Research',        'Hyderabad');

INSERT INTO employees (emp_id, first_name, last_name, email, dept_id, manager_id, hire_date, salary, job_title, commission) VALUES
  (1,  'Anita',   'Rao',       'anita.rao@acme.io',        1, NULL, '2014-02-10', 250000.00, 'Chief Executive Officer', NULL),
  (2,  'Vikram',  'Mehta',     'vikram.mehta@acme.io',     2, 1,    '2015-06-01', 180000.00, 'VP Engineering',          NULL),
  (3,  'Sara',    'Khan',      'sara.khan@acme.io',        3, 1,    '2016-01-15', 160000.00, 'VP Sales',                NULL),
  (4,  'Rohan',   'Das',       'rohan.das@acme.io',        5, 1,    '2016-09-01', 150000.00, 'Finance Director',        NULL),
  (5,  'Priya',   'Sharma',    'priya.sharma@acme.io',     2, 2,    '2018-04-02', 120000.00, 'Senior Engineer',         NULL),
  (6,  'Arjun',   'Nair',      'arjun.nair@acme.io',       2, 2,    '2019-07-15', 120000.00, 'Senior Engineer',         NULL),
  (7,  'Meera',   'Iyer',      'meera.iyer@acme.io',       4, 1,    '2017-03-20', 140000.00, 'Marketing Head',          NULL),
  (8,  'Priya',   'Sharma',    NULL,                       4, 7,    '2021-01-11',  72000.00, 'Marketing Analyst',       NULL),
  (9,  'Kabir',   'Singh',     'kabir.singh@acme.io',      2, 5,    '2020-10-05',  95000.00, 'Engineer',                NULL),
  (10, 'Neha',    'Gupta',     'neha.gupta@acme.io',       2, 5,    '2022-02-14',  95000.00, 'Engineer',                NULL),
  (11, 'Rahul',   'Verma',     'rahul.verma@acme.io',      2, 6,    '2023-06-19',  78000.00, 'Junior Engineer',         NULL),
  (12, 'Deepa',   'Menon',     'deepa.menon@acme.io',      3, 3,    '2018-11-01',  85000.00, 'Account Executive',   12000.00),
  (13, 'Imran',   'Qureshi',   'imran.qureshi@acme.io',    3, 3,    '2019-02-25',  85000.00, 'Account Executive',    9500.00),
  (14, 'Tanvi',   'Joshi',     'tanvi.joshi@acme.io',      3, 3,    '2021-08-09',  68000.00, 'Sales Associate',      4000.00),
  (15, 'Karan',   'Malhotra',  NULL,                       3, 12,   '2024-01-08',  52000.00, 'Sales Associate',         NULL),
  (16, 'Farah',   'Ali',       'farah.ali@acme.io',        5, 4,    '2019-05-13',  98000.00, 'Senior Accountant',       NULL),
  (17, 'Suresh',  'Pillai',    'suresh.pillai@acme.io',    5, 16,   '2022-09-26',  64000.00, 'Accountant',              NULL),
  (18, 'Lakshmi', 'Reddy',     'lakshmi.reddy@acme.io',    6, 1,    '2017-12-04', 110000.00, 'HR Manager',              NULL),
  (19, 'Aditya',  'Kulkarni',  NULL,                       6, 18,   '2023-03-15',  58000.00, 'HR Associate',            NULL),
  (20, 'Rahul',   'Verma',     'rahul.verma2@acme.io',     3, 13,   '2024-07-01',  52000.00, 'Sales Associate',         0.00),
  (21, 'Nikhil',   'Bansal',    'nikhil.bansal@acme.io',    4, 7,    '2022-05-30',  81000.00, 'Content Strategist',      NULL);

-- Appended for L3 basics drills (B301, B302). Keep identical schema in hr_edge.
-- audit_log: timestamps stored as TEXT — the implicit-cast trap of drill B301.
CREATE TABLE audit_log (
  entry_id  integer PRIMARY KEY,
  action    text NOT NULL,
  created   text NOT NULL            -- 'YYYY-MM-DD HH24:MI:SS' stored as text
);

INSERT INTO audit_log (entry_id, action, created) VALUES
  (1, 'login',  '2024-01-15 09:12:00'),
  (2, 'logout', '2024-01-15 18:40:00'),
  (3, 'login',  '2024-01-16 08:02:00');

-- users: nullable deactivated_at — the IS NULL trap of drill B302.
CREATE TABLE users (
  user_id         integer PRIMARY KEY,
  username        text NOT NULL,
  deactivated_at  timestamptz
);

INSERT INTO users (user_id, username, deactivated_at) VALUES
  (1, 'arjun',   NULL),
  (2, 'diya',    '2024-02-01 10:00:00+00'),
  (3, 'kabir',   NULL),
  (4, 'meera',   '2024-03-15 17:30:00+00');
