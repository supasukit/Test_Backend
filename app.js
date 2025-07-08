const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize, testConnection, createDatabaseAndTables } = require('./config/database');
const apiRoutes = require('./routes/api');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.json({
    message: 'Crypto Exchange API',
    version: '1.0.0',
    description: 'API สำหรับระบบแลกเปลี่ยน Cryptocurrency',
    endpoints: {
      users: '/api/users',
      cryptocurrencies: '/api/cryptocurrencies', 
      orders: '/api/orders',
      transactions: '/api/transactions'
    },
    database: {
      tables: [
        'users',
        'cryptocurrencies', 
        'wallets',
        'fiat_balances',
        'orders',
        'transactions'
      ]
    },
    author: 'Created for Interview Test',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    res.json({
      status: 'OK',
      message: 'Application and database are running normally',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', apiRoutes);


app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot find ${req.method} ${req.originalUrl}`,
    available_routes: [
      'GET /',
      'GET /health', 
      'GET /api/users',
      'GET /api/cryptocurrencies',
      'GET /api/orders',
      'GET /api/transactions'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await testConnection();
    await createDatabaseAndTables();
    
    app.listen(PORT, () => {
      console.log(`Crypto Exchange API running on http://localhost:${PORT}`);
      console.log(`API endpoints: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  
  try {
    await sequelize.close();
    console.log('Database connection closed');
    console.log('Thank you for using Crypto Exchange API!');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
});

startServer();