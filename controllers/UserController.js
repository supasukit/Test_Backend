const { User, Wallet, FiatBalance, Order, Transaction } = require('../models');

const UserController = {
  
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['user_id', 'username', 'email', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: ['user_id', 'username', 'email', 'created_at']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  },

  async createUser(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      const user = await User.create({
        username,
        email,
        password_hash: password
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  },

  async getUserWallets(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const wallets = await user.getMyWallets();

      res.json({
        success: true,
        user_id: parseInt(id),
        count: wallets.length,
        data: wallets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user wallets',
        error: error.message
      });
    }
  },

  async getUserFiatBalances(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const fiatBalances = await user.getMyFiatBalances();

      res.json({
        success: true,
        user_id: parseInt(id),
        count: fiatBalances.length,
        data: fiatBalances
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user fiat balances',
        error: error.message
      });
    }
  },

  async getUserOrders(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.query;
      
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const orders = await user.getMyOrders(status);

      res.json({
        success: true,
        user_id: parseInt(id),
        status_filter: status || 'all',
        count: orders.length,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user orders',
        error: error.message
      });
    }
  },

  async getUserTransactions(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const transactions = await user.getMyTransactions();

      res.json({
        success: true,
        user_id: parseInt(id),
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user transactions',
        error: error.message
      });
    }
  },

  async getUserSummary(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const summary = await user.getSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user summary',
        error: error.message
      });
    }
  }
};

module.exports = UserController;