/**
 * Middleware de Rate Limiting
 * Configuraciones:
 * - authLimiter: 5 intentos de login por 15 min
 * - generalLimiter: 100 requests por 15 min
 * - strictLimiter: 3 intentos para endpoints sensibles
 * - bypassLimiter: Excepciones para IPs confiables
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter para endpoints de autenticación
 * Más restrictivo para prevenir ataques de fuerza bruta
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 5 intentos por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // incluir headers `RateLimit-*`
  legacyHeaders: false, // desactivar headers `X-RateLimit-*`
  keyGenerator: (req) => {
    // Usar IP + email si está disponible para mayor precisión
    const email = req.body?.email || '';
    return `auth:${req.ip}:${email}`;
  },
  onLimitReached: (req) => {
    logger.warn('Rate limit alcanzado en endpoint de autenticación', {
      ip: req.ip,
      email: req.body?.email,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Rate limiter general para la mayoría de endpoints
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar IP + userId si está autenticado
    const userId = req.user?.id || '';
    return `general:${req.ip}:${userId}`;
  },
  onLimitReached: (req) => {
    logger.warn('Rate limit general alcanzado', {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Rate limiter estricto para endpoints sensibles
 * Como recuperación de contraseña, verificación de email
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos por hora
  message: {
    success: false,
    message: 'Demasiados intentos en endpoint sensible. Intenta nuevamente en 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `strict:${req.ip}:${email}`;
  },
  onLimitReached: (req) => {
    logger.warn('Rate limit estricto alcanzado', {
      ip: req.ip,
      email: req.body?.email,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Rate limiter para creación de cuentas
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 registros por hora por IP
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP. Intenta nuevamente en 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `register:${req.ip}`,
  onLimitReached: (req) => {
    logger.warn('Rate limit de registro alcanzado', {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Rate limiter para operaciones administrativas
 */
const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 50, // máximo 50 operaciones por 10 minutos
  message: {
    success: false,
    message: 'Demasiadas operaciones administrativas. Intenta nuevamente en 10 minutos.',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `admin:${req.user?.id || req.ip}`,
  onLimitReached: (req) => {
    logger.warn('Rate limit administrativo alcanzado', {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Skip function para rate limiting
 * Permite excepciones para IPs confiables o usuarios específicos
 */
const createSkipFunction = (trustedIPs = [], trustedUserIds = []) => {
  return (req) => {
    // Saltear para IPs confiables
    if (trustedIPs.includes(req.ip)) {
      return true;
    }

    // Saltear para usuarios confiables
    if (req.user && trustedUserIds.includes(req.user.id)) {
      return true;
    }

    // Saltear en ambiente de desarrollo si está configurado
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
      return true;
    }

    return false;
  };
};

/**
 * Rate limiter configurable
 */
const createCustomLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Demasiadas solicitudes',
    keyPrefix = 'custom',
    trustedIPs = [],
    trustedUserIds = []
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: `${Math.ceil(windowMs / 60000)} minutos`
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = req.user?.id || '';
      return `${keyPrefix}:${req.ip}:${userId}`;
    },
    skip: createSkipFunction(trustedIPs, trustedUserIds),
    onLimitReached: (req) => {
      logger.warn(`Rate limit ${keyPrefix} alcanzado`, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
    }
  });
};

/**
 * Middleware para logging de rate limit headers
 */
const logRateLimitHeaders = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log headers de rate limit si están presentes
    const rateLimitHeaders = {};
    Object.keys(res.getHeaders()).forEach(header => {
      if (header.toLowerCase().startsWith('ratelimit-')) {
        rateLimitHeaders[header] = res.get(header);
      }
    });

    if (Object.keys(rateLimitHeaders).length > 0) {
      logger.debug('Rate limit headers enviados', {
        ip: req.ip,
        endpoint: req.originalUrl,
        headers: rateLimitHeaders
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  strictLimiter,
  registerLimiter,
  adminLimiter,
  createCustomLimiter,
  createSkipFunction,
  logRateLimitHeaders
};
