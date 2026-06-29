import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const app = new Hono();

const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

const convertKeys = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item));
  }
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = convertKeys(obj[key]);
    }
  }
  return result;
};

app.use('/api/*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.json({ status: 'ok' }, 200);
  }
  
  await next();
});

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'Supply Chain Finance API',
    version: '1.0.0',
    availableEndpoints: [
      '/api/auth/login',
      '/api/auth/me',
      '/api/auth/users',
      '/api/customers',
      '/api/orders',
      '/api/plans/receivable',
      '/api/plans/payable',
      '/api/payments',
      '/api/contracts',
      '/api/contracts/templates'
    ]
  });
});

const authenticateToken = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    c.set('user', payload);
    
    const db = c.env.DB;
    const user = await db.prepare('SELECT id, username, name, role, status FROM users WHERE id = ?')
      .bind(payload.id)
      .first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token', message: error.message }, 403);
  }
};

const requireAdmin = async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
};

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const db = c.env.DB;
  
  const user = await db.prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first();
  
  if (!user || user.status !== 'active') {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  const token = await sign({ id: user.id, username: user.username }, c.env.JWT_SECRET);
  
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status
    }
  });
});

app.get('/api/auth/me', authenticateToken, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

app.get('/api/auth/users', authenticateToken, requireAdmin, async (c) => {
  const db = c.env.DB;
  const users = await db.prepare('SELECT id, username, name, role, status, created_at FROM users')
    .all();
  return c.json(convertKeys(users.results));
});

app.post('/api/auth/users', authenticateToken, requireAdmin, async (c) => {
  const { username, password, name, role = 'user' } = await c.req.json();
  
  if (!username || !password || !name) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const hashedPassword = await bcrypt.hash(password, parseInt(c.env.BCRYPT_ROUNDS));
  const id = Date.now().toString();
  
  const db = c.env.DB;
  
  try {
    await db.prepare(
      'INSERT INTO users (id, username, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, username, hashedPassword, name, role, 'active').run();
    
    return c.json({ id, username, name, role, status: 'active' }, 201);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return c.json({ error: 'Username already exists' }, 400);
    }
    return c.json({ error: 'Database error' }, 500);
  }
});

app.put('/api/auth/users/:id', authenticateToken, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const { name, role, status, password } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (role) {
    updates.push('role = ?');
    params.push(role);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, parseInt(c.env.BCRYPT_ROUNDS));
    updates.push('password = ?');
    params.push(hashedPassword);
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  params.push(id);
  
  const db = c.env.DB;
  
  try {
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params).run();
    
    const user = await db.prepare('SELECT id, username, name, role, status, created_at FROM users WHERE id = ?')
      .bind(id).first();
    
    return c.json(user);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

app.delete('/api/auth/users/:id', authenticateToken, requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'User deleted successfully' });
});

app.get('/api/customers', authenticateToken, async (c) => {
  const db = c.env.DB;
  const customers = await db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  return c.json(convertKeys(customers.results));
});

app.get('/api/customers/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
  
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json(convertKeys(customer));
});

app.post('/api/customers', authenticateToken, async (c) => {
  const { name, unifiedCreditCode, contactPerson, contactPhone, address, region, industry } = await c.req.json();
  
  if (!name) {
    return c.json({ error: 'Name is required' }, 400);
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO customers (id, name, unified_credit_code, contact_person, contact_phone, address, region, industry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, unifiedCreditCode, contactPerson, contactPhone, address, region, industry, now, now).run();
  
  return c.json({
    id, name, unifiedCreditCode, contactPerson, contactPhone, address, region, industry,
    createdAt: now, updatedAt: now
  }, 201);
});

app.put('/api/customers/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { name, unifiedCreditCode, contactPerson, contactPhone, address, region, industry } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (name) { updates.push('name = ?'); params.push(name); }
  if (unifiedCreditCode !== undefined) { updates.push('unified_credit_code = ?'); params.push(unifiedCreditCode); }
  if (contactPerson) { updates.push('contact_person = ?'); params.push(contactPerson); }
  if (contactPhone) { updates.push('contact_phone = ?'); params.push(contactPhone); }
  if (address) { updates.push('address = ?'); params.push(address); }
  if (region) { updates.push('region = ?'); params.push(region); }
  if (industry) { updates.push('industry = ?'); params.push(industry); }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  if (updates.length === 1) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
  
  return c.json(convertKeys(customer));
});

app.delete('/api/customers/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM customers WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'Customer deleted successfully' });
});

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}${random}`;
};

app.get('/api/orders', authenticateToken, async (c) => {
  const db = c.env.DB;
  
  const orders = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  
  const ordersWithRelations = await Promise.all(orders.results.map(async (order) => {
    const upstreams = await db.prepare('SELECT * FROM order_upstreams WHERE order_id = ?').bind(order.id).all();
    const downstreams = await db.prepare('SELECT * FROM order_downstreams WHERE order_id = ?').bind(order.id).all();
    
    const mainCompany = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(order.main_company_id).first();
    
    const upstreamCompanies = await Promise.all(upstreams.results.map(async (upstream) => {
      const company = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(upstream.company_id).first();
      return { ...convertKeys(upstream), company: convertKeys(company) };
    }));
    
    const downstreamCompanies = await Promise.all(downstreams.results.map(async (downstream) => {
      const company = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(downstream.company_id).first();
      return { ...convertKeys(downstream), company: convertKeys(company) };
    }));
    
    return convertKeys({ ...order, mainCompany, upstreams: upstreamCompanies, downstreams: downstreamCompanies });
  }));
  
  return c.json(ordersWithRelations);
});

app.post('/api/orders', authenticateToken, async (c) => {
  const { mainCompany, upstreams, downstreams, receivableAmount, payableAmount, currency = 'CNY' } = await c.req.json();
  
  if (!mainCompany || !mainCompany.id) {
    return c.json({ error: 'Main company is required' }, 400);
  }
  
  const id = Date.now().toString();
  const orderNo = generateOrderNo();
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO orders (id, order_no, main_company_id, receivable_amount, payable_amount, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, orderNo, mainCompany.id, receivableAmount, payableAmount, currency, 'active', now, now).run();
  
  if (upstreams && upstreams.length > 0) {
    for (const upstream of upstreams) {
      const upstreamId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.prepare(
        'INSERT INTO order_upstreams (id, order_id, company_id, amount) VALUES (?, ?, ?, ?)'
      ).bind(upstreamId, id, upstream.company.id, upstream.amount).run();
    }
  }
  
  if (downstreams && downstreams.length > 0) {
    for (const downstream of downstreams) {
      const downstreamId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.prepare(
        'INSERT INTO order_downstreams (id, order_id, company_id, amount) VALUES (?, ?, ?, ?)'
      ).bind(downstreamId, id, downstream.company.id, downstream.amount).run();
    }
  }
  
  return c.json({
    id, orderNo, mainCompany, upstreams: upstreams || [], downstreams: downstreams || [],
    receivableAmount, payableAmount, currency, status: 'active',
    createdAt: now, updatedAt: now
  }, 201);
});

app.put('/api/orders/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { receivableAmount, payableAmount, currency, status } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (receivableAmount !== undefined) { updates.push('receivable_amount = ?'); params.push(receivableAmount); }
  if (payableAmount !== undefined) { updates.push('payable_amount = ?'); params.push(payableAmount); }
  if (currency) { updates.push('currency = ?'); params.push(currency); }
  if (status) { updates.push('status = ?'); params.push(status); }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  if (updates.length === 1) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  
  return c.json(convertKeys(order));
});

app.delete('/api/orders/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  await db.prepare('DELETE FROM order_upstreams WHERE order_id = ?').bind(id).run();
  await db.prepare('DELETE FROM order_downstreams WHERE order_id = ?').bind(id).run();
  await db.prepare('DELETE FROM receivable_plans WHERE order_id = ?').bind(id).run();
  await db.prepare('DELETE FROM payable_plans WHERE order_id = ?').bind(id).run();
  await db.prepare('DELETE FROM payment_records WHERE order_id = ?').bind(id).run();
  await db.prepare('DELETE FROM contracts WHERE order_id = ?').bind(id).run();
  
  return c.json({ message: 'Order deleted successfully' });
});

app.get('/api/plans/receivable', authenticateToken, async (c) => {
  const db = c.env.DB;
  
  const plans = await db.prepare('SELECT * FROM receivable_plans ORDER BY created_at DESC').all();
  
  const plansWithInstallments = await Promise.all(plans.results.map(async (plan) => {
    const installments = await db.prepare('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?')
      .bind(plan.id, 'receivable').all();
    return convertKeys({ ...plan, installments: installments.results });
  }));
  
  return c.json(plansWithInstallments);
});

app.post('/api/plans/receivable', authenticateToken, async (c) => {
  const { orderId, downstreamId, downstreamName, totalAmount, installments } = await c.req.json();
  
  if (!orderId || !downstreamId || !downstreamName || !totalAmount) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO receivable_plans (id, order_id, downstream_id, downstream_name, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, orderId, downstreamId, downstreamName, totalAmount, now).run();
  
  if (installments && installments.length > 0) {
    for (const installment of installments) {
      const installmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.prepare(
        'INSERT INTO payment_installments (id, plan_id, plan_type, amount, planned_date, actual_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(installmentId, id, 'receivable', installment.amount, installment.plannedDate, installment.actualDate, installment.status || 'pending', installment.notes).run();
    }
  }
  
  return c.json({
    id, orderId, downstreamId, downstreamName, totalAmount,
    installments: installments || [], created_at: now
  }, 201);
});

app.get('/api/plans/payable', authenticateToken, async (c) => {
  const db = c.env.DB;
  
  const plans = await db.prepare('SELECT * FROM payable_plans ORDER BY created_at DESC').all();
  
  const plansWithInstallments = await Promise.all(plans.results.map(async (plan) => {
    const installments = await db.prepare('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?')
      .bind(plan.id, 'payable').all();
    return convertKeys({ ...plan, installments: installments.results });
  }));
  
  return c.json(plansWithInstallments);
});

app.post('/api/plans/payable', authenticateToken, async (c) => {
  const { orderId, upstreamId, upstreamName, totalAmount, installments } = await c.req.json();
  
  if (!orderId || !upstreamId || !upstreamName || !totalAmount) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO payable_plans (id, order_id, upstream_id, upstream_name, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, orderId, upstreamId, upstreamName, totalAmount, now).run();
  
  if (installments && installments.length > 0) {
    for (const installment of installments) {
      const installmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.prepare(
        'INSERT INTO payment_installments (id, plan_id, plan_type, amount, planned_date, actual_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(installmentId, id, 'payable', installment.amount, installment.plannedDate, installment.actualDate, installment.status || 'pending', installment.notes).run();
    }
  }
  
  return c.json({
    id, orderId, upstreamId, upstreamName, totalAmount,
    installments: installments || [], created_at: now
  }, 201);
});

app.delete('/api/plans/receivable/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM receivable_plans WHERE id = ?').bind(id).run();
  await db.prepare('DELETE FROM payment_installments WHERE plan_id = ?').bind(id).run();
  
  return c.json({ message: 'Receivable plan deleted' });
});

app.delete('/api/plans/payable/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM payable_plans WHERE id = ?').bind(id).run();
  await db.prepare('DELETE FROM payment_installments WHERE plan_id = ?').bind(id).run();
  
  return c.json({ message: 'Payable plan deleted' });
});

app.put('/api/plans/installment/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { amount, plannedDate, actualDate, status, notes } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
  if (plannedDate) { updates.push('planned_date = ?'); params.push(plannedDate); }
  if (actualDate !== undefined) { updates.push('actual_date = ?'); params.push(actualDate); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  
  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  params.push(id);
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE payment_installments SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  return c.json({ message: 'Installment updated' });
});

app.get('/api/payments', authenticateToken, async (c) => {
  const db = c.env.DB;
  const records = await db.prepare('SELECT * FROM payment_records ORDER BY created_at DESC').all();
  return c.json(convertKeys(records.results));
});

app.post('/api/payments', authenticateToken, async (c) => {
  const { orderId, amount, date, payer, payee, notes } = await c.req.json();
  
  if (!orderId || !amount || !date || !payer || !payee) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO payment_records (id, order_id, amount, date, payer, payee, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, orderId, amount, date, payer, payee, notes, now).run();
  
  return c.json({ id, orderId, amount, date, payer, payee, notes, created_at: now }, 201);
});

app.put('/api/payments/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { amount, date, payer, payee, notes } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
  if (date) { updates.push('date = ?'); params.push(date); }
  if (payer) { updates.push('payer = ?'); params.push(payer); }
  if (payee) { updates.push('payee = ?'); params.push(payee); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  
  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  params.push(id);
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE payment_records SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  const record = await db.prepare('SELECT * FROM payment_records WHERE id = ?').bind(id).first();
  
  return c.json(convertKeys(record));
});

app.delete('/api/payments/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM payment_records WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'Payment record deleted successfully' });
});

app.get('/api/contracts', authenticateToken, async (c) => {
  const db = c.env.DB;
  const contracts = await db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
  return c.json(convertKeys(contracts.results));
});

app.post('/api/contracts', authenticateToken, async (c) => {
  const { orderId, templateName, fileName, templateContent, status = 'draft' } = await c.req.json();
  
  if (!orderId || !templateName) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO contracts (id, order_id, template_name, file_name, template_content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, orderId, templateName, fileName, templateContent, status, now).run();
  
  return c.json({ id, orderId, templateName, fileName, templateContent, status, created_at: now }, 201);
});

app.put('/api/contracts/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { templateName, fileName, templateContent, status } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (templateName) { updates.push('template_name = ?'); params.push(templateName); }
  if (fileName) { updates.push('file_name = ?'); params.push(fileName); }
  if (templateContent !== undefined) { updates.push('template_content = ?'); params.push(templateContent); }
  if (status) { updates.push('status = ?'); params.push(status); }
  
  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  params.push(id);
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  const contract = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
  
  return c.json(contract);
});

app.delete('/api/contracts/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM contracts WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'Contract deleted successfully' });
});

app.get('/api/contracts/templates', authenticateToken, async (c) => {
  const db = c.env.DB;
  const templates = await db.prepare('SELECT * FROM contract_templates ORDER BY created_at DESC').all();
  return c.json(convertKeys(templates.results));
});

app.post('/api/contracts/templates', authenticateToken, async (c) => {
  const { name, content, type = 'custom' } = await c.req.json();
  
  if (!name || !content) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  const db = c.env.DB;
  
  await db.prepare(
    'INSERT INTO contract_templates (id, name, content, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, name, content, type, now, now).run();
  
  return c.json({ id, name, content, type, created_at: now, updated_at: now }, 201);
});

app.put('/api/contracts/templates/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const { name, content, type } = await c.req.json();
  
  const updates = [];
  const params = [];
  
  if (name) { updates.push('name = ?'); params.push(name); }
  if (content) { updates.push('content = ?'); params.push(content); }
  if (type) { updates.push('type = ?'); params.push(type); }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  if (updates.length === 1) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  const db = c.env.DB;
  
  await db.prepare(`UPDATE contract_templates SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params).run();
  
  const template = await db.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first();
  
  return c.json(template);
});

app.delete('/api/contracts/templates/:id', authenticateToken, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM contract_templates WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'Template deleted successfully' });
});

app.post('/api/init', async (c) => {
  const db = c.env.DB;
  
  await db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS customers (
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
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    main_company_id TEXT NOT NULL,
    receivable_amount REAL DEFAULT 0,
    payable_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'CNY',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS order_upstreams (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    amount REAL NOT NULL
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS order_downstreams (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    amount REAL NOT NULL
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS receivable_plans (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    downstream_id TEXT NOT NULL,
    downstream_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS payable_plans (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    upstream_id TEXT NOT NULL,
    upstream_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_installments (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    amount REAL NOT NULL,
    planned_date DATETIME NOT NULL,
    actual_date DATETIME,
    status TEXT DEFAULT 'pending',
    notes TEXT
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS payment_records (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATETIME NOT NULL,
    payer TEXT NOT NULL,
    payee TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    file_name TEXT,
    template_content TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS contract_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'custom',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const hashedPassword = await bcrypt.hash('123456', 10);
  await db.prepare(
    'INSERT OR REPLACE INTO users (id, username, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('1', 'admin', hashedPassword, '系统管理员', 'admin', 'active').run();

  return c.json({ message: 'Database initialized successfully', passwordHash: hashedPassword }, 201);
});

export default app;