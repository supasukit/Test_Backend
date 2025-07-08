const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FiatBalance = sequelize.define('FiatBalance', {
  balance_id: {
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
  currency: {
    type: DataTypes.ENUM('THB', 'USD'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'fiat_balances',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'currency']
    }
  ]
});

FiatBalance.prototype.convertTo = function(targetCurrency, exchangeRate = 1) {
  try {
    if (this.currency === targetCurrency) {
      return parseFloat(this.amount);
    }
    
    return parseFloat(this.amount) * exchangeRate;
  } catch (error) {
    throw error;
  }
};

FiatBalance.findByUserAndCurrency = async function(userId, currency) {
  try {
    return await FiatBalance.findOne({
      where: {
        user_id: userId,
        currency: currency
      },
      include: [{
        model: require('./index').User,
        as: 'user',
        attributes: ['user_id', 'username']
      }]
    });
  } catch (error) {
    throw error;
  }
};

FiatBalance.getTotalByCurrency = async function(currency) {
  try {
    const result = await FiatBalance.findOne({
      where: { currency },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        [sequelize.fn('COUNT', sequelize.col('balance_id')), 'user_count']
      ]
    });
    
    return {
      currency,
      total_amount: parseFloat(result.dataValues.total_amount) || 0,
      user_count: parseInt(result.dataValues.user_count) || 0
    };
  } catch (error) {
    throw error;
  }
};

module.exports = FiatBalance;