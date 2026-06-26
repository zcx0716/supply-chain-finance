const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../utils/config');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.json({
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
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, name, role = 'user' } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const id = Date.now().toString();
  
  db.run(
    'INSERT INTO users (id, username, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, username, hashedPassword, name, role, 'active'],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id,
        username,
        name,
        role,
        status: 'active'
      });
    }
  );
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, name, role, status, created_at FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

router.get('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  db.get('SELECT id, username, name, role, status, created_at FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, role, status, password } = req.body;
  
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
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    updates.push('password = ?');
    params.push(hashedPassword);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT id, username, name, role, status, created_at FROM users WHERE id = ?', [req.params.id], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    });
  });
});

router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;