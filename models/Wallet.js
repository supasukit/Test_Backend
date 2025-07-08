const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  wallet_id: {
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
  balance: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'crypto_id']
    }
  ]
});

Wallet.prototype.getValue = async function() {
  try {
    const { Cryptocurrency } = require('./index');
    const crypto = await Cryptocurrency.findByPk(this.crypto_id);
    
    return {
      balance: parseFloat(this.balance),
      price: crypto ? parseFloat(crypto.price) : 0,
      value: parseFloat(this.balance) * (crypto ? parseFloat(crypto.price) : 0),
      symbol: crypto ? crypto.symbol : 'Unknown'
    };
  } catch (error) {
    throw error;
  }
};

Wallet.prototype.getTransactionHistory = async function() {
  try {
    const { Transaction } = require('./index');
    
    return await Transaction.findAll({
      where: {
        [sequelize.Op.and]: [
          { crypto_id: this.crypto_id },
          {
            [sequelize.Op.or]: [
              { from_user_id: this.user_id },
              { to_user_id: this.user_id }
            ]
          }
        ]
      },
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

Wallet.findByUserAndCrypto = async function(userId, cryptoId) {
  try {
    return await Wallet.findOne({
      where: {
        user_id: userId,
        crypto_id: cryptoId
      },
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
      ]
    });
  } catch (error) {
    throw error;
  }
};

Wallet.getTopHolders = async function(cryptoId, limit = 10) {
  try {
    const { User } = require('./index');
    
    return await Wallet.findAll({
      where: { crypto_id: cryptoId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username']
      }],
      order: [['balance', 'DESC']],
      limit
    });
  } catch (error) {
    throw error;
  }
};

module.exports = Wallet;