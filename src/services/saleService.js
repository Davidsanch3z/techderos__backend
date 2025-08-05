const sales = require("../models/Sales");

class SaleService {
  async getSalesFromUser(userId) {
    return sales.findByUserId(userId);
  }

  async partialUpdate(itemId, userId, data) {
    return sales.updateById(itemId, userId, data);
  }

  async deleteInventory(userId, itemId) {
    return sales.deleteByUserIdAndItemId(userId, itemId);
  }

  async findByUserIdAndItemId(userId, itemId) {
    return sales.findByUserIdAndItemId(userId, itemId);
  }

  async create(data) {
    return sales.create(data);
  }
}

module.exports = new SaleService();
