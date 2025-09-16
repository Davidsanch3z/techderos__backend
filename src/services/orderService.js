const order = require("../models/Orders");

class ObjectService {
  async findByUserId(userId) {
    return order.findByUserId(userId);
  }

  async findByIdAndUserId(id, userId) {
    return order.findByIdAndUserId(id, userId);
  }

  async findById(id) {
    return order.findById(id);
  }

  async create(data, userId) {
    return order.create(data, userId);
  }

  async updateById(id, data) {
    return order.updateById(id, data);
  }

  async deleteByIdAndUserId(id, userId) {
    return order.deleteByIdAndUserId(id, userId);
  }
}

module.exports = new ObjectService();
