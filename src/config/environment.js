/**
 * Variables de Entorno
 * Gestión:
 * - Carga de archivos .env por ambiente
 * - Validación de variables requeridas
 * - Valores por defecto para desarrollo
 * - Transformación de tipos (string a number/boolean)
 * - Logging de configuración (sin secretos)
 */

require('dotenv').config();
const logger = require('../utils/logger');

/**
 * Variables de entorno requeridas
 */
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

/**
 * Variables de entorno opcionales con valores por defecto
 */
const DEFAULT_ENV_VARS = {
  NODE_ENV: 'development',
  PORT: '3002',
  
  // JWT
  JWT_SECRET: null, // Se genera automáticamente si no existe
  JWT_REFRESH_SECRET: null,
  JWT_ACCESS_EXPIRY: '7d',
  JWT_REFRESH_EXPIRY: '7d',
  JWT_ISSUER: 'usuarios-service',
  JWT_AUDIENCE: 'gestion-comercial',
  JWT_ALGORITHM: 'HS256',
  JWT_CLOCK_TOLERANCE: '30',
  
  // Base de datos
  DB_POOL_MAX: '20',
  DB_POOL_MIN: '5',
  DB_IDLE_TIMEOUT: '30000',
  DB_CONNECTION_TIMEOUT: '10000',
  DB_STATEMENT_TIMEOUT: '30000',
  DB_QUERY_TIMEOUT: '30000',
  DB_SSL_REJECT_UNAUTHORIZED: 'true',
  
  // Email
  EMAIL_PROVIDER: 'smtp',
  EMAIL_HOST: 'localhost',
  EMAIL_PORT: '587',
  EMAIL_SECURE: 'false',
  EMAIL_USER: '',
  EMAIL_PASS: '',
  EMAIL_FROM: 'noreply@gestioncomercial.com',
  
  // Frontend
  FRONTEND_URL: 'http://localhost:3000',
  
  // Aplicación
  APP_NAME: 'Gestión Comercial',
  LOG_LEVEL: 'info',
  
  // Rate Limiting
  SKIP_RATE_LIMIT: 'false',
  
  // CORS
  ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001'
};

/**
 * Variables de entorno sensibles (no logear)
 */
const SENSITIVE_VARS = [
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'EMAIL_PASS',
  'SENDGRID_API_KEY'
];

/**
 * Cargar y validar variables de entorno
 */
function loadEnvironment() {
  try {
    // Establecer valores por defecto
    Object.keys(DEFAULT_ENV_VARS).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = DEFAULT_ENV_VARS[key];
      }
    });
    
    // Validar variables requeridas
    validateRequiredVariables();
    
    // Transformar tipos de datos
    transformEnvironmentTypes();
    
    // Validar configuración específica por ambiente
    validateEnvironmentSpecific();
    
    // Log configuración (sin variables sensibles)
    logEnvironmentConfig();
    
    logger.info('Variables de entorno cargadas y validadas correctamente');
    
    return getEnvironmentConfig();
  } catch (error) {
    logger.error('Error cargando variables de entorno:', error);
    process.exit(1);
  }
}

/**
 * Validar variables requeridas
 */
function validateRequiredVariables() {
  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }
}

/**
 * Transformar tipos de datos de variables de entorno
 */
function transformEnvironmentTypes() {
  // Números
  const numericVars = [
    'PORT', 'DB_PORT', 'DB_POOL_MAX', 'DB_POOL_MIN', 
    'DB_IDLE_TIMEOUT', 'DB_CONNECTION_TIMEOUT', 
    'DB_STATEMENT_TIMEOUT', 'DB_QUERY_TIMEOUT',
    'EMAIL_PORT', 'JWT_CLOCK_TOLERANCE'
  ];
  
  numericVars.forEach(varName => {
    if (process.env[varName]) {
      const value = parseInt(process.env[varName]);
      if (isNaN(value)) {
        throw new Error(`Variable de entorno ${varName} debe ser un número válido`);
      }
      process.env[varName] = value.toString();
    }
  });
  
  // Booleanos
  const booleanVars = [
    'EMAIL_SECURE', 'DB_SSL_REJECT_UNAUTHORIZED', 'SKIP_RATE_LIMIT'
  ];
  
  booleanVars.forEach(varName => {
    if (process.env[varName]) {
      const value = process.env[varName].toLowerCase();
      if (!['true', 'false'].includes(value)) {
        throw new Error(`Variable de entorno ${varName} debe ser 'true' o 'false'`);
      }
    }
  });
  
  // Arrays (separados por coma)
  const arrayVars = ['ALLOWED_ORIGINS'];
  
  arrayVars.forEach(varName => {
    if (process.env[varName]) {
      // Validar que sea una lista válida
      const values = process.env[varName].split(',').map(v => v.trim());
      if (values.some(v => !v)) {
        throw new Error(`Variable de entorno ${varName} contiene valores vacíos`);
      }
    }
  });
}

/**
 * Validar configuración específica por ambiente
 */
function validateEnvironmentSpecific() {
  const env = process.env.NODE_ENV;
  
  if (env === 'production') {
    // Validaciones específicas para producción
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe estar configurado con al menos 32 caracteres en producción');
    }
    
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET debe estar configurado con al menos 32 caracteres en producción');
    }
    
    if (process.env.DB_PASSWORD === 'password') {
      throw new Error('DB_PASSWORD por defecto no es segura para producción');
    }
    
    if (process.env.FRONTEND_URL.includes('localhost')) {
      logger.warn('ADVERTENCIA: FRONTEND_URL contiene localhost en producción');
    }
  }
  
  if (env === 'development') {
    // Validaciones para desarrollo
    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET no configurado, se generará automáticamente');
    }
  }
}

/**
 * Log configuración de entorno (sin variables sensibles)
 */
function logEnvironmentConfig() {
  const config = {};
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('DB_') || key.startsWith('JWT_') || 
        key.startsWith('EMAIL_') || key === 'NODE_ENV' || 
        key === 'PORT' || key === 'FRONTEND_URL') {
      
      if (SENSITIVE_VARS.includes(key)) {
        config[key] = '[REDACTED]';
      } else {
        config[key] = process.env[key];
      }
    }
  });
  
  logger.info('Configuración de entorno:', config);
}

/**
 * Obtener configuración de entorno estructurada
 */
function getEnvironmentConfig() {
  return {
    // Aplicación
    app: {
      name: process.env.APP_NAME,
      env: process.env.NODE_ENV,
      port: parseInt(process.env.PORT),
      logLevel: process.env.LOG_LEVEL,
      frontendUrl: process.env.FRONTEND_URL,
      allowedOrigins: process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    },
    
    // Base de datos
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: {
        max: parseInt(process.env.DB_POOL_MAX),
        min: parseInt(process.env.DB_POOL_MIN),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT)
      },
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpiry: process.env.JWT_ACCESS_EXPIRY,
      refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      algorithm: process.env.JWT_ALGORITHM,
      clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE)
    },
    
    // Email
    email: {
      provider: process.env.EMAIL_PROVIDER,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM
    },
    
    // Rate Limiting
    rateLimiting: {
      skip: process.env.SKIP_RATE_LIMIT === 'true'
    }
  };
}

/**
 * Verificar si estamos en ambiente de desarrollo
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Verificar si estamos en ambiente de producción
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verificar si estamos en ambiente de test
 */
function isTest() {
  return process.env.NODE_ENV === 'test';
}

/**
 * Obtener variable de entorno con valor por defecto
 */
function getEnvVar(name, defaultValue = null) {
  const value = process.env[name];
  
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  }
  
  return value;
}

/**
 * Obtener variable de entorno como número
 */
function getEnvNumber(name, defaultValue = null) {
  const value = getEnvVar(name, defaultValue?.toString());
  const parsed = parseInt(value);
  
  if (isNaN(parsed)) {
    throw new Error(`Variable de entorno ${name} debe ser un número válido`);
  }
  
  return parsed;
}

/**
 * Obtener variable de entorno como booleano
 */
function getEnvBoolean(name, defaultValue = null) {
  const value = getEnvVar(name, defaultValue?.toString()).toLowerCase();
  
  if (!['true', 'false'].includes(value)) {
    throw new Error(`Variable de entorno ${name} debe ser 'true' o 'false'`);
  }
  
  return value === 'true';
}

// Cargar configuración al importar el módulo
const config = loadEnvironment();

module.exports = {
  config,
  loadEnvironment,
  getEnvironmentConfig,
  isDevelopment,
  isProduction,
  isTest,
  getEnvVar,
  getEnvNumber,
  getEnvBoolean
};
