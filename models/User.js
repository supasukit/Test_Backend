const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.prototype.getMyWallets = async function() {
  try {
    const { Wallet, Cryptocurrency } = require('./index');
    
    return await Wallet.findAll({
      where: { user_id: this.user_id },
      include: [{
        model: Cryptocurrency,
        as: 'cryptocurrency',
        attributes: ['crypto_id', 'symbol', 'name', 'price']
      }],
      order: [['balance', 'DESC']]
    });
  } catch (error) {
    console.error('Error getting user wallets:', error.message);
    throw error;
  }
};

User.prototype.getMyFiatBalances = async function() {
  try {
    const { FiatBalance } = require('./index');
    
    return await FiatBalance.findAll({
      where: { user_id: this.user_id },
      order: [['currency', 'ASC']]
    });
  } catch (error) {
    console.error('Error getting user fiat balances:', error.message);
    throw error;
  }
};

User.prototype.getMyOrders = async function(status = null) {
  try {
    const { Order, Cryptocurrency } = require('./index');
    
    const whereClause = { user_id: this.user_id };
    if (status) {
      whereClause.status = status;
    }
    
    return await Order.findAll({
      where: whereClause,
      include: [{
        model: Cryptocurrency,
        as: 'cryptocurrency',
        attributes: ['crypto_id', 'symbol', 'name', 'price']
      }],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error getting user orders:', error.message);
    throw error;
  }
};

User.prototype.getMyTransactions = async function() {
  try {
    const { Transaction, Cryptocurrency } = require('./index');
    
    return await Transaction.findAll({
      where: {
        [sequelize.Op.or]: [
          { from_user_id: this.user_id },
          { to_user_id: this.user_id }
        ]
      },
      include: [
        {
          model: Cryptocurrency,
          as: 'cryptocurrency',
          attributes: ['crypto_id', 'symbol', 'name']
        },
        {
          model: User,
          as: 'fromUser',
          attributes: ['user_id', 'username']
        },
        {
          model: User,
          as: 'toUser',
          attributes: ['user_id', 'username']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error getting user transactions:', error.message);
    throw error;
  }
};


User.prototype.getSummary = async function() {
  try {
    const wallets = await this.getMyWallets();
    const fiatBalances = await this.getMyFiatBalances();
    const orders = await this.getMyOrders();
    const transactions = await this.getMyTransactions();
    
    return {
      user_info: {
        user_id: this.user_id,
        username: this.username,
        email: this.email,
        created_at: this.created_at
      },
      summary: {
        total_wallets: wallets.length,
        total_fiat_balances: fiatBalances.length,
        total_orders: orders.length,
        total_transactions: transactions.length
      },
      data: {
        wallets,
        fiat_balances: fiatBalances,
        recent_orders: orders.slice(0, 5),
        recent_transactions: transactions.slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Error getting user summary:', error.message);
    throw error;
  }
};


User.prototype.getTotalWalletValue = async function() {
  try {
    const wallets = await this.getMyWallets();
    
    let totalValue = 0;
    wallets.forEach(wallet => {
      if (wallet.cryptocurrency && wallet.cryptocurrency.price) {
        totalValue += wallet.balance * wallet.cryptocurrency.price;
      }
    });
    
    return {
      total_value_usd: totalValue,
      wallets_count: wallets.length,
      breakdown: wallets.map(wallet => ({
        symbol: wallet.cryptocurrency?.symbol || 'Unknown',
        balance: wallet.balance,
        price: wallet.cryptocurrency?.price || 0,
        value: wallet.balance * (wallet.cryptocurrency?.price || 0)
      }))
    };
  } catch (error) {
    console.error('Error calculating total wallet value:', error.message);
    throw error;
  }
};


User.findWithFullData = async function(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return await user.getSummary();
  } catch (error) {
    console.error('Error finding user with full data:', error.message);
    throw error;
  }
};

User.getTopTraders = async function(limit = 10) {
  try {
    const { Order } = require('./index');
    
    return await User.findAll({
      include: [{
        model: Order,
        as: 'orders',
        attributes: []
      }],
      attributes: [
        'user_id',
        'username',
        'email',
        [sequelize.fn('COUNT', sequelize.col('orders.order_id')), 'order_count']
      ],
      group: ['User.user_id'],
      order: [[sequelize.literal('order_count'), 'DESC']],
      limit
    });
  } catch (error) {
    console.error('Error getting top traders:', error.message);
    throw error;
  }
};

module.exports = User;