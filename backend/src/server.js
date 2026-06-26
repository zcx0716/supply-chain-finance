const express = require('express');
const cors = require('cors');
const { PORT } = require('./utils/config');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const planRoutes = require('./routes/plans');
const paymentRoutes = require('./routes/payments');
const contractRoutes = require('./routes/contracts');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contracts', contractRoutes);

app.get('/', (req, res) => {
  res.json({
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
      '/api/contracts/templates',
      '/api/health'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});