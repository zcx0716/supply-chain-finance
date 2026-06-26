const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM payment_records ORDER BY created_at DESC', (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM payment_records WHERE id = ?', [req.params.id], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!record) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    res.json(record);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { orderId, amount, date, payer, payee, notes } = req.body;
  
  if (!orderId || !amount || !date || !payer || !payee) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO payment_records (id, order_id, amount, date, payer, payee, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, orderId, amount, date, payer, payee, notes, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id,
        orderId,
        amount,
        date,
        payer,
        payee,
        notes,
        created_at: now
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { amount, date, payer, payee, notes } = req.body;
  
  const updates = [];
  const params = [];
  
  if (amount !== undefined) {
    updates.push('amount = ?');
    params.push(amount);
  }
  if (date) {
    updates.push('date = ?');
    params.push(date);
  }
  if (payer) {
    updates.push('payer = ?');
    params.push(payer);
  }
  if (payee) {
    updates.push('payee = ?');
    params.push(payee);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE payment_records SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT * FROM payment_records WHERE id = ?', [req.params.id], (err, record) => {
      if (err || !record) {
        return res.status(404).json({ error: 'Payment record not found' });
      }
      res.json(record);
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM payment_records WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Payment record deleted successfully' });
  });
});

module.exports = router;