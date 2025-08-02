/**
 * Configuración JWT
 * Configuraciones:
 * - Secretos para access y refresh tokens
 * - Tiempos de expiración por ambiente
 * - Algoritmos de firmado (HS256/RS256)
 * - Configuración de audience e issuer
 * - Rotación de secretos
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Configuración de JWT por ambiente
 */
const getJWTConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const config = {
    // Secretos
    accessTokenSecret: process.env.JWT_SECRET || generateRandomSecret(),
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || generateRandomSecret(),
    
    // Tiempos de expiración
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || getDefaultAccessExpiry(env),
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || getDefaultRefreshExpiry(env),
    
    // Configuración de tokens
    issuer: process.env.JWT_ISSUER || 'usuarios-service',
    audience: process.env.JWT_AUDIENCE || 'gestion-comercial',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    
    // Configuración adicional
    clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE) || 30, // segundos
    notBefore: process.env.JWT_NOT_BEFORE || '0', // token válido inmediatamente
    
    // Configuración de headers
    header: {
      typ: 'JWT',
      alg: process.env.JWT_ALGORITHM || 'HS256'
    }
  };
  
  // Validar configuración
  validateJWTConfig(config);
  
  return config;
};

/**
 * Obtener tiempo de expiración por defecto para access tokens
 */
function getDefaultAccessExpiry(env) {
  switch (env) {
    case 'production':
      return '15m'; // 15 minutos en producción
    case 'staging':
      return '30m'; // 30 minutos en staging
    case 'development':
      return '1h';  // 1 hora en desarrollo
    case 'test':
      return '5m';  // 5 minutos en tests
    default:
      return '15m';
  }
}

/**
 * Obtener tiempo de expiración por defecto para refresh tokens
 */
function getDefaultRefreshExpiry(env) {
  switch (env) {
    case 'production':
      return '7d';  // 7 días en producción
    case 'staging':
      return '3d';  // 3 días en staging
    case 'development':
      return '30d'; // 30 días en desarrollo
    case 'test':
      return '1h';  // 1 hora en tests
    default:
      return '7d';
  }
}

/**
 * Generar secreto aleatorio si no está configurado
 */
function generateRandomSecret() {
  const secret = crypto.randomBytes(64).toString('hex');
  
  if (process.env.NODE_ENV === 'development') {
    logger.warn('JWT secret generado automáticamente. En producción debe configurarse JWT_SECRET');
  }
  
  return secret;
}

/**
 * Validar configuración de JWT
 */
function validateJWTConfig(config) {
  const requiredFields = ['accessTokenSecret', 'refreshTokenSecret', 'issuer', 'audience'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Configuración JWT requerida faltante: ${field}`);
    }
  }
  
  // Validar longitud de secretos
  if (config.accessTokenSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
  
  if (config.refreshTokenSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET debe tener al menos 32 caracteres');
  }
  
  // Validar algoritmo
  const supportedAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
  if (!supportedAlgorithms.includes(config.algorithm)) {
    throw new Error(`Algoritmo JWT no soportado: ${config.algorithm}`);
  }
  
  // Advertir sobre configuración de desarrollo en producción
  if (process.env.NODE_ENV === 'production') {
    if (config.accessTokenSecret === config.refreshTokenSecret) {
      logger.warn('ADVERTENCIA: Los secretos de access y refresh token son iguales en producción');
    }
    
    if (config.accessTokenExpiry === '1h' || config.refreshTokenExpiry === '30d') {
      logger.warn('ADVERTENCIA: Tiempos de expiración de desarrollo detectados en producción');
    }
  }
}

/**
 * Obtener opciones de firmado para access tokens
 */
function getAccessTokenSignOptions() {
  const config = getJWTConfig();
  
  return {
    issuer: config.issuer,
    audience: config.audience,
    expiresIn: config.accessTokenExpiry,
    notBefore: config.notBefore,
    algorithm: config.algorithm,
    header: config.header
  };
}

/**
 * Obtener opciones de firmado para refresh tokens
 */
function getRefreshTokenSignOptions() {
  const config = getJWTConfig();
  
  return {
    issuer: config.issuer,
    expiresIn: config.refreshTokenExpiry,
    algorithm: config.algorithm,
    header: config.header
    // Nota: refresh tokens no tienen audience para mayor flexibilidad
  };
}

/**
 * Obtener opciones de verificación para access tokens
 */
function getAccessTokenVerifyOptions() {
  const config = getJWTConfig();
  
  return {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: [config.algorithm],
    clockTolerance: config.clockTolerance,
    ignoreNotBefore: false,
    ignoreExpiration: false
  };
}

/**
 * Obtener opciones de verificación para refresh tokens
 */
function getRefreshTokenVerifyOptions() {
  const config = getJWTConfig();
  
  return {
    issuer: config.issuer,
    algorithms: [config.algorithm],
    clockTolerance: config.clockTolerance,
    ignoreNotBefore: false,
    ignoreExpiration: false
    // Nota: no verificar audience para refresh tokens
  };
}

/**
 * Generar payload base para tokens
 */
function createTokenPayload(user, tokenType = 'access') {
  const basePayload = {
    sub: user.id, // subject (ID del usuario)
    iat: Math.floor(Date.now() / 1000), // issued at
    jti: crypto.randomUUID() // JWT ID único
  };
  
  if (tokenType === 'access') {
    // Access tokens contienen información completa del usuario
    return {
      ...basePayload,
      userId: user.id,
      email: user.email,
      rol: user.rol,
      status: user.status,
      emailVerified: user.email_verified,
      type: 'access'
    };
  } else if (tokenType === 'refresh') {
    // Refresh tokens contienen información mínima
    return {
      ...basePayload,
      userId: user.id,
      type: 'refresh'
    };
  }
  
  throw new Error(`Tipo de token no soportado: ${tokenType}`);
}

/**
 * Verificar si un token está en la blacklist (para futuras implementaciones)
 */
async function isTokenBlacklisted(jti) {
  // Implementación futura: verificar en Redis o base de datos
  // si el token JTI está en blacklist
  return false;
}

/**
 * Agregar token a blacklist (para futuras implementaciones)
 */
async function blacklistToken(jti, exp) {
  // Implementación futura: agregar JTI a blacklist en Redis
  // con TTL basado en el tiempo de expiración
  logger.debug(`Token agregado a blacklist: ${jti}`);
}

/**
 * Obtener información de expiración de token
 */
function getTokenExpirationInfo(token) {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    const expirationDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const timeToExpiry = expirationDate.getTime() - now.getTime();
    
    return {
      expirationDate,
      timeToExpiry,
      isExpired: timeToExpiry <= 0,
      willExpireIn: Math.max(0, Math.floor(timeToExpiry / 1000)) // segundos
    };
  } catch (error) {
    logger.error('Error obteniendo información de expiración:', error);
    return null;
  }
}

/**
 * Rotar secretos JWT (para futuras implementaciones)
 */
async function rotateJWTSecrets() {
  // Implementación futura: 
  // 1. Generar nuevos secretos
  // 2. Mantener secretos anteriores por período de gracia
  // 3. Invalidar tokens con secretos antiguos gradualmente
  logger.info('Rotación de secretos JWT iniciada');
}

module.exports = {
  getJWTConfig,
  getAccessTokenSignOptions,
  getRefreshTokenSignOptions,
  getAccessTokenVerifyOptions,
  getRefreshTokenVerifyOptions,
  createTokenPayload,
  isTokenBlacklisted,
  blacklistToken,
  getTokenExpirationInfo,
  rotateJWTSecrets,
  validateJWTConfig
};
