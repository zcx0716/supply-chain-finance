const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/receivable', authenticateToken, (req, res) => {
  db.all('SELECT * FROM receivable_plans ORDER BY created_at DESC', async (err, plans) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const plansWithInstallments = await Promise.all(plans.map(async (plan) => {
      const installments = await new Promise((resolve) => {
        db.all('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?', [plan.id, 'receivable'], (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      return { ...plan, installments };
    }));
    
    res.json(plansWithInstallments);
  });
});

router.get('/receivable/:id', authenticateToken, async (req, res) => {
  db.get('SELECT * FROM receivable_plans WHERE id = ?', [req.params.id], async (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Receivable plan not found' });
    }
    
    const installments = await new Promise((resolve) => {
      db.all('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?', [plan.id, 'receivable'], (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    res.json({ ...plan, installments });
  });
});

router.post('/receivable', authenticateToken, (req, res) => {
  const { orderId, downstreamId, downstreamName, totalAmount, installments } = req.body;
  
  if (!orderId || !downstreamId || !downstreamName || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO receivable_plans (id, order_id, downstream_id, downstream_name, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, orderId, downstreamId, downstreamName, totalAmount, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (installments && installments.length > 0) {
        installments.forEach((installment) => {
          const installmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          db.run(
            'INSERT INTO payment_installments (id, plan_id, plan_type, amount, planned_date, actual_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [installmentId, id, 'receivable', installment.amount, installment.plannedDate, installment.actualDate, installment.status || 'pending', installment.notes]
          );
        });
      }
      
      res.status(201).json({
        id,
        orderId,
        downstreamId,
        downstreamName,
        totalAmount,
        installments: installments || [],
        created_at: now
      });
    }
  );
});

router.put('/receivable/:id', authenticateToken, (req, res) => {
  const { totalAmount, downstreamName } = req.body;
  
  const updates = [];
  const params = [];
  
  if (totalAmount !== undefined) {
    updates.push('total_amount = ?');
    params.push(totalAmount);
  }
  if (downstreamName) {
    updates.push('downstream_name = ?');
    params.push(downstreamName);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE receivable_plans SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Receivable plan updated' });
  });
});

router.delete('/receivable/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM receivable_plans WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    db.run('DELETE FROM payment_installments WHERE plan_id = ?', [req.params.id]);
    res.json({ message: 'Receivable plan deleted' });
  });
});

router.get('/payable', authenticateToken, (req, res) => {
  db.all('SELECT * FROM payable_plans ORDER BY created_at DESC', async (err, plans) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const plansWithInstallments = await Promise.all(plans.map(async (plan) => {
      const installments = await new Promise((resolve) => {
        db.all('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?', [plan.id, 'payable'], (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      return { ...plan, installments };
    }));
    
    res.json(plansWithInstallments);
  });
});

router.get('/payable/:id', authenticateToken, async (req, res) => {
  db.get('SELECT * FROM payable_plans WHERE id = ?', [req.params.id], async (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Payable plan not found' });
    }
    
    const installments = await new Promise((resolve) => {
      db.all('SELECT * FROM payment_installments WHERE plan_id = ? AND plan_type = ?', [plan.id, 'payable'], (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    res.json({ ...plan, installments });
  });
});

router.post('/payable', authenticateToken, (req, res) => {
  const { orderId, upstreamId, upstreamName, totalAmount, installments } = req.body;
  
  if (!orderId || !upstreamId || !upstreamName || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO payable_plans (id, order_id, upstream_id, upstream_name, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, orderId, upstreamId, upstreamName, totalAmount, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (installments && installments.length > 0) {
        installments.forEach((installment) => {
          const installmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          db.run(
            'INSERT INTO payment_installments (id, plan_id, plan_type, amount, planned_date, actual_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [installmentId, id, 'payable', installment.amount, installment.plannedDate, installment.actualDate, installment.status || 'pending', installment.notes]
          );
        });
      }
      
      res.status(201).json({
        id,
        orderId,
        upstreamId,
        upstreamName,
        totalAmount,
        installments: installments || [],
        created_at: now
      });
    }
  );
});

router.put('/payable/:id', authenticateToken, (req, res) => {
  const { totalAmount, upstreamName } = req.body;
  
  const updates = [];
  const params = [];
  
  if (totalAmount !== undefined) {
    updates.push('total_amount = ?');
    params.push(totalAmount);
  }
  if (upstreamName) {
    updates.push('upstream_name = ?');
    params.push(upstreamName);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE payable_plans SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Payable plan updated' });
  });
});

router.delete('/payable/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM payable_plans WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    db.run('DELETE FROM payment_installments WHERE plan_id = ?', [req.params.id]);
    res.json({ message: 'Payable plan deleted' });
  });
});

router.put('/installment/:id', authenticateToken, (req, res) => {
  const { amount, plannedDate, actualDate, status, notes } = req.body;
  
  const updates = [];
  const params = [];
  
  if (amount !== undefined) {
    updates.push('amount = ?');
    params.push(amount);
  }
  if (plannedDate) {
    updates.push('planned_date = ?');
    params.push(plannedDate);
  }
  if (actualDate !== undefined) {
    updates.push('actual_date = ?');
    params.push(actualDate);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE payment_installments SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Installment updated' });
  });
});

module.exports = router;