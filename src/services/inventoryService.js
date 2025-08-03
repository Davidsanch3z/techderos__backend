const inventory = require("../models/Inventory");

class InventoryService {
  async findAll(userId) {
    return inventory.findByUserId(userId);
  }

  async addInventoryItem(data) {
    return inventory.create(data);
  }

  async partialUpdate(itemId, data) {
    return inventory.updateById(itemId, data);
  }

  async deleteInventory(userId, itemId) {
    return inventory.deleteByUserIdAndItemId(userId, itemId);
  }

  async getInventory(userId, itemId) {
    return inventory.findByUserIdAndItemId(userId, itemId);
  }
}

module.exports = new InventoryService();
