CREATE TABLE IF NOT EXISTS employees (
  id integer PRIMARY KEY,
  dept_id integer NOT NULL,
  salary integer NOT NULL,
  status text NOT NULL,
  email text NOT NULL,
  created_at date NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id integer PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id integer PRIMARY KEY,
  user_id integer NOT NULL,
  created_at date NOT NULL,
  amount integer NOT NULL,
  deleted boolean NOT NULL DEFAULT false
);

INSERT INTO departments (id, name)
SELECT id, 'Department ' || id
FROM generate_series(1, 100) AS id
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, dept_id, salary, status, email, created_at)
SELECT id,
       ((id - 1) % 100) + 1,
       30000 + ((id * 37) % 170000),
       CASE WHEN id % 10 = 0 THEN 'inactive' ELSE 'active' END,
       'employee' || id || '@example.test',
       DATE '2020-01-01' + ((id - 1) % 1825)
FROM generate_series(1, 200000) AS id
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, user_id, created_at, amount, deleted)
SELECT id,
       ((id - 1) % 10000) + 1,
       DATE '2022-01-01' + ((id - 1) % 1460),
       10 + ((id * 17) % 990),
       id % 100 <> 0
FROM generate_series(1, 500000) AS id
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS employees_salary_idx ON employees (salary);
CREATE INDEX IF NOT EXISTS employees_dept_idx ON employees (dept_id);
CREATE INDEX IF NOT EXISTS employees_status_idx ON employees (status);
CREATE INDEX IF NOT EXISTS employees_active_salary_idx ON employees (salary) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS employees_email_lower_idx ON employees (lower(email));
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_active_user_created_idx ON orders (user_id, created_at DESC) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at);

ANALYZE employees;
ANALYZE departments;
ANALYZE orders;
