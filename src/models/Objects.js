const db = require("../config/database");

class Object {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.url = `${process.env.DOMAIN_URL}/${data.name}`;
  }

  static create(data, userId) {
    const query = `
      INSERT INTO objects (name, user_id)
      VALUES ($1, $2);
    `;

    const values = [data.name, userId];
    return db
      .query(query, values)
      .then(async (_) => {
        const check = "SELECT * FROM objects WHERE name = $1";
        const check_result = await db.query(check, [data.name]);
        if (check_result.rows.length === 0) {
          return null;
        }
        return new Object(check_result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByUserIdAndId(userId, id) {
    const query = `
      SELECT *
      FROM objects
      WHERE user_id = $1 AND id = $2
      LIMIT 1;
    `;

    const values = [userId, id];

    return db
      .query(query, values)
      .then((result) => {
        if (result.rows.length === 0) return null;
        return new Object(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static deleteByUserIdAndId(userId, id) {
    const query = `
      DELETE FROM objects
      WHERE user_id = $1 AND id = $2
      RETURNING *;
    `;
    const values = [userId, id];

    return db
      .query(query, values)
      .then((result) => {
        if (result.rows.length === 0) return null;
        return new Object(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }
}

module.exports = Object;
