const { Order, User, Cryptocurrency } = require('../models');

const OrderController = {

  async getAllOrders(req, res) {
    try {
      const { status, type, user_id, crypto_id } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (user_id) whereClause.user_id = user_id;
      if (crypto_id) whereClause.crypto_id = crypto_id;

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'username']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name', 'price']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const totalValue = orders.reduce((sum, order) => {
        return sum + order.getTotalValue();
      }, 0);

      res.json({
        success: true,
        filters: { status, type, user_id, crypto_id },
        count: orders.length,
        total_value: totalValue,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message
      });
    }
  },

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'username', 'email']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name', 'price']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const canExecute = await order.canExecute();
      const totalValue = order.getTotalValue();

      res.json({
        success: true,
        data: {
          ...order.toJSON(),
          total_value: totalValue,
          can_execute: canExecute
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching order',
        error: error.message
      });
    }
  },

  async createOrder(req, res) {
    try {
      const { user_id, crypto_id, type, amount, price } = req.body;

      if (!user_id || !crypto_id || !type || !amount || !price) {
        return res.status(400).json({
          success: false,
          message: 'user_id, crypto_id, type, amount, and price are required'
        });
      }

      if (!['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either BUY or SELL'
        });
      }

      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const cryptocurrency = await Cryptocurrency.findByPk(crypto_id);
      if (!cryptocurrency) {
        return res.status(404).json({
          success: false,
          message: 'Cryptocurrency not found'
        });
      }

      const order = await Order.create({
        user_id,
        crypto_id,
        type,
        amount,
        price,
        status: 'PENDING'
      });

      const newOrder = await Order.findByPk(order.order_id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'username']
          },
          {
            model: Cryptocurrency,
            as: 'cryptocurrency',
            attributes: ['crypto_id', 'symbol', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          ...newOrder.toJSON(),
          total_value: newOrder.getTotalValue()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: error.message
      });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be PENDING, COMPLETED, or CANCELLED'
        });
      }

      const order = await Order.findByPk(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      await order.update({ status });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          order_id: order.order_id,
          old_status: order.status,
          new_status: status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating order status',
        error: error.message
      });
    }
  },

  async getMarketData(req, res) {
    try {
      const { crypto_id } = req.params;

      const cryptocurrency = await Cryptocurrency.findByPk(crypto_id);
      if (!cryptocurrency) {
        return res.status(404).json({
          success: false,
          message: 'Cryptocurrency not found'
        });
      }

      const marketData = await Order.getMarketData(crypto_id);

      res.json({
        success: true,
        crypto_id: parseInt(crypto_id),
        cryptocurrency: {
          symbol: cryptocurrency.symbol,
          name: cryptocurrency.name,
          price: cryptocurrency.price
        },
        market_data: marketData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching market data',
        error: error.message
      });
    }
  }
};

module.exports = OrderController;