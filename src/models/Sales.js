const db = require("../config/database");

class Sale {
  constructor(data = {}) {
    this.id = data.id;
    this.date = data.date;
    this.customer = data.customer;
    this.customerEmail = data.customer_email;
    this.products = data.products;
    this.paymentMethod = data.payment_method;
    this.total = data.total;
    this.userId = data.user_id;
    this.amount = data.amount;
    this.address = data.address;
    this.dni = data.dni;
  }

  static async updateById(id, userId, data = {}) {
    const {
      date,
      customer,
      customerEmail,
      products,
      paymentMethod,
      total,
      amount,
      address,
      dni,
    } = data;

    const query = `
      UPDATE sales_pd
      SET
          date = COALESCE(?, date),
          customer = COALESCE(?, customer),
          customer_email = COALESCE(?, customer_email),
          products = COALESCE(?, products),
          payment_method = COALESCE(?, payment_method),
          total = COALESCE(?, total),
          amount = COALESCE(?, amount),
          address = COALESCE(?, address),
          dni = COALESCE(?, dni)
      WHERE id = ? AND user_id = ?;
    `;

    const values = [
      date ?? null,
      customer ?? null,
      customerEmail ?? null,
      products ?? null,
      paymentMethod ?? null,
      total ?? null,
      amount ?? null,
      address ?? null,
      dni ?? null,
      id,
      userId,
    ];

    try {
      await db.query(query, values);
      const check = "SELECT * FROM sales_pd WHERE id = $1";
      const check_result = await db.query(check, [id]);
      if (check_result.rows.length === 0) {
        return null;
      }

      return new Sale(check_result.rows[0]);
    } catch (error) {
      console.error("Error updating sales record:", error);
      throw error;
    }
  }

  static async deleteByUserIdAndItemId(userId, itemId) {
    const query = `
      DELETE FROM sales_pd
      WHERE id = $1 AND user_id = $2;
    `;
    const values = [itemId, userId];
    const result = await db.query(query, values);
    return result.rowCount > 0;
  }

  static findByUserIdAndItemId(userId, itemId) {
    const query =
      "SELECT * FROM sales_pd WHERE user_id = $1 AND id = $2 LIMIT 1";
    return db
      .query(query, [userId, itemId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Sale(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByUserDni(dni) {
    const query =
      "SELECT * FROM sales_pd WHERE dni = $1";
    return db
      .query(query, [dni])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Sale(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByUserId(userId) {
    const query = "SELECT * FROM sales_pd WHERE user_id = $1";
    return db
      .query(query, [userId])
      .then((result) => result.rows.map((row) => new Sale(row)))
      .catch((error) => {
        throw error;
      });
  }

  static create({
    date,
    customer,
    customerEmail,
    products,
    paymentMethod,
    total,
    amount,
    userId,
    address,
    dni,
  }) {
    const query = `
      INSERT INTO sales_pd (
        date, customer, customer_email, products,
        payment_method, total, amount, user_id,
        address, dni
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      date,
      customer,
      customerEmail,
      products,
      paymentMethod,
      total,
      amount,
      userId,
      address,
      dni,
    ];

    return db
      .query(query, values)
      .then(
        (result) =>
          new Sale({
            date,
            customer,
            products,
            total,
            amount,
            userId,
            address,
            dni,
            customer_email: customerEmail,
            payment_method: paymentMethod,
          })
      )
      .catch((error) => {
        console.error("Error inserting sales record:", error);
        throw error;
      });
  }
}

module.exports = Sale;
