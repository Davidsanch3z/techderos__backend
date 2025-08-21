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

  static create(data) {
    const query = `
    INSERT INTO providers 
      (title, owner_name, phone_number, whatsapp_number, email, address, delivery_day, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
    const values = [
      data.title,
      data.ownerName,
      data.phoneNumber,
      data.whatsappNumber,
      data.email,
      data.address,
      data.deliveryDay,
      data.isActive ?? true,
    ];

    return db
      .query(query, values)
      .then((result) => new Providers(result.rows[0]))
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
    } = data;

    const query = `
    UPDATE providers
    SET
      title = COALESCE($1, title),
      owner_name = COALESCE($2, owner_name),
      phone_number = COALESCE($3, phone_number),
      whatsapp_number = COALESCE($4, whatsapp_number),
      email = COALESCE($5, email),
      address = COALESCE($6, address),
      delivery_day = COALESCE($7, delivery_day),
      is_active = COALESCE($8, is_active)
    WHERE id = $9
    RETURNING *;
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
      id,
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return new Providers(result.rows[0]);
    } catch (error) {
      console.error("Error updating provider:", error);
      throw error;
    }
  }
}

module.exports = Providers;