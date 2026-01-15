const providers = require("../models/Providers");

class ProviderService {
  async findAll() {
    return providers.findAll();
  }

  async findByUserId(userId) {
    return providers.findByUserId(userId);
  }

  async findById(id) {
    return providers.findById(id);
  }

  async findByIdAndUserId(id, userId) {
    return providers.findByIdAndUserId(id, userId);
  }

  async create(data, userId) {
    return providers.create(data, userId);
  }

  async deleteById(id) {
    return providers.deleteById(id);
  }

  async deleteByIdAndUserId(id, userId) {
    return providers.deleteByIdAndUserId(id, userId);
  }

  async updateById(id, data) {
    return providers.updateById(id, data);
  }
}

module.exports = new ProviderService();
