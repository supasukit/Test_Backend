const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  crypto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cryptocurrencies',
      key: 'crypto_id'
    }
  },
  type: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0.00000001
    }
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true
});

Order.prototype.getTotalValue = function() {
  try {
    return parseFloat(this.amount) * parseFloat(this.price);
  } catch (error) {
    throw error;
  }
};

Order.prototype.canExecute = async function() {
  try {
    const { User, Wallet, FiatBalance } = require('./index');
    
    const user = await User.findByPk(this.user_id);
    if (!user) return false;
    
    if (this.type === 'BUY') {
      const fiatBalance = await FiatBalance.findByUserAndCurrency(this.user_id, 'USD');
      const totalCost = this.getTotalValue();
      return fiatBalance && parseFloat(fiatBalance.amount) >= totalCost;
    } else {
      const wallet = await Wallet.findByUserAndCrypto(this.user_id, this.crypto_id);
      return wallet && parseFloat(wallet.balance) >= parseFloat(this.amount);
    }
  } catch (error) {
    throw error;
  }
};

Order.findByUser = async function(userId, status = null) {
  try {
    const whereClause = { user_id: userId };
    if (status) whereClause.status = status;
    
    return await Order.findAll({
      where: whereClause,
      include: [
        {
          model: require('./index').User,
          as: 'user',
          attributes: ['user_id', 'username']
        },
        {
          model: require('./index').Cryptocurrency,
          as: 'cryptocurrency',
          attributes: ['crypto_id', 'symbol', 'name', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

Order.getMarketData = async function(cryptoId) {
  try {
    const buyOrders = await Order.findAll({
      where: {
        crypto_id: cryptoId,
        type: 'BUY',
        status: 'PENDING'
      },
      order: [['price', 'DESC']],
      limit: 10
    });
    
    const sellOrders = await Order.findAll({
      where: {
        crypto_id: cryptoId,
        type: 'SELL',
        status: 'PENDING'
      },
      order: [['price', 'ASC']],
      limit: 10
    });
    
    return {
      buy_orders: buyOrders,
      sell_orders: sellOrders,
      spread: sellOrders.length > 0 && buyOrders.length > 0 
        ? parseFloat(sellOrders[0].price) - parseFloat(buyOrders[0].price)
        : 0
    };
  } catch (error) {
    throw error;
  }
};

module.exports = Order;