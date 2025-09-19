const db = require("../config/database");

class Providers {
  constructor(providerData = {}) {
    this.id = providerData.id;
    this.title = providerData.title;
    this.ownerName = providerData.owner_name;
    this.phoneNumber = providerData.phone_number;
    this.whatsappNumber = providerData.whatsapp_number;
    this.email = providerData.email;
    this.address = providerData.address;
    this.deliveryDay = providerData.delivery_day;
    this.isActive = providerData.is_active;
    this.userId = providerData.user_id;
    this.objectId = providerData.object_id;
  }

  static findByUserId(userId) {
    const query = "SELECT * FROM providers WHERE user_id = $1";
    return db
      .query(query, [userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return [];
        }
        return result.rows.map((row) => new Providers(row));
      })
      .catch((error) => {
        throw error;
      });
  }

  static findAll() {
    const query = "SELECT * FROM providers";
    return db
      .query(query)
      .then((result) => {
        if (result.rows.length === 0) {
          return [];
        }
        return result.rows.map((row) => new Providers(row));
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByIdAndUserId(id, userId) {
    const query =
      "SELECT * FROM providers WHERE id = $1 AND user_id = $2 LIMIT 1";
    return db
      .query(query, [id, userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Providers(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findById(id) {
    const query = "SELECT * FROM providers WHERE id = $1 LIMIT 1";
    return db
      .query(query, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Providers(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static create(data, userId) {
    const query = `
    INSERT INTO providers 
      (title, owner_name, phone_number, whatsapp_number, email, address, delivery_day, object_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

    const values = [
      data.title ?? null,
      data.ownerName ?? null,
      data.phoneNumber ?? null,
      data.whatsappNumber ?? null,
      data.email ?? null,
      data.address ?? null,
      data.deliveryDay ?? null,
      data.objectId ?? null,
      userId,
    ];

    return db
      .query(query, values)
      .then((result) => Providers.findById(result.rows.insertId))
      .catch((error) => {
        throw error;
      });
  }

  static deleteByIdAndUserId(id, userId) {
    const query = "DELETE FROM providers WHERE id = $1 AND user_id = $2;";
    return db
      .query(query, [id, userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Providers(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static deleteById(id) {
    const query = "DELETE FROM providers WHERE id = $1 RETURNING *";
    return db
      .query(query, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Providers(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static async updateById(id, data = {}) {
    const {
      title,
      ownerName,
      phoneNumber,
      whatsappNumber,
      email,
      address,
      deliveryDay,
      isActive,
      objectId,
    } = data;

    const query = `
      UPDATE providers
      SET
        title = COALESCE(?, title),
        owner_name = COALESCE(?, owner_name),
        phone_number = COALESCE(?, phone_number),
        whatsapp_number = COALESCE(?, whatsapp_number),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        delivery_day = COALESCE(?, delivery_day),
        is_active = COALESCE(?, is_active),
        object_id = ?
      WHERE id = ?;
    `;

    const values = [
      title ?? null,
      ownerName ?? null,
      phoneNumber ?? null,
      whatsappNumber ?? null,
      email ?? null,
      address ?? null,
      deliveryDay ?? null,
      isActive ?? null,
      objectId === undefined ? undefined : objectId,
      id,
    ];

    try {
      await db.query(query, values);
      return Providers.findById(id);
    } catch (error) {
      console.error("Error updating provider:", error);
      throw error;
    }
  }
}

module.exports = Providers;
