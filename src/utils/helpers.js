/**
 * Funciones Auxiliares
 * Utilidades:
 * - formatResponse: Formato estándar de respuestas API
 * - generateRandomCode: Códigos de verificación
 * - hashSensitiveData: Hash de datos sensibles
 * - parseQueryParams: Procesamiento de parámetros URL
 * - calculatePagination: Lógica de paginación
 */

const crypto = require('crypto');
const logger = require('./logger');

/**
 * Formatear respuesta estándar de API
 */
function formatResponse(success, message, data = null, meta = null) {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Formatear respuesta de error con detalles
 */
function formatErrorResponse(error, details = null) {
  const response = {
    success: false,
    message: error.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    error: {
      type: error.name || 'Error',
      code: error.code || 'UNKNOWN_ERROR'
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
}

/**
 * Formatear respuesta de validación con errores específicos
 */
function formatValidationErrorResponse(errors) {
  return {
    success: false,
    message: 'Errores de validación encontrados',
    timestamp: new Date().toISOString(),
    errors: Array.isArray(errors) ? errors : [errors]
  };
}

/**
 * Generar código aleatorio (para verificación, reset, etc.)
 */
function generateRandomCode(length = 6, options = {}) {
  const {
    includeNumbers = true,
    includeLetters = false,
    includeUppercase = false,
    includeSpecialChars = false
  } = options;
  
  let charset = '';
  
  if (includeNumbers) {
    charset += '0123456789';
  }
  
  if (includeLetters) {
    charset += 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeUppercase) {
    charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeSpecialChars) {
    charset += '!@#$%^&*';
  }
  
  if (!charset) {
    charset = '0123456789'; // fallback a números
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return result;
}

/**
 * Generar token seguro para URLs
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash de datos sensibles
 */
function hashSensitiveData(data, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Comparar hash de datos sensibles
 */
function compareHashedData(data, hash, algorithm = 'sha256') {
  const dataHash = crypto.createHash(algorithm).update(data).digest('hex');
  return dataHash === hash;
}

/**
 * Procesar parámetros de query string
 */
function parseQueryParams(query, allowedParams = []) {
  const parsed = {};
  
  if (allowedParams.length === 0) {
    return query; // Si no hay restricciones, devolver todos
  }
  
  allowedParams.forEach(param => {
    if (query[param] !== undefined) {
      parsed[param] = query[param];
    }
  });
  
  return parsed;
}

/**
 * Calcular información de paginación
 */
function calculatePagination(page, limit, total) {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null,
    offset: (currentPage - 1) * itemsPerPage
  };
}

/**
 * Formatear información de paginación para respuesta
 */
function formatPaginationResponse(data, pagination) {
  return {
    items: data,
    pagination: {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      total: pagination.totalItems,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNextPage,
      hasPrev: pagination.hasPrevPage
    }
  };
}

/**
 * Extraer IP real del cliente (considerando proxies)
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Formatear duración en milisegundos a texto legible
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Convertir bytes a formato legible
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validar y normalizar fecha
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  return date;
}

/**
 * Formatear fecha para respuesta API
 */
function formatDateForAPI(date) {
  if (!date) return null;
  
  const normalizedDate = normalizeDate(date);
  return normalizedDate.toISOString();
}

/**
 * Crear slug desde texto
 */
function createSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplazar espacios con -
    .replace(/[^\w\-]+/g, '')       // Remover caracteres no-word
    .replace(/\-\-+/g, '-')         // Reemplazar múltiples - con uno solo
    .replace(/^-+/, '')             // Trim - del inicio
    .replace(/-+$/, '');            // Trim - del final
}

/**
 * Obtener información del User-Agent
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { browser: 'Unknown', version: 'Unknown', platform: 'Unknown' };
  }
  
  // Detección básica de navegador
  let browser = 'Unknown';
  let version = 'Unknown';
  let platform = 'Unknown';
  
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) version = match[1];
  }
  
  // Detección de plataforma
  if (userAgent.includes('Windows')) platform = 'Windows';
  else if (userAgent.includes('Mac')) platform = 'MacOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';
  else if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iOS')) platform = 'iOS';
  
  return { browser, version, platform };
}

/**
 * Sanitizar entrada de URL
 */
function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Solo permitir HTTP y HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Retry con backoff exponencial
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        break; // Último intento fallido
      }
      
      const delay = baseDelay * Math.pow(2, i);
      logger.warn(`Retry ${i + 1}/${maxRetries} fallido, reintentando en ${delay}ms`, {
        error: error.message
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Debounce para funciones
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle para funciones
 */
function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Verificar si es un objeto vacío
 */
function isEmpty(obj) {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
}

/**
 * Deep clone de objeto
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
}

/**
 * Obtener diferencias entre dos objetos
 */
function getObjectDiff(oldObj, newObj) {
  const diff = {};
  
  Object.keys(newObj).forEach(key => {
    if (oldObj[key] !== newObj[key]) {
      diff[key] = {
        old: oldObj[key],
        new: newObj[key]
      };
    }
  });
  
  return diff;
}

/**
 * Clases de Error Personalizadas
 */
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

class AuthenticationError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

class AuthorizationError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

class NotFoundError extends Error {
  constructor(message, statusCode = 404) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = statusCode;
  }
}

class ConflictError extends Error {
  constructor(message, statusCode = 409) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = statusCode;
  }
}

class RateLimitError extends Error {
  constructor(message, statusCode = 429) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  // Respuestas
  formatResponse,
  formatErrorResponse,
  formatValidationErrorResponse,
  
  // Generadores
  generateRandomCode,
  generateSecureToken,
  
  // Hash y seguridad
  hashSensitiveData,
  compareHashedData,
  
  // Query y paginación
  parseQueryParams,
  calculatePagination,
  formatPaginationResponse,
  
  // Utilidades de red
  getClientIP,
  parseUserAgent,
  sanitizeURL,
  
  // Formateo
  formatDuration,
  formatBytes,
  formatDateForAPI,
  createSlug,
  
  // Fechas
  normalizeDate,
  
  // Control de flujo
  retryWithBackoff,
  debounce,
  throttle,
  
  // Objetos
  isEmpty,
  deepClone,
  getObjectDiff,
  
  // Clases de Error
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};
