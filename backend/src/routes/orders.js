const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}${random}`;
};

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', async (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const ordersWithRelations = await Promise.all(orders.map(async (order) => {
      const upstreams = await new Promise((resolve) => {
        db.all('SELECT * FROM order_upstreams WHERE order_id = ?', [order.id], (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      
      const downstreams = await new Promise((resolve) => {
        db.all('SELECT * FROM order_downstreams WHERE order_id = ?', [order.id], (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      
      const mainCompany = await new Promise((resolve) => {
        db.get('SELECT * FROM customers WHERE id = ?', [order.main_company_id], (err, row) => {
          resolve(err ? null : row);
        });
      });
      
      const upstreamCompanies = await Promise.all(upstreams.map(async (upstream) => {
        const company = await new Promise((resolve) => {
          db.get('SELECT * FROM customers WHERE id = ?', [upstream.company_id], (err, row) => {
            resolve(err ? null : row);
          });
        });
        return { ...upstream, company };
      }));
      
      const downstreamCompanies = await Promise.all(downstreams.map(async (downstream) => {
        const company = await new Promise((resolve) => {
          db.get('SELECT * FROM customers WHERE id = ?', [downstream.company_id], (err, row) => {
            resolve(err ? null : row);
          });
        });
        return { ...downstream, company };
      }));
      
      return {
        ...order,
        mainCompany,
        upstreams: upstreamCompanies,
        downstreams: downstreamCompanies
      };
    }));
    
    res.json(ordersWithRelations);
  });
});

router.get('/:id', authenticateToken, async (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], async (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const upstreams = await new Promise((resolve) => {
      db.all('SELECT * FROM order_upstreams WHERE order_id = ?', [order.id], (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    const downstreams = await new Promise((resolve) => {
      db.all('SELECT * FROM order_downstreams WHERE order_id = ?', [order.id], (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    const mainCompany = await new Promise((resolve) => {
      db.get('SELECT * FROM customers WHERE id = ?', [order.main_company_id], (err, row) => {
        resolve(err ? null : row);
      });
    });
    
    const upstreamCompanies = await Promise.all(upstreams.map(async (upstream) => {
      const company = await new Promise((resolve) => {
        db.get('SELECT * FROM customers WHERE id = ?', [upstream.company_id], (err, row) => {
          resolve(err ? null : row);
        });
      });
      return { ...upstream, company };
    }));
    
    const downstreamCompanies = await Promise.all(downstreams.map(async (downstream) => {
      const company = await new Promise((resolve) => {
        db.get('SELECT * FROM customers WHERE id = ?', [downstream.company_id], (err, row) => {
          resolve(err ? null : row);
        });
      });
      return { ...downstream, company };
    }));
    
    res.json({
      ...order,
      mainCompany,
      upstreams: upstreamCompanies,
      downstreams: downstreamCompanies
    });
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { mainCompany, upstreams, downstreams, receivableAmount, payableAmount, currency = 'CNY' } = req.body;
  
  if (!mainCompany || !mainCompany.id) {
    return res.status(400).json({ error: 'Main company is required' });
  }
  
  const id = Date.now().toString();
  const orderNo = generateOrderNo();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO orders (id, order_no, main_company_id, receivable_amount, payable_amount, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, orderNo, mainCompany.id, receivableAmount, payableAmount, currency, 'active', now, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (upstreams && upstreams.length > 0) {
        upstreams.forEach((upstream) => {
          const upstreamId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          db.run(
            'INSERT INTO order_upstreams (id, order_id, company_id, amount) VALUES (?, ?, ?, ?)',
            [upstreamId, id, upstream.company.id, upstream.amount]
          );
        });
      }
      
      if (downstreams && downstreams.length > 0) {
        downstreams.forEach((downstream) => {
          const downstreamId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          db.run(
            'INSERT INTO order_downstreams (id, order_id, company_id, amount) VALUES (?, ?, ?, ?)',
            [downstreamId, id, downstream.company.id, downstream.amount]
          );
        });
      }
      
      res.status(201).json({
        id,
        orderNo,
        mainCompany,
        upstreams: upstreams || [],
        downstreams: downstreams || [],
        receivableAmount,
        payableAmount,
        currency,
        status: 'active',
        created_at: now,
        updated_at: now
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { receivableAmount, payableAmount, currency, status } = req.body;
  
  const updates = [];
  const params = [];
  
  if (receivableAmount !== undefined) {
    updates.push('receivable_amount = ?');
    params.push(receivableAmount);
  }
  if (payableAmount !== undefined) {
    updates.push('payable_amount = ?');
    params.push(payableAmount);
  }
  if (currency) {
    updates.push('currency = ?');
    params.push(currency);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);
  
  if (updates.length === 1) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  db.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
      if (err || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    db.run('DELETE FROM order_upstreams WHERE order_id = ?', [req.params.id]);
    db.run('DELETE FROM order_downstreams WHERE order_id = ?', [req.params.id]);
    db.run('DELETE FROM receivable_plans WHERE order_id = ?', [req.params.id]);
    db.run('DELETE FROM payable_plans WHERE order_id = ?', [req.params.id]);
    db.run('DELETE FROM payment_records WHERE order_id = ?', [req.params.id]);
    db.run('DELETE FROM contracts WHERE order_id = ?', [req.params.id]);
    res.json({ message: 'Order deleted successfully' });
  });
});

module.exports = router;