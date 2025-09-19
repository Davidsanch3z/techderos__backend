const db = require("../config/database");

class Qr {
  constructor(qrData = {}) {
    this.id = qrData.id;
    this.name = qrData.name;
    this.objectId = qrData.object_id;
    this.userId = qrData.user_id;
  }
  static findByUserId(userId) {
    const query = "SELECT * FROM qrs WHERE user_id = $1";
    return db
      .query(query, [userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return [];
        }
        return result.rows.map((row) => new Qr(row));
      })
      .catch((error) => {
        throw error;
      });
  }

  static deleteByIdAndUserId(id, userId) {
    const query = "DELETE FROM qrs WHERE id = $1 AND user_id = $2;";
    return db
      .query(query, [id, userId])
      .then((result) => {
        return new Qr(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static findByIdAndUserId(id, userId) {
    const query = "SELECT * FROM qrs WHERE id = $1 AND user_id = $2 LIMIT 1";
    return db
      .query(query, [id, userId])
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return new Qr(result.rows[0]);
      })
      .catch((error) => {
        throw error;
      });
  }

  static create(data, userId) {
    const query = `
      INSERT INTO qrs 
        (name, object_id, user_id)
      VALUES ($1, $2, $3);
    `;
    const values = [data.name, data.objectId ?? null, userId];
    return db
      .query(query, values)
      .then(
        (result) =>
          new Qr({
            name: data.name,
            objectId: data.objectId,
            userId,
          })
      )
      .catch((error) => {
        throw error;
      });
  }
}

module.exports = Qr;
