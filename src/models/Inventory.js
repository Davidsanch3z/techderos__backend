const db = require("../config/database");

class Inventory {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.price = data.price;
    this.quantity = data.quantity;
    this.category = data.category;
    this.userId = data.user_id;
    this.supplierName = data.supplier_name;
    this.presentation = data.presentation;
    this.expirationDate = data.expiration_date;
    this.profitMargin = data.profit_margin;
  }

  static findById(itemId) {
    const query = "SELECT * FROM inventory_pd WHERE id = $1 LIMIT 1";
    return db
      .query(query, [itemId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Inventory(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByUserIdAndItemId(userId, itemId) {
    const query =
      "SELECT * FROM inventory_pd WHERE user_id = $1 AND id = $2 LIMIT 1";
    return db
      .query(query, [userId, itemId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Inventory(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByUserId(userId) {
    const query = "SELECT * FROM inventory_pd WHERE user_id = $1";
    return db
      .query(query, [userId])
      .then((result) => result.rows.map((row) => new Inventory(row)))
      .catch((error) => {
        throw error;
      });
  }

  static create({
    name,
    price,
    quantity,
    category,
    userId,
    supplierName,
    presentation,
    expirationDate,
    profitMargin,
  }) {
    const query = `
    INSERT INTO inventory_pd (
      name, price, quantity, category, user_id,
      supplier_name, presentation, expiration_date, profit_margin
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

    const values = [
      name,
      price,
      quantity,
      category,
      userId,
      supplierName,
      presentation,
      expirationDate,
      profitMargin,
    ];

    return db
      .query(query, values)
      .then((result) => Inventory.findById(result.rows.insertId))
      .catch((error) => {
        throw error;
      });
  }

  static async updateById(id, data = {}) {
    const {
      name,
      price,
      quantity,
      category,
      supplierName,
      presentation,
      expirationDate,
      profitMargin,
    } = data;

    const query = `
      UPDATE inventory_pd
      SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        quantity = COALESCE(?, quantity),
        category = COALESCE(?, category),
        supplier_name = COALESCE(?, supplier_name),
        presentation = COALESCE(?, presentation),
        expiration_date = COALESCE(?, expiration_date),
        profit_margin = COALESCE(?, profit_margin)
      WHERE id = ?;
    `;

    const values = [
      name ?? null,
      price ?? null,
      quantity ?? null,
      category ?? null,
      supplierName ?? null,
      presentation ?? null,
      expirationDate ?? null,
      profitMargin ?? null,
      id,
    ];

    try {
      await db.query(query, values);
      return Inventory.findById(id);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  }

  static async deleteByUserIdAndItemId(userId, itemId) {
    const query = `
    DELETE FROM inventory_pd
    WHERE id = $1 AND user_id = $2;
    `;
    const values = [itemId, userId];
    const result = await db.query(query, values);

    return result.rowCount > 0;
  }
}

module.exports = Inventory;
