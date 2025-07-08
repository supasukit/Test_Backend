const { sequelize } = require('../config/database');

const User = require('./User');
const Cryptocurrency = require('./Cryptocurrency');
const Wallet = require('./Wallet');
const FiatBalance = require('./FiatBalance');
const Order = require('./Order');
const Transaction = require('./Transaction');



// User เป็น (1:M) 
User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });
User.hasMany(FiatBalance, { foreignKey: 'user_id', as: 'fiatBalances' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
User.hasMany(Transaction, { foreignKey: 'from_user_id', as: 'sentTransactions' });
User.hasMany(Transaction, { foreignKey: 'to_user_id', as: 'receivedTransactions' });

// Cryptocurrency เป็น (1:M) 
Cryptocurrency.hasMany(Wallet, { foreignKey: 'crypto_id', as: 'wallets' });
Cryptocurrency.hasMany(Order, { foreignKey: 'crypto_id', as: 'orders' });
Cryptocurrency.hasMany(Transaction, { foreignKey: 'crypto_id', as: 'transactions' });

// Reverse  เป็น (M:1)
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Wallet.belongsTo(Cryptocurrency, { foreignKey: 'crypto_id', as: 'cryptocurrency' });

FiatBalance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.belongsTo(Cryptocurrency, { foreignKey: 'crypto_id', as: 'cryptocurrency' });

Transaction.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
Transaction.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });
Transaction.belongsTo(Cryptocurrency, { foreignKey: 'crypto_id', as: 'cryptocurrency' });

module.exports = {
  sequelize,
  User,
  Cryptocurrency,
  Wallet,
  FiatBalance,
  Order,
  Transaction
};