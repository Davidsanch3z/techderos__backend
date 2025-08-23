/**
 * Configuración de Base de Datos
 * Responsabilidades:
 * - Configurar pool de conexiones PostgreSQL
 * - Gestionar timeouts y reconexiones
 * - Configurar SSL para producción
 * - Logging de queries en desarrollo
 * - Health checks de base de datos
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuración del pool de conexiones
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'usuarios_service',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // Configuración del pool
  max: parseInt(process.env.DB_POOL_MAX) || 20,          // máximo número de conexiones
  min: parseInt(process.env.DB_POOL_MIN) || 5,           // mínimo número de conexiones
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,  // tiempo antes de cerrar conexión idle
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,  // tiempo máximo para conectar
  
  // SSL configuración - Siempre habilitado para Supabase
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('supabase.com') ? {
    rejectUnauthorized: false  // Supabase maneja SSL automáticamente
  } : (process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false),
  
  // Configuración adicional
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,  // timeout de queries
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Crear pool de conexiones
const pool = new Pool(poolConfig);

// Eventos del pool
pool.on('connect', (client) => {
  logger.debug('Nueva conexión a la base de datos establecida');
});

pool.on('error', (err) => {
  // Ignorar errores específicos de terminación de Supabase
  if (err.code === 'XX000' && err.message && err.message.includes('shutdown')) {
    logger.debug('Supabase cerró la conexión automáticamente (comportamiento normal)');
    return;
  }
  logger.error('Error inesperado en el pool de conexiones:', err);
});

pool.on('acquire', (client) => {
  logger.debug('Cliente del pool adquirido');
});

pool.on('release', (err, client) => {
  if (err) {
    logger.error('Error liberando cliente del pool:', err);
  } else {
    logger.debug('Cliente del pool liberado');
  }
});

pool.on('remove', (client) => {
  logger.debug('Cliente removido del pool');
});

/**
 * Conectar a la base de datos y verificar conexión
 */
async function connectDatabase() {
  try {
    // Probar conexión
    const client = await pool.connect();
    
    // Verificar que la base de datos responde
    const result = await client.query('SELECT NOW()');
    logger.info('Conexión a PostgreSQL establecida:', {
      database: poolConfig.database,
      host: poolConfig.host,
      port: poolConfig.port,
      timestamp: result.rows[0].now
    });
    
    client.release();
    
    // Inicializar esquema si es necesario
    //await initializeSchema();
    
    return pool;
  } catch (error) {
    logger.error('Error conectando a PostgreSQL:', {
      error: error.message,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database
    });
    throw error;
  }
}

/**
 * Inicializar esquema de base de datos
 */
async function initializeSchema() {
  try {
    const client = await pool.connect();
    
    // // Crear extensión UUID si no existe
    // await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // // Crear tabla de usuarios
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS users (
    //     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //     nombre VARCHAR(100) NOT NULL,
    //     email VARCHAR(255) UNIQUE NOT NULL,
    //     password_hash VARCHAR(255) NOT NULL,
    //     telefono VARCHAR(20),
    //     tipo_negocio VARCHAR(50),
    //     rol VARCHAR(50) DEFAULT 'tendero',
    //     status VARCHAR(20) DEFAULT 'pending',
    //     email_verified BOOLEAN DEFAULT false,
    //     email_verification_token VARCHAR(255),
    //     password_reset_token VARCHAR(255),
    //     password_reset_expires TIMESTAMP,
    //     last_login TIMESTAMP,
    //     failed_login_attempts INTEGER DEFAULT 0,
    //     locked_until TIMESTAMP,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);

    // // Crear tabla de roles
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS roles (
    //     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //     nombre VARCHAR(50) UNIQUE NOT NULL,
    //     descripcion TEXT,
    //     permisos JSONB,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);

    // // Crear tabla de refresh tokens
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS refresh_tokens (
    //     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    //     token_hash VARCHAR(255) NOT NULL,
    //     expires_at TIMESTAMP NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);

    // // Crear tabla de sesiones de usuario
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS user_sessions (
    //     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    //     session_token VARCHAR(255) UNIQUE NOT NULL,
    //     ip_address INET,
    //     user_agent TEXT,
    //     expires_at TIMESTAMP NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);

    // // Crear índices importantes
    // await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    // await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)');

    // // Crear trigger para updated_at automático
    // await client.query(`
    //   CREATE OR REPLACE FUNCTION update_updated_at_column()
    //   RETURNS TRIGGER AS $$
    //   BEGIN
    //     NEW.updated_at = CURRENT_TIMESTAMP;
    //     RETURN NEW;
    //   END;
    //   $$ LANGUAGE plpgsql;
    // `);

    // await client.query(`
    //   DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    //   CREATE TRIGGER update_users_updated_at
    //     BEFORE UPDATE ON users
    //     FOR EACH ROW
    //     EXECUTE FUNCTION update_updated_at_column();
    // `);

    client.release();
    
    // Inicializar roles por defecto
    //const Role = require('../models/Role');
    //await Role.initializeDefaultRoles();
    
    logger.info('Esquema de base de datos inicializado correctamente');
  } catch (error) {
    logger.error('Error inicializando esquema:', error);
    throw error;
  }
}

/**
 * Ejecutar query con logging en desarrollo
 */
async function query(text, params) {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Query ejecutado:', {
        text: text.replace(/\s+/g, ' ').trim(),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Error en query:', {
      text: text.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
}

/**
 * Ejecutar transacción
 */
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error en transacción, rollback ejecutado:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check de la base de datos
 */
async function healthCheck() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as healthy, NOW() as timestamp');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    logger.error('Health check de base de datos falló:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Cerrar todas las conexiones del pool
 */
async function closePool() {
  try {
    await pool.end();
    logger.info('Pool de conexiones cerrado');
  } catch (error) {
    logger.error('Error cerrando pool de conexiones:', error);
  }
}

/**
 * Limpiar conexiones idle y tokens expirados
 */
async function cleanup() {
  try {
    // Limpiar refresh tokens expirados
    const result = await query('DELETE FROM refresh_tokens WHERE expires_at <= CURRENT_TIMESTAMP');
    logger.info(`Limpieza: ${result.rowCount} refresh tokens expirados eliminados`);
    
    // Limpiar sesiones expiradas
    const sessionResult = await query('DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
    logger.info(`Limpieza: ${sessionResult.rowCount} sesiones expiradas eliminadas`);
    
  } catch (error) {
    logger.error('Error en limpieza de base de datos:', error);
  }
}

// Programar limpieza automática cada hora
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanup, 60 * 60 * 1000); // cada hora
}

// Manejar cierre graceful
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  connectDatabase,
  query,
  transaction,
  healthCheck,
  closePool,
  cleanup
};
