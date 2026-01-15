const objects = require("../models/Objects");

class ObjectService {
  async createObject(data, userId) {
    return objects.create(data, userId);
  }

  async getObject(userId, id) {
    return objects.findByUserIdAndId(userId, id);
  }

  async deleteObject(userId, id) {
    return objects.deleteByUserIdAndId(userId, id);
  }
}

module.exports = new ObjectService();
