/**
 * Middleware de Autenticación
 * Funciones:
 * - verifyToken: Validar JWT en headers
 * - requireAuth: Requiere autenticación válida
 * - requireRole: Verificar roles específicos
 * - requirePermission: Verificar permisos granulares
 * - checkAccountLock: Verificar si cuenta está bloqueada
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');

/**
 * Middleware para verificar token JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        formatResponse(false, 'Token de autorización requerido')
      );
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    if (!token) {
      return res.status(401).json(
        formatResponse(false, 'Token de acceso requerido')
      );
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json(
        formatResponse(false, 'Usuario no encontrado')
      );
    }

    // Verificar si la cuenta está activa
    if (user.status !== 'active') {
      return res.status(401).json(
        formatResponse(false, 'Cuenta de usuario inactiva')
      );
    }

    // Verificar si la cuenta está bloqueada
    if (user.isAccountLocked()) {
      return res.status(423).json(
        formatResponse(false, 'Cuenta temporalmente bloqueada por intentos fallidos')
      );
    }

    // Agregar usuario al request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Error verificando token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        formatResponse(false, 'Token inválido')
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        formatResponse(false, 'Token expirado')
      );
    }
    
    res.status(500).json(
      formatResponse(false, 'Error interno del servidor')
    );
  }
};

/**
 * Middleware que requiere autenticación
 */
const requireAuth = (req, res, next) => {
  return verifyToken(req, res, next);
};

/**
 * Middleware para requerir roles específicos
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Autenticación requerida')
        );
      }

      const userRole = req.user.rol;
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Acceso denegado por rol insuficiente', {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json(
          formatResponse(false, 'Permisos insuficientes para acceder a este recurso')
        );
      }

      next();
    } catch (error) {
      logger.error('Error verificando roles:', error);
      res.status(500).json(
        formatResponse(false, 'Error interno del servidor')
      );
    }
  };
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Autenticación requerida')
        );
      }

      // Obtener el rol del usuario
      const role = await Role.findByName(req.user.rol);
      
      if (!role) {
        return res.status(403).json(
          formatResponse(false, 'Rol de usuario no válido')
        );
      }

      // Verificar si el rol tiene el permiso
      if (!role.hasPermission(permission)) {
        logger.warn('Acceso denegado por permiso insuficiente', {
          userId: req.user.id,
          userRole: req.user.rol,
          requiredPermission: permission,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json(
          formatResponse(false, `Permiso requerido: ${permission}`)
        );
      }

      req.userRole = role;
      next();
    } catch (error) {
      logger.error('Error verificando permisos:', error);
      res.status(500).json(
        formatResponse(false, 'Error interno del servidor')
      );
    }
  };
};

/**
 * Middleware para verificar permisos con ownership
 */
const requirePermissionOrOwnership = (permission, getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Autenticación requerida')
        );
      }

      // Obtener el rol del usuario
      const role = await Role.findByName(req.user.rol);
      
      if (!role) {
        return res.status(403).json(
          formatResponse(false, 'Rol de usuario no válido')
        );
      }

      // Determinar si el usuario es propietario del recurso
      const resourceOwnerId = await getResourceOwnerId(req);
      const isOwner = resourceOwnerId === req.user.id;

      // Verificar permisos
      const [resource, action] = permission.split('.');
      if (!role.canAccess(resource, action, isOwner)) {
        logger.warn('Acceso denegado por permiso/ownership insuficiente', {
          userId: req.user.id,
          userRole: req.user.rol,
          requiredPermission: permission,
          isOwner,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json(
          formatResponse(false, 'No tienes permisos para acceder a este recurso')
        );
      }

      req.userRole = role;
      req.isResourceOwner = isOwner;
      next();
    } catch (error) {
      logger.error('Error verificando permisos con ownership:', error);
      res.status(500).json(
        formatResponse(false, 'Error interno del servidor')
      );
    }
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continuar sin autenticación
  }

  // Si hay token, intentar verificarlo
  return verifyToken(req, res, next);
};

/**
 * Middleware para verificar si es el mismo usuario o admin
 */
const requireSelfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;
  const userRole = req.user.rol;

  if (currentUserId === targetUserId || userRole === 'administrador') {
    return next();
  }

  return res.status(403).json(
    formatResponse(false, 'Solo puedes acceder a tu propio perfil')
  );
};

module.exports = {
  verifyToken,
  requireAuth,
  requireRole,
  requirePermission,
  requirePermissionOrOwnership,
  optionalAuth,
  requireSelfOrAdmin
};
