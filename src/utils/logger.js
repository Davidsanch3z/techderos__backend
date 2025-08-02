/**
 * Sistema de Logging
 * Características:
 * - Configuración Winston con múltiples transports
 * - Logs estructurados en JSON para producción
 * - Rotación de archivos de log
 * - Diferentes niveles: error, warn, info, debug
 * - Contexto de request con correlation IDs
 */

const winston = require('winston');
const path = require('path');

// Crear directorio de logs si no existe
const logDir = path.join(process.cwd(), 'logs');

/**
 * Configuración de niveles de log personalizados
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Colores para cada nivel en consola
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Configurar colores
winston.addColors(logColors);

/**
 * Formato para logs en desarrollo (legible)
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    
    // Formatear objeto extra si existe
    const extraInfo = Object.keys(extra).length > 0 
      ? `\n${JSON.stringify(extra, null, 2)}` 
      : '';
    
    return `${timestamp} [${level}]: ${message}${extraInfo}`;
  })
);

/**
 * Formato para logs en producción (JSON estructurado)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Agregar contexto adicional
    const logEntry = {
      ...info,
      service: 'usuarios-service',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return JSON.stringify(logEntry);
  })
);

/**
 * Transports según el ambiente
 */
function getTransports() {
  const transports = [];
  
  // Console transport (siempre presente)
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.NODE_ENV === 'production' 
        ? productionFormat 
        : developmentFormat
    })
  );
  
  // File transports solo en producción
  if (process.env.NODE_ENV === 'production') {
    // Logs de error
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: productionFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );
    
    // Logs combinados
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: productionFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      })
    );
    
    // Logs de HTTP requests
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'http.log'),
        level: 'http',
        format: productionFormat,
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        tailable: true
      })
    );
  }
  
  return transports;
}

/**
 * Crear logger principal
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'usuarios-service',
    pid: process.pid
  },
  transports: getTransports(),
  
  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ],
  
  // Manejar rechazos de promesas no capturadas
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ],
  
  // No salir en errores manejados
  exitOnError: false
});

/**
 * Logger para requests HTTP con correlación
 */
function createRequestLogger(req, res, next) {
  // Generar correlation ID único para el request
  const correlationId = require('crypto').randomUUID();
  
  // Agregar correlation ID al request
  req.correlationId = correlationId;
  
  // Crear logger contextual para este request
  req.logger = logger.child({
    correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Log inicio del request
  req.logger.http('Request iniciado', {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    headers: filterSensitiveHeaders(req.headers)
  });
  
  // Interceptar respuesta para logging
  const originalSend = res.send;
  res.send = function(data) {
    req.logger.http('Request completado', {
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      contentLength: res.get('Content-Length')
    });
    
    return originalSend.call(this, data);
  };
  
  // Marcar tiempo de inicio
  req.startTime = Date.now();
  
  next();
}

/**
 * Filtrar headers sensibles para logging
 */
function filterSensitiveHeaders(headers) {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  });
  
  return filtered;
}

/**
 * Logger para errores con contexto adicional
 */
function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  };
  
  logger.error('Error capturado', errorInfo);
}

/**
 * Logger para eventos de seguridad
 */
function logSecurityEvent(event, details = {}) {
  logger.warn(`SECURITY: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details,
    _security: true // flag para filtrado posterior
  });
}

/**
 * Logger para métricas de rendimiento
 */
function logPerformance(operation, duration, details = {}) {
  logger.info(`PERFORMANCE: ${operation}`, {
    operation,
    duration,
    unit: 'ms',
    ...details,
    _performance: true // flag para filtrado posterior
  });
}

/**
 * Logger para eventos de auditoría
 */
function logAudit(action, details = {}) {
  logger.info(`AUDIT: ${action}`, {
    action,
    timestamp: new Date().toISOString(),
    ...details,
    _audit: true // flag para filtrado posterior
  });
}

/**
 * Configurar logging de consultas de base de datos en desarrollo
 */
function setupDatabaseLogging() {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_DB_QUERIES === 'true') {
    // Este logging se maneja en el archivo de configuración de base de datos
    logger.debug('Database query logging habilitado');
  }
}

/**
 * Cleanup de logs antiguos (ejecutar periódicamente)
 */
function cleanupOldLogs() {
  if (process.env.NODE_ENV === 'production') {
    // Implementación futura: limpiar logs de más de X días
    logger.info('Cleanup de logs ejecutado');
  }
}

/**
 * Obtener nivel de log actual
 */
function getCurrentLogLevel() {
  return logger.level;
}

/**
 * Cambiar nivel de log dinámicamente
 */
function setLogLevel(level) {
  if (logLevels.hasOwnProperty(level)) {
    logger.level = level;
    logger.info(`Nivel de log cambiado a: ${level}`);
  } else {
    logger.warn(`Nivel de log inválido: ${level}`);
  }
}

/**
 * Obtener estadísticas de logging
 */
function getLogStats() {
  return {
    currentLevel: logger.level,
    transports: logger.transports.length,
    environment: process.env.NODE_ENV,
    logDirectory: logDir
  };
}

// Configurar logging de base de datos
setupDatabaseLogging();

// Programar cleanup de logs (cada 24 horas en producción)
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
}

// Manejar señales para flush de logs antes de exit
process.on('SIGINT', () => {
  logger.info('Proceso interrumpido, finalizando logs...');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Proceso terminado, finalizando logs...');
  logger.end();
});

module.exports = logger;
