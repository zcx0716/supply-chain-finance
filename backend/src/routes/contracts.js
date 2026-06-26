const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM contracts ORDER BY created_at DESC', (err, contracts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(contracts);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM contracts WHERE id = ?', [req.params.id], (err, contract) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { orderId, templateName, fileName, templateContent, status = 'draft' } = req.body;
  
  if (!orderId || !templateName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO contracts (id, order_id, template_name, file_name, template_content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, orderId, templateName, fileName, templateContent, status, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id,
        orderId,
        templateName,
        fileName,
        templateContent,
        status,
        created_at: now
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { templateName, fileName, templateContent, status } = req.body;
  
  const updates = [];
  const params = [];
  
  if (templateName) {
    updates.push('template_name = ?');
    params.push(templateName);
  }
  if (fileName) {
    updates.push('file_name = ?');
    params.push(fileName);
  }
  if (templateContent !== undefined) {
    updates.push('template_content = ?');
    params.push(templateContent);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  params.push(req.params.id);
  
  db.run(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT * FROM contracts WHERE id = ?', [req.params.id], (err, contract) => {
      if (err || !contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      res.json(contract);
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM contracts WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Contract deleted successfully' });
  });
});

router.get('/templates', authenticateToken, (req, res) => {
  db.all('SELECT * FROM contract_templates ORDER BY created_at DESC', (err, templates) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(templates);
  });
});

router.get('/templates/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM contract_templates WHERE id = ?', [req.params.id], (err, template) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  });
});

router.post('/templates', authenticateToken, (req, res) => {
  const { name, content, type = 'custom' } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO contract_templates (id, name, content, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, content, type, now, now],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id,
        name,
        content,
        type,
        created_at: now,
        updated_at: now
      });
    }
  );
});

router.put('/templates/:id', authenticateToken, (req, res) => {
  const { name, content, type } = req.body;
  
  const updates = [];
  const params = [];
  
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (content) {
    updates.push('content = ?');
    params.push(content);
  }
  if (type) {
    updates.push('type = ?');
    params.push(type);
  }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);
  
  if (updates.length === 1) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  db.run(`UPDATE contract_templates SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    db.get('SELECT * FROM contract_templates WHERE id = ?', [req.params.id], (err, template) => {
      if (err || !template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    });
  });
});

router.delete('/templates/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM contract_templates WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Template deleted successfully' });
  });
});

module.exports = router;