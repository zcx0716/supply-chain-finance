const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

const BCRYPT_ROUNDS = 10;

const initialCustomers = [
  {
    id: 'c1',
    name: '北京主体企业有限公司',
    unifiedCreditCode: '91110000MA001ABC12',
    contactPerson: '张三',
    contactPhone: '13800138001',
    address: '北京市朝阳区建国路88号',
    region: '北京',
    industry: '贸易',
  },
  {
    id: 'c2',
    name: '上海供应商A',
    unifiedCreditCode: '91310000MA002DEF34',
    contactPerson: '李四',
    contactPhone: '13900139002',
    address: '上海市浦东新区张江高科技园区',
    region: '上海',
    industry: '制造业',
  },
  {
    id: 'c3',
    name: '深圳供应商B',
    unifiedCreditCode: '91440000MA003GHI56',
    contactPerson: '王五',
    contactPhone: '13700137003',
    address: '深圳市南山区科技园',
    region: '深圳',
    industry: '制造业',
  },
  {
    id: 'c4',
    name: '哆买熊科技有限公司',
    unifiedCreditCode: '91440300MA004JKL78',
    contactPerson: '赵六',
    contactPhone: '13600136004',
    address: '广东省深圳市福田区科技园',
    region: '广东',
    industry: '电子商务',
  },
  {
    id: 'c5',
    name: '如禾农业发展有限公司',
    unifiedCreditCode: '91410000MA005MNO90',
    contactPerson: '孙七',
    contactPhone: '13500135005',
    address: '河南省郑州市农业路',
    region: '河南',
    industry: '农业',
  },
  {
    id: 'c6',
    name: '江苏鑫启旺贸易有限公司',
    unifiedCreditCode: '91320000MA006PQR12',
    contactPerson: '周八',
    contactPhone: '13400134006',
    address: '江苏省南京市中山路',
    region: '江苏',
    industry: '贸易',
  },
];

const init = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS);
    
    db.serialize(async () => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS customers (
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
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_no TEXT UNIQUE NOT NULL,
        main_company_id TEXT NOT NULL,
        receivable_amount REAL DEFAULT 0,
        payable_amount REAL DEFAULT 0,
        currency TEXT DEFAULT 'CNY',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS order_upstreams (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        amount REAL NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS order_downstreams (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        amount REAL NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS receivable_plans (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        downstream_id TEXT NOT NULL,
        downstream_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS payable_plans (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        upstream_id TEXT NOT NULL,
        upstream_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS payment_installments (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        amount REAL NOT NULL,
        planned_date DATETIME NOT NULL,
        actual_date DATETIME,
        status TEXT DEFAULT 'pending',
        notes TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS payment_records (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        payer TEXT NOT NULL,
        payee TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        template_name TEXT NOT NULL,
        file_name TEXT,
        template_content TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS contract_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'custom',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Error checking users:', err);
          return;
        }
        if (row.count === 0) {
          db.run(
            'INSERT INTO users (id, username, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['1', 'admin', hashedPassword, '系统管理员', 'admin', 'active'],
            (err) => {
              if (err) {
                console.error('Error inserting admin user:', err);
              } else {
                console.log('Admin user created successfully');
              }
            }
          );
        } else {
          console.log('Users table already has data');
        }
      });

      db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
        if (err) {
          console.error('Error checking customers:', err);
          return;
        }
        if (row.count === 0) {
          const now = new Date().toISOString();
          initialCustomers.forEach((customer) => {
            db.run(
              'INSERT INTO customers (id, name, unified_credit_code, contact_person, contact_phone, address, region, industry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [customer.id, customer.name, customer.unifiedCreditCode, customer.contactPerson, customer.contactPhone, customer.address, customer.region, customer.industry, now, now],
              (err) => {
                if (err) {
                  console.error('Error inserting customer:', err);
                }
              }
            );
          });
          console.log('Initial customers created successfully');
        } else {
          console.log('Customers table already has data');
        }
      });
    });

    setTimeout(() => {
      db.close();
      console.log('Database initialization complete');
    }, 1000);
  } catch (error) {
    console.error('Initialization error:', error);
    db.close();
  }
};

init();