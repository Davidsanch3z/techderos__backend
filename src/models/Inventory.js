const db = require("../config/database");
const logger = require("../utils/logger");

class Inventory {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.price = data.price;
    this.quantity = data.quantity;
    this.category = data.category;
    this.userId = data.user_id;
  }

  static findByUserIdAndItemId(userId, itemId) {
    const query =
      'SELECT * FROM "inventory_pd" WHERE user_id = $1 AND id = $2 LIMIT 1';
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
    const query = 'SELECT * FROM "inventory_pd" WHERE user_id = $1';
    return db
      .query(query, [userId])
      .then((result) => result.rows.map((row) => new Inventory(row)))
      .catch((error) => {
        throw error;
      });
  }

  static create({ name, price, quantity, category, userId }) {
    const query = `
      INSERT INTO "inventory_pd" (name, price, quantity, category, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, price, quantity, category, userId];
    return db
      .query(query, values)
      .then((result) => new Inventory(result.rows[0]))
      .catch((error) => {
        console.error("Error inserting inventory item:", error);
        throw error;
      });
  }

  static async updateById(id, data = {}) {
    const { name, price, quantity, category } = data;

    const query = `
      UPDATE inventory_pd
      SET
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        quantity = COALESCE($3, quantity),
        category = COALESCE($4, category)
      WHERE id = $5
      RETURNING *;
    `;

    const values = [
      name ?? null,
      price ?? null,
      quantity ?? null,
      category ?? null,
      id,
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return new Inventory(result.rows[0]);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  }

  static async deleteByUserIdAndItemId(userId, itemId) {
    const query = `
    DELETE FROM inventory_pd
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
    const values = [itemId, userId];
    const result = await db.query(query, values);

    return result.rowCount > 0;
  }
}

module.exports = Inventory;
