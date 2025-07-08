const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './crypto_exchange.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  define: {
    underscored: true,
    timestamps: true,
    freezeTableName: true
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('เชื่อมต่อ SQLite สำเร็จ!');
  } catch (error) {
    console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', error.message);
    process.exit(1);
  }
}

async function createDatabaseAndTables() {
  try {
    await sequelize.sync(); 
    console.log('สร้างตารางสำเร็จ!');
    console.log('Tables: users, cryptocurrencies, wallets, fiat_balances, orders, transactions');
  } catch (error) {
    console.error('สร้างตารางไม่สำเร็จ:', error.message);
    throw error;
  }
}

process.on('SIGINT', async () => {
  console.log('\nปิดการเชื่อมต่อฐานข้อมูล...');
  await sequelize.close();
  console.log('ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
  process.exit(0);
});

module.exports = {
  sequelize,
  testConnection,
  createDatabaseAndTables
};