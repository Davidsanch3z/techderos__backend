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
    } = data;

    const query = `
  UPDATE "sales_pd"
  SET
    date = COALESCE($1, date),
    customer = COALESCE($2, customer),
    customer_email = COALESCE($3, customer_email),
    products = COALESCE($4, products),
    payment_method = COALESCE($5, payment_method),
    total = COALESCE($6, total),
    amount = COALESCE($7, amount)
  WHERE id = $8 AND user_id = $9
  RETURNING *;
`;

    const values = [
      date ?? null,
      customer ?? null,
      customerEmail ?? null,
      products ?? null,
      paymentMethod ?? null,
      total ?? null,
      amount ?? null,
      id,
      userId,
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return new Sale(result.rows[0]);
    } catch (error) {
      console.error("Error updating sales record:", error);
      throw error;
    }
  }

  static async deleteByUserIdAndItemId(userId, itemId) {
    const query = `
    DELETE FROM "sales_pd"
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
    const values = [itemId, userId];
    const result = await db.query(query, values);
    return result.rowCount > 0;
  }

  static findByUserIdAndItemId(userId, itemId) {
    const query =
      'SELECT * FROM "sales_pd" WHERE user_id = $1 AND id = $2 LIMIT 1';
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

  static findByUserId(userId) {
    const query = 'SELECT * FROM "sales_pd" WHERE user_id = $1';
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
  }) {
    const query = `
    INSERT INTO "sales_pd" (
      date,
      customer,
      customer_email,
      products,
      payment_method,
      total,
      amount,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
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
    ];

    return db
      .query(query, values)
      .then((result) => new Sale(result.rows[0]))
      .catch((error) => {
        console.error("Error inserting sales record:", error);
        throw error;
      });
  }
}

module.exports = Sale;
