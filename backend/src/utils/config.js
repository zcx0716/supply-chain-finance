module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'supply-chain-finance-secret-key-2024',
  JWT_EXPIRES_IN: '7d',
  PORT: process.env.PORT || 3001,
  BCRYPT_ROUNDS: 10
};