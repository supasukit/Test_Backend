require('dotenv').config();
const { sequelize, testConnection, createDatabaseAndTables } = require('../config/database');
const { User, Cryptocurrency, Wallet, FiatBalance, Order, Transaction } = require('../models');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await testConnection();
    await createDatabaseAndTables();

    console.log('1. Creating users...');
    const users = await User.bulkCreate([
      {
        username: 'john_trader',
        email: 'john@example.com',
        password_hash: 'hashed_password_123'
      },
      {
        username: 'jane_crypto',
        email: 'jane@example.com', 
        password_hash: 'hashed_password_456'
      },
      {
        username: 'bob_investor',
        email: 'bob@example.com',
        password_hash: 'hashed_password_789'
      },
      {
        username: 'alice_hodler',
        email: 'alice@example.com',
        password_hash: 'hashed_password_abc'
      }
    ]);
    console.log(`Created ${users.length} users`);

    console.log('2. Creating cryptocurrencies...');
    const cryptocurrencies = await Cryptocurrency.bulkCreate([
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 45000.00
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200.50
      },
      {  symbol: 'XRP',
        name: 'Ripple',
        price: 0.65
      },
      {  symbol: 'DOGE',
        name: 'Dogecoin',
        price: 0.08
      }
    ]);
    console.log(`Created ${cryptocurrencies.length} cryptocurrencies`);

    console.log('3. Creating fiat balances...');
    const fiatBalances = await FiatBalance.bulkCreate([
      { user_id: 1, currency: 'USD', amount: 10000.00 },
      { user_id: 1, currency: 'THB', amount: 50000.00 },
      { user_id: 2, currency: 'USD', amount: 25000.00 },
      { user_id: 2, currency: 'THB', amount: 100000.00 },
      { user_id: 3, currency: 'USD', amount: 5000.00 },
      { user_id: 4, currency: 'USD', amount: 15000.00 },
      { user_id: 4, currency: 'THB', amount: 75000.00 }
    ]);
    console.log(`Created ${fiatBalances.length} fiat balances`);

    console.log('4. Creating wallets...');
    const wallets = await Wallet.bulkCreate([
  { user_id: 1, crypto_id: 1, balance: 0.5 },      
  { user_id: 1, crypto_id: 2, balance: 2.75 },     
  { user_id: 2, crypto_id: 1, balance: 1.25 },     
  { user_id: 2, crypto_id: 3, balance: 150.0 },    
  { user_id: 3, crypto_id: 2, balance: 5.0 },      
  { user_id: 3, crypto_id: 4, balance: 10000.0 },  
  { user_id: 4, crypto_id: 1, balance: 0.75 },     
  { user_id: 4, crypto_id: 3, balance: 500.0 }     
]);
    console.log(`Created ${wallets.length} wallets`);

    console.log('5. Creating orders...');
   const orders = await Order.bulkCreate([
  { user_id: 1, crypto_id: 1, type: 'BUY', amount: 0.1, price: 44500.00, status: 'PENDING' },
  { user_id: 2, crypto_id: 2, type: 'SELL', amount: 1.0, price: 3250.00, status: 'COMPLETED' },
  { user_id: 3, crypto_id: 3, type: 'BUY', amount: 1000.0, price: 0.64, status: 'PENDING' },    // XRP
  { user_id: 4, crypto_id: 4, type: 'BUY', amount: 50000.0, price: 0.07, status: 'COMPLETED' }, // DOGE
  { user_id: 1, crypto_id: 3, type: 'SELL', amount: 100.0, price: 0.66, status: 'CANCELLED' }   // XRP
]);
    console.log(`Created ${orders.length} orders`);

    console.log('6. Creating transactions...');
    const transactions = await Transaction.bulkCreate([
      {
        from_user_id: 1,
        to_user_id: 2,
        crypto_id: 1,
        amount: 0.25,
        tx_type: 'TRANSFER'
      },
      {
        from_user_id: 2,
        to_user_id: 3,
        crypto_id: 2,
        amount: 1.5,
        tx_type: 'TRADE'
      },
      {
        from_user_id: 4,
        to_user_id: 1,
        crypto_id: 3,
        amount: 75.0,
        tx_type: 'TRANSFER'
      },
      {
        from_user_id: 3,
        to_user_id: 4,
        crypto_id: 4,
        amount: 200.0,
        tx_type: 'TRADE'
      },
      {
        from_user_id: 1,
        to_user_id: 1,
        crypto_id: 1,
        amount: 0.1,
        tx_type: 'DEPOSIT'
      }
    ]);
    console.log(`Created ${transactions.length} transactions`);

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Database Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Cryptocurrencies: ${cryptocurrencies.length}`);
    console.log(`- Fiat Balances: ${fiatBalances.length}`);
    console.log(`- Wallets: ${wallets.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    
    console.log('\nSample API endpoints to test:');
    console.log('- GET http://localhost:3000/api/users');
    console.log('- GET http://localhost:3000/api/users/1/wallets');
    console.log('- GET http://localhost:3000/api/cryptocurrencies');
    console.log('- GET http://localhost:3000/api/orders');
    console.log('- GET http://localhost:3000/api/transactions');

    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };