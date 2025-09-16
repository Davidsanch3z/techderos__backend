const db = require("../config/database");

class Order {
  constructor({ id, user_id, product, supplier, quantity, date, status }) {
    this.id = id;
    this.userId = user_id;
    this.product = product;
    this.supplier = supplier;
    this.quantity = quantity;
    this.date = date;
    this.status = status;
  }

  static findByUserId(userId) {
    const query = "SELECT * FROM orders_pd WHERE user_id = $1";
    return db
      .query(query, [userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return [];
        }
        return result.rows.map((row) => new Order(row));
      })
      .catch((error) => {
        throw error;
      });
  }

  static findById(id) {
    const query = "SELECT * FROM orders_pd WHERE id = ? LIMIT 1";
    return db
      .query(query, [id])
      .then((result) => {
        const rows = result[0] || result.rows;
        if (!rows || rows.length === 0) {
          return null;
        }

        return new Order(rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByIdAndUserId(id, userId) {
    const query =
      "SELECT * FROM orders_pd WHERE id = $1 AND user_id = $2 LIMIT 1";
    return db
      .query(query, [id, userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Order(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static create(data, userId) {
    const query = `
    INSERT INTO orders_pd (product, supplier, quantity, date, status, user_id)
    VALUES (?, ?, ?, ?, ?, ?);
  `;

    const values = [
      data.product,
      data.supplier,
      data.quantity,
      data.date,
      data.status,
      userId,
    ];

    return db
      .query(query, values)
      .then(async (res) => {
        const result = await this.findById(res.rows.insertId);
        if (result) {
          return new Order(result);
        }
      })
      .catch((error) => {
        throw error;
      });
  }

  static deleteByIdAndUserId(id, userId) {
    const query = "DELETE FROM orders_pd WHERE id = ? AND user_id = ?";
    return db
      .query(query, [id, userId])
      .then((result) => {
        const res = result[0] || result;
        if (res.affectedRows === 0) {
          return null;
        }
        return true;
      })
      .catch((error) => {
        throw error;
      });
  }

  static async updateById(id, data = {}) {
    const { product, supplier, quantity, date, status, userId } = data;

    const query = `
      UPDATE orders_pd
      SET
        product = COALESCE(?, product),
        supplier = COALESCE(?, supplier),
        quantity = COALESCE(?, quantity),
        date = COALESCE(?, date),
        status = COALESCE(?, status),
        user_id = COALESCE(?, user_id)
      WHERE id = ?;
    `;

    const values = [
      product ?? null,
      supplier ?? null,
      quantity ?? null,
      date ?? null,
      status ?? null,
      userId ?? null,
      id,
    ];

    try {
      db.query(query, values);
      const result = await this.findById(id);
      return result;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }
}

module.exports = Order;
