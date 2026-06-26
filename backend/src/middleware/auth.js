const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const db = require('../utils/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    db.get('SELECT id, username, name, role, status FROM users WHERE id = ?', [user.id], (err, userData) => {
      if (err || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }
      req.user = userData;
      next();
    });
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };