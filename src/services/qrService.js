const qr = require("../models/Qr");

class qrService {
  static async createQr(data, userId) {
    return await qr.create(data, userId);
  }

  static async findByIdAndUserId(id, userId) {
    return await qr.findByIdAndUserId(id, userId);
  }

  static async findAll(userId) {
    return await qr.findByUserId(userId);
  }

  static async deleteByIdAndUserId(id, userId) {
    return await qr.deleteByIdAndUserId(id, userId);
  }
}

module.exports = qrService;
