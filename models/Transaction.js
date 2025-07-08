const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  tx_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  to_user_id: {
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
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0.00000001
    }
  },
  tx_type: {
    type: DataTypes.ENUM('TRANSFER', 'TRADE', 'DEPOSIT', 'WITHDRAWAL'),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

Transaction.prototype.getValue = async function() {
  try {
    const { Cryptocurrency } = require('./index');
    const crypto = await Cryptocurrency.findByPk(this.crypto_id);
    
    return {
      amount: parseFloat(this.amount),
      price: crypto ? parseFloat(crypto.price) : 0,
      value: parseFloat(this.amount) * (crypto ? parseFloat(crypto.price) : 0),
      symbol: crypto ? crypto.symbol : 'Unknown'
    };
  } catch (error) {
    throw error;
  }
};

Transaction.prototype.getDetails = async function() {
  try {
    const { User, Cryptocurrency } = require('./index');
    
    const [fromUser, toUser, cryptocurrency] = await Promise.all([
      User.findByPk(this.from_user_id, { attributes: ['user_id', 'username'] }),
      User.findByPk(this.to_user_id, { attributes: ['user_id', 'username'] }),
      Cryptocurrency.findByPk(this.crypto_id, { attributes: ['crypto_id', 'symbol', 'name', 'price'] })
    ]);
    
    const value = await this.getValue();
    
    return {
      tx_id: this.tx_id,
      from_user: fromUser,
      to_user: toUser,
      cryptocurrency: cryptocurrency,
      amount: value.amount,
      value_usd: value.value,
      tx_type: this.tx_type,
      created_at: this.created_at
    };
  } catch (error) {
    throw error;
  }
};

Transaction.findByUser = async function(userId, txType = null) {
  try {
    const whereClause = {
      [sequelize.Op.or]: [
        { from_user_id: userId },
        { to_user_id: userId }
      ]
    };
    
    if (txType) whereClause.tx_type = txType;
    
    return await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: require('./index').User,
          as: 'fromUser',
          attributes: ['user_id', 'username']
        },
        {
          model: require('./index').User,
          as: 'toUser',
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

Transaction.getVolumeStats = async function(cryptoId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await Transaction.findOne({
      where: {
        crypto_id: cryptoId,
        created_at: {
          [sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_volume'],
        [sequelize.fn('COUNT', sequelize.col('tx_id')), 'transaction_count'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'average_amount']
      ]
    });
    
    return {
      period_days: days,
      total_volume: parseFloat(result.dataValues.total_volume) || 0,
      transaction_count: parseInt(result.dataValues.transaction_count) || 0,
      average_amount: parseFloat(result.dataValues.average_amount) || 0
    };
  } catch (error) {
    throw error;
  }
};

Transaction.getRecentActivity = async function(limit = 20) {
  try {
    return await Transaction.findAll({
      include: [
        {
          model: require('./index').User,
          as: 'fromUser',
          attributes: ['user_id', 'username']
        },
        {
          model: require('./index').User,
          as: 'toUser',
          attributes: ['user_id', 'username']
        },
        {
          model: require('./index').Cryptocurrency,
          as: 'cryptocurrency',
          attributes: ['crypto_id', 'symbol', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });
  } catch (error) {
    throw error;
  }
};

module.exports = Transaction;