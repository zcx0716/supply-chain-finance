CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unified_credit_code TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  address TEXT,
  region TEXT,
  industry TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  main_company_id TEXT NOT NULL,
  receivable_amount REAL DEFAULT 0,
  payable_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_upstreams (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS order_downstreams (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS receivable_plans (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  downstream_id TEXT NOT NULL,
  downstream_name TEXT NOT NULL,
  total_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payable_plans (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  upstream_id TEXT NOT NULL,
  upstream_name TEXT NOT NULL,
  total_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_installments (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount REAL NOT NULL,
  planned_date DATETIME NOT NULL,
  actual_date DATETIME,
  status TEXT DEFAULT 'pending',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  payer TEXT NOT NULL,
  payee TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  file_name TEXT,
  template_content TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'custom',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users (id, username, password, name, role, status) VALUES ('1', 'admin', '$2b$10$JKzkfCfgr0atLzuo2kFoOOYMXSx.zfGNRaBVYIUfztlg/p0QO.6Gm', '系统管理员', 'admin', 'active');