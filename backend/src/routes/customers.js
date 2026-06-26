const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(customers);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { name, unified_credit_code, contact_person, contact_phone, address, region, industry } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO customers (id, name, unified_credit_code, contact_person, contact_phone, address, region, industry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, unified_credit_code, contact_person, contact_phone, address, region, industry, now, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id,
        name,
        unified_credit_code,
        contact_person,
        contact_phone,
        address,
        region,
        industry,
        created_at: now,
        updated_at: now
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { name, unified_credit_code, contact_person, contact_phone, address, region, industry } = req.body;
  
  const updates = [];
  const params = [];
  
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (unified_credit_code !== undefined) {
    updates.push('unified_credit_code = ?');
    params.push(unified_credit_code);
  }
  if (contact_person) {
    updates.push('contact_person = ?');
    params.push(contact_person);
  }
  if (contact_phone) {
    updates.push('contact_phone = ?');
    params.push(contact_phone);
  }
  if (address) {
    updates.push('address = ?');
    params.push(address);
  }
  if (region) {
    updates.push('region = ?');
    params.push(region);
  }
  if (industry) {
    updates.push('industry = ?');
    params.push(industry);
  }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);
  
  if (updates.length === 1) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  db.run(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
      if (err || !customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json(customer);
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

module.exports = router;