var db = require("mysql2-promise")();

const poolConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "usuarios_service",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
};

db.configure(poolConfig);

function convertPgSqlToMySQL(sql) {
  return sql.replace(/\$\d+/g, "?");
}

async function connectDatabase() {
  // try {
  //   // Probar conexión
  //   const client = await pool.connect();
  //   // Verificar que la base de datos responde
  //   const result = await client.query("SELECT NOW()");
  //   logger.info("Conexión a PostgreSQL establecida:", {
  //     database: poolConfig.database,
  //     host: poolConfig.host,
  //     port: poolConfig.port,
  //     //timestamp: result.rows[0].now,
  //   });
  //   client.release();
  //   return pool;
  // } catch (error) {
  //   logger.error(error)
  //   logger.error("Error conectando a PostgreSQL:", {
  //     error: error.message,
  //     host: poolConfig.host,
  //     port: poolConfig.port,
  //     database: poolConfig.database,
  //   });
  //   throw error;
  // }
}

async function query(text, params) {
  const parsedSql = convertPgSqlToMySQL(text);
  return db.execute(parsedSql, params).then(([rows]) => {
    return {
      rows,
    };
  });
}

module.exports = {
  connectDatabase,
  query,
};
