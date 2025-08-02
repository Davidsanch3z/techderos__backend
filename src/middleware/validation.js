/**
 * Middleware de Validación
 * Funciones:
 * - validateRegister: Validar datos de registro
 * - validateLogin: Validar datos de login
 * - validateUpdate: Validar actualizaciones de perfil
 * - sanitizeInput: Limpiar y sanitizar datos
 * - checkRequiredFields: Verificar campos obligatorios
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');

/**
 * Schema de validación para registro de usuario
 */
const registerSchema = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .max(255)
    .lowercase()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'string.max': 'El email no puede exceder 255 caracteres',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede exceder 128 caracteres',
      'any.required': 'La contraseña es requerida'
    }),

  telefono: Joi.string()
    .pattern(/^[3][0-9]{9}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'El teléfono debe tener formato válido de Colombia (10 dígitos iniciando en 3)'
    }),

  tipo_negocio: Joi.string()
    .valid('tienda', 'supermercado', 'farmacia', 'restaurante', 'otro')
    .required()
    .messages({
      'any.only': 'Tipo de negocio debe ser: tienda, supermercado, farmacia, restaurante u otro',
      'any.required': 'El tipo de negocio es requerido'
    }),

  rol: Joi.string()
    .valid('tendero', 'administrador', 'supervisor')
    .default('tendero')
    .messages({
      'any.only': 'Rol debe ser: tendero, administrador o supervisor'
    })
});

/**
 * Schema de validación para creación de usuario por admin
 */
const createUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .max(255)
    .lowercase()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'string.max': 'El email no puede exceder 255 caracteres',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'string.max': 'La contraseña no puede exceder 128 caracteres',
      'any.required': 'La contraseña es requerida'
    }),

  rol: Joi.string()
    .valid('usuario', 'administrador', 'moderador')
    .default('usuario')
    .messages({
      'any.only': 'Rol debe ser: usuario, administrador o moderador'
    })
});

/**
 * Schema de validación para login
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es requerida'
    })
});

/**
 * Schema de validación para actualización de perfil
 */
const updateProfileSchema = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),

  telefono: Joi.string()
    .pattern(/^[3][0-9]{9}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'El teléfono debe tener formato válido de Colombia (10 dígitos iniciando en 3)'
    }),

  tipo_negocio: Joi.string()
    .valid('tienda', 'supermercado', 'farmacia', 'restaurante', 'otro')
    .optional()
    .messages({
      'any.only': 'Tipo de negocio debe ser: tienda, supermercado, farmacia, restaurante u otro'
    })
});

/**
 * Schema de validación para cambio de contraseña
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña actual es requerida'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)',
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'string.max': 'La nueva contraseña no puede exceder 128 caracteres',
      'any.required': 'La nueva contraseña es requerida'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'La confirmación de contraseña debe coincidir con la nueva contraseña',
      'any.required': 'La confirmación de contraseña es requerida'
    })
});

/**
 * Schema de validación para actualización de perfil
 */
const updateUserSchema = Joi.object({
  nombre: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),

  telefono: Joi.string()
    .pattern(/^[3][0-9]{9}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'El teléfono debe tener formato válido de Colombia (10 dígitos iniciando en 3)'
    }),

  tipo_negocio: Joi.string()
    .valid('tienda', 'supermercado', 'farmacia', 'restaurante', 'otro')
    .optional()
    .messages({
      'any.only': 'Tipo de negocio debe ser: tienda, supermercado, farmacia, restaurante u otro'
    }),

  rol: Joi.string()
    .valid('tendero', 'administrador', 'supervisor')
    .optional()
    .messages({
      'any.only': 'Rol debe ser: tendero, administrador o supervisor'
    }),

  status: Joi.string()
    .valid('pending', 'active', 'inactive', 'suspended')
    .optional()
    .messages({
      'any.only': 'Status debe ser: pending, active, inactive o suspended'
    })
});

/**
 * Schema de validación para cambio de contraseña
 */
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña actual es requerida'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)',
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'string.max': 'La nueva contraseña no puede exceder 128 caracteres',
      'any.required': 'La nueva contraseña es requerida'
    })
});

/**
 * Schema de validación para reset de contraseña
 */
const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'El token de reset es requerido'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)',
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'string.max': 'La nueva contraseña no puede exceder 128 caracteres',
      'any.required': 'La nueva contraseña es requerida'
    })
});

/**
 * Función auxiliar para validar y sanitizar datos
 */
const validateAndSanitize = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validación fallida:', {
        endpoint: req.originalUrl,
        method: req.method,
        errors
      });

      return res.status(400).json(
        formatResponse(false, 'Datos de entrada inválidos', { errors })
      );
    }

    // Reemplazar req.body con los datos validados y sanitizados
    req.body = value;
    next();
  };
};

/**
 * Middleware para validar registro
 */
const validateRegister = validateAndSanitize(registerSchema);

/**
 * Middleware para validar login
 */
const validateLogin = validateAndSanitize(loginSchema);

/**
 * Middleware para validar creación de usuario
 */
const validateUserCreation = validateAndSanitize(createUserSchema);

/**
 * Middleware para validar actualización de usuario
 */
const validateUserUpdate = validateAndSanitize(updateUserSchema);

/**
 * Middleware para validar cambio de contraseña
 */
const validatePasswordChange = validateAndSanitize(passwordChangeSchema);

/**
 * Middleware para validar reset de contraseña
 */
const validatePasswordReset = validateAndSanitize(passwordResetSchema);

/**
 * Middleware para sanitizar query parameters
 */
const sanitizeQuery = (allowedParams = []) => {
  return (req, res, next) => {
    const sanitizedQuery = {};
    
    allowedParams.forEach(param => {
      if (req.query[param] !== undefined) {
        sanitizedQuery[param] = req.query[param];
      }
    });

    req.query = sanitizedQuery;
    next();
  };
};

/**
 * Middleware para validar parámetros de URL
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json(
        formatResponse(false, 'Parámetros de URL inválidos', { errors })
      );
    }

    req.params = value;
    next();
  };
};

/**
 * Schema para validar UUID en parámetros
 */
const uuidParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'ID debe ser un UUID válido',
      'any.required': 'ID es requerido'
    })
});

/**
 * Middleware para validar actualización de perfil
 */
const validateUpdateProfile = validateAndSanitize(updateProfileSchema);

/**
 * Middleware para validar cambio de contraseña
 */
const validateChangePassword = validateAndSanitize(changePasswordSchema);

/**
 * Middleware para validar UUID en parámetros
 */
const validateUuidParam = validateParams(uuidParamSchema);

module.exports = {
  validateRegister,
  validateLogin,
  validateUserCreation,
  validateUserUpdate,
  validatePasswordChange,
  validatePasswordReset,
  validateUpdateProfile,
  validateChangePassword,
  validateUuidParam,
  sanitizeQuery,
  validateParams
};
