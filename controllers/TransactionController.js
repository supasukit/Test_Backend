const { Transaction, User, Cryptocurrency } = require('../models');

const TransactionController = {

  async getAllTransactions(req, res) {
    try {
      const { tx_type, crypto_id, user_id, limit = 50 } = req.query;
      const whereClause = {};

      if (tx_type) whereClause.tx_type = tx_type;
      if (crypto_id) whereClause.crypto_id = crypto_id;
      if (user_id) {
        whereClause[sequelize.Op.or] = [
          { from_user_id: user_id },
          { to_user_id: user_id }
        ];
      }

      const transactions = await Transaction.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['user_id', 'username']
          },
          {
            model: User,
            as: 'toUser',
            attributes: ['user_id', 'username']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name', 'price']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit)
      });

      const totalValue = await Promise.all(
        transactions.map(async (tx) => {
          const value = await tx.getValue();
          return value.value;
        })
      );
      
      const totalValueSum = totalValue.reduce((sum, val) => sum + val, 0);

      res.json({
        success: true,
        filters: { tx_type, crypto_id, user_id },
        count: transactions.length,
        total_value: totalValueSum,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching transactions',
        error: error.message
      });
    }
  },

  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      
      const transaction = await Transaction.findByPk(id, {
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['user_id', 'username', 'email']
          },
          {
            model: User,
            as: 'toUser',
            attributes: ['user_id', 'username', 'email']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name', 'price']
          }
        ]
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const details = await transaction.getDetails();

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction',
        error: error.message
      });
    }
  },

  async createTransaction(req, res) {
    try {
      const { from_user_id, to_user_id, crypto_id, amount, tx_type } = req.body;

      if (!from_user_id || !to_user_id || !crypto_id || !amount || !tx_type) {
        return res.status(400).json({
          success: false,
          message: 'from_user_id, to_user_id, crypto_id, amount, and tx_type are required'
        });
      }

      if (!['TRANSFER', 'TRADE', 'DEPOSIT', 'WITHDRAWAL'].includes(tx_type)) {
        return res.status(400).json({
          success: false,
          message: 'tx_type must be TRANSFER, TRADE, DEPOSIT, or WITHDRAWAL'
        });
      }

      const fromUser = await User.findByPk(from_user_id);
      if (!fromUser) {
        return res.status(404).json({
          success: false,
          message: 'From user not found'
        });
      }

      const toUser = await User.findByPk(to_user_id);
      if (!toUser) {
        return res.status(404).json({
          success: false,
          message: 'To user not found'
        });
      }

      const cryptocurrency = await Cryptocurrency.findByPk(crypto_id);
      if (!cryptocurrency) {
        return res.status(404).json({
          success: false,
          message: 'Cryptocurrency not found'
        });
      }

      const transaction = await Transaction.create({
        from_user_id,
        to_user_id,
        crypto_id,
        amount,
        tx_type
      });

      const newTransaction = await Transaction.findByPk(transaction.tx_id, {
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['user_id', 'username']
          },
          {
            model: User,
            as: 'toUser',
            attributes: ['user_id', 'username']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name']
          }
        ]
      });

      const value = await newTransaction.getValue();

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          ...newTransaction.toJSON(),
          value_usd: value.value
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating transaction',
        error: error.message
      });
    }
  },

  async getRecentActivity(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const transactions = await Transaction.getRecentActivity(parseInt(limit));

      res.json({
        success: true,
        message: 'Recent transaction activity',
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching recent activity',
        error: error.message
      });
    }
  },

  async getVolumeStats(req, res) {
    try {
      const { crypto_id } = req.params;
      const { days = 7 } = req.query;

      const cryptocurrency = await Cryptocurrency.findByPk(crypto_id);
      if (!cryptocurrency) {
        return res.status(404).json({
          success: false,
          message: 'Cryptocurrency not found'
        });
      }

      const stats = await Transaction.getVolumeStats(crypto_id, parseInt(days));

      res.json({
        success: true,
        crypto_id: parseInt(crypto_id),
        cryptocurrency: {
          symbol: cryptocurrency.symbol,
          name: cryptocurrency.name
        },
        volume_stats: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching volume stats',
        error: error.message
      });
    }
  },

  async getUserTransactionHistory(req, res) {
    try {
      const { user_id } = req.params;
      const { tx_type, limit = 50 } = req.query;

      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const transactions = await Transaction.findByUser(user_id, tx_type);

      res.json({
        success: true,
        user_id: parseInt(user_id),
        tx_type_filter: tx_type || 'all',
        count: transactions.length,
        data: transactions.slice(0, parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user transaction history',
        error: error.message
      });
    }
  }
};

module.exports = TransactionController;