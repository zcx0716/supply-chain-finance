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

INSERT OR IGNORE INTO users (id, username, password, name, role, status) VALUES 
('1', 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', '系统管理员', 'admin', 'active');

INSERT OR IGNORE INTO customers (id, name, unified_credit_code, contact_person, contact_phone, address, region, industry, created_at, updated_at) VALUES 
('c1', '北京主体企业有限公司', '91110000MA001ABC12', '张三', '13800138001', '北京市朝阳区建国路88号', '北京', '贸易', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c2', '上海供应商A', '91310000MA002DEF34', '李四', '13900139002', '上海市浦东新区张江高科技园区', '上海', '制造业', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3', '深圳供应商B', '91440000MA003GHI56', '王五', '13700137003', '深圳市南山区科技园', '深圳', '制造业', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c4', '哆买熊科技有限公司', '91440300MA004JKL78', '赵六', '13600136004', '广东省深圳市福田区科技园', '广东', '电子商务', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c5', '如禾农业发展有限公司', '91410000MA005MNO90', '孙七', '13500135005', '河南省郑州市农业路', '河南', '农业', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c6', '江苏鑫启旺贸易有限公司', '91320000MA006PQR12', '周八', '13400134006', '江苏省南京市中山路', '江苏', '贸易', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);