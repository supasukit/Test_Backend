const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const OrderController = require('../controllers/OrderController');
const TransactionController = require('../controllers/TransactionController');

router.get('/', (req, res) => {
  res.json({
    message: 'Crypto Exchange API v1.0',
    description: 'RESTful API for Cryptocurrency Exchange System',
    available_endpoints: {
      users: {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'GET /api/users/:id/wallets': 'Get user wallets',
        'GET /api/users/:id/orders': 'Get user orders',
        'GET /api/users/:id/transactions': 'Get user transactions',
        'POST /api/users': 'Create new user'
      },
      cryptocurrencies: {
        'GET /api/cryptocurrencies': 'Get all cryptocurrencies',
        'GET /api/cryptocurrencies/:id': 'Get cryptocurrency by ID'
      },
      orders: {
        'GET /api/orders': 'Get all orders',
        'GET /api/orders/:id': 'Get order by ID',
        'POST /api/orders': 'Create new order'
      },
      transactions: {
        'GET /api/transactions': 'Get all transactions',
        'GET /api/transactions/:id': 'Get transaction by ID',
        'POST /api/transactions': 'Create new transaction'
      }
    },
    database_tables: [
      'users',
      'cryptocurrencies', 
      'wallets',
      'fiat_balances',
      'orders',
      'transactions'
    ],
    relationships: {
      'User -> Wallets': '1:M',
      'User -> FiatBalances': '1:M',
      'User -> Orders': '1:M',
      'User -> Transactions': '1:M (from_user_id, to_user_id)',
      'Cryptocurrency -> Wallets': '1:M',
      'Cryptocurrency -> Orders': '1:M',
      'Cryptocurrency -> Transactions': '1:M'
    }
  });
});

router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.get('/users/:id/wallets', UserController.getUserWallets);
router.get('/users/:id/fiat-balances', UserController.getUserFiatBalances);
router.get('/users/:id/orders', UserController.getUserOrders);
router.get('/users/:id/transactions', UserController.getUserTransactions);

router.get('/cryptocurrencies', async (req, res) => {
  try {
    const { Cryptocurrency } = require('../models');
    const cryptocurrencies = await Cryptocurrency.findAll({
      order: [['symbol', 'ASC']]
    });
    
    res.json({
      success: true,
      count: cryptocurrencies.length,
      data: cryptocurrencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cryptocurrencies',
      error: error.message
    });
  }
});

router.get('/cryptocurrencies/:id', async (req, res) => {
  try {
    const { Cryptocurrency } = require('../models');
    const cryptocurrency = await Cryptocurrency.findByPk(req.params.id);
    
    if (!cryptocurrency) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found'
      });
    }
    
    res.json({
      success: true,
      data: cryptocurrency
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cryptocurrency',
      error: error.message
    });
  }
});

router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.post('/orders', OrderController.createOrder);
router.get('/transactions', TransactionController.getAllTransactions);
router.get('/transactions/:id', TransactionController.getTransactionById);
router.post('/transactions', TransactionController.createTransaction);

router.get('/wallets', async (req, res) => {
  try {
    const { Wallet } = require('../models');
    const wallets = await Wallet.findAll({
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['user_id', 'username', 'email']
        },
        {
          model: require('../models').Cryptocurrency,
          as: 'cryptocurrency',
          attributes: ['crypto_id', 'symbol', 'name', 'price']
        }
      ],
      order: [['balance', 'DESC']]
    });
    
    res.json({
      success: true,
      count: wallets.length,
      data: wallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wallets',
      error: error.message
    });
  }
});


router.get('/fiat-balances', async (req, res) => {
  try {
    const { FiatBalance } = require('../models');
    const fiatBalances = await FiatBalance.findAll({
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['user_id', 'username', 'email']
        }
      ],
      order: [['amount', 'DESC']]
    });
    
    res.json({
      success: true,
      count: fiatBalances.length,
      data: fiatBalances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fiat balances',
      error: error.message
    });
  }
});

router.use((error, req, res, next) => {
  console.error('API Route Error:', error.message);
  
  res.status(error.status || 500).json({
    success: false,
    message: 'API Error',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;