const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cryptocurrency = sequelize.define('Cryptocurrency', {
  crypto_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 10],
      isUppercase: true
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'cryptocurrencies',
  timestamps: true,
  underscored: true
});

Cryptocurrency.prototype.getWallets = async function() {
  try {
    const { Wallet, User } = require('./index');
    
    return await Wallet.findAll({
      where: { crypto_id: this.crypto_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username', 'email']
      }],
      order: [['balance', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

Cryptocurrency.prototype.getOrders = async function() {
  try {
    const { Order, User } = require('./index');
    
    return await Order.findAll({
      where: { crypto_id: this.crypto_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username']
      }],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

Cryptocurrency.prototype.getTransactions = async function() {
  try {
    const { Transaction, User } = require('./index');
    
    return await Transaction.findAll({
      where: { crypto_id: this.crypto_id },
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
        }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

Cryptocurrency.prototype.getMarketData = async function() {
  try {
    const wallets = await this.getWallets();
    const orders = await this.getOrders();
    const transactions = await this.getTransactions();
    
    const totalHolders = wallets.length;
    const totalSupply = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0);
    const avgHolding = totalHolders > 0 ? totalSupply / totalHolders : 0;
    
    return {
      crypto_info: {
        crypto_id: this.crypto_id,
        symbol: this.symbol,
        name: this.name,
        price: parseFloat(this.price)
      },
      market_data: {
        total_holders: totalHolders,
        total_supply: totalSupply,
        average_holding: avgHolding,
        recent_orders: orders.length,
        recent_transactions: transactions.length
      }
    };
  } catch (error) {
    throw error;
  }
};

Cryptocurrency.getBySymbol = async function(symbol) {
  try {
    return await Cryptocurrency.findOne({
      where: { symbol: symbol.toUpperCase() }
    });
  } catch (error) {
    throw error;
  }
};

Cryptocurrency.getTopByVolume = async function(limit = 10) {
  try {
    const { Wallet } = require('./index');
    
    return await Cryptocurrency.findAll({
      include: [{
        model: Wallet,
        as: 'wallets',
        attributes: []
      }],
      attributes: [
        'crypto_id',
        'symbol',
        'name', 
        'price',
        [sequelize.fn('SUM', sequelize.col('wallets.balance')), 'total_volume']
      ],
      group: ['Cryptocurrency.crypto_id'],
      order: [[sequelize.literal('total_volume'), 'DESC']],
      limit
    });
  } catch (error) {
    throw error;
  }
};

module.exports = Cryptocurrency;