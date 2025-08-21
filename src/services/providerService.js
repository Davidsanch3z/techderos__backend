const providers = require("../models/Providers");

class ProviderService {
  async findAll() {
    return providers.findAll();
  }

  async findById(id) {
    return providers.findById(id);
  }

  async create(data) {
    return providers.create(data);
  }

  async deleteById(id) {
    return providers.deleteById(id);
  }

  async updateById(id, data) {
    return providers.updateById(id, data);
  }
}

module.exports = new ProviderService();
