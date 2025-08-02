/**
 * Validadores Personalizados
 * Validaciones:
 * - validateColombianPhone: Formato teléfonos Colombia
 * - validateStrongPassword: Políticas de contraseña
 * - validateBusinessType: Tipos de negocio válidos
 * - sanitizeHTML: Limpieza de inputs HTML
 * - validateDateRange: Rangos de fechas válidos
 */

const logger = require('./logger');

/**
 * Validar formato de teléfono colombiano
 */
function validateColombianPhone(phone) {
  if (!phone) return { isValid: true }; // Campo opcional
  
  // Remover espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Validar formato: 10 dígitos iniciando en 3
  const phoneRegex = /^[3][0-9]{9}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'El teléfono debe tener 10 dígitos y comenzar con 3 (formato Colombia)'
    };
  }
  
  // Validar prefijos válidos para Colombia
  const validPrefixes = ['300', '301', '302', '303', '304', '305', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '350', '351'];
  const prefix = cleanPhone.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      message: 'Prefijo de teléfono no válido para Colombia'
    };
  }
  
  return { isValid: true, cleanPhone };
}

/**
 * Validar política de contraseña fuerte
 */
function validateStrongPassword(password) {
  const requirements = [];
  
  if (!password) {
    return {
      isValid: false,
      message: 'La contraseña es requerida'
    };
  }
  
  // Longitud mínima
  if (password.length < 8) {
    requirements.push('al menos 8 caracteres');
  }
  
  // Longitud máxima
  if (password.length > 128) {
    requirements.push('máximo 128 caracteres');
  }
  
  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    requirements.push('una letra minúscula');
  }
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    requirements.push('una letra mayúscula');
  }
  
  // Al menos un número
  if (!/\d/.test(password)) {
    requirements.push('un número');
  }
  
  // Al menos un carácter especial
  if (!/[@$!%*?&]/.test(password)) {
    requirements.push('un carácter especial (@$!%*?&)');
  }
  
  // Verificar patrones comunes débiles
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      requirements.push('no contener patrones comunes débiles');
      break;
    }
  }
  
  // Verificar secuencias repetitivas
  if (/(.)\1{2,}/.test(password)) {
    requirements.push('no tener más de 2 caracteres repetidos consecutivos');
  }
  
  if (requirements.length > 0) {
    return {
      isValid: false,
      message: `La contraseña debe tener: ${requirements.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validar tipo de negocio
 */
function validateBusinessType(businessType) {
  const validTypes = [
    'tienda',
    'supermercado',
    'farmacia',
    'restaurante',
    'panaderia',
    'carniceria',
    'verduleria',
    'ferreteria',
    'papeleria',
    'otro'
  ];
  
  if (!businessType) {
    return {
      isValid: false,
      message: 'El tipo de negocio es requerido'
    };
  }
  
  if (!validTypes.includes(businessType.toLowerCase())) {
    return {
      isValid: false,
      message: `Tipo de negocio debe ser uno de: ${validTypes.join(', ')}`
    };
  }
  
  return { isValid: true, normalizedType: businessType.toLowerCase() };
}

/**
 * Validar formato de email con verificaciones adicionales
 */
function validateEmail(email) {
  if (!email) {
    return {
      isValid: false,
      message: 'El email es requerido'
    };
  }
  
  // Regex básico para email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Formato de email inválido'
    };
  }
  
  // Validar longitud
  if (email.length > 255) {
    return {
      isValid: false,
      message: 'El email no puede exceder 255 caracteres'
    };
  }
  
  // Validar dominio
  const domain = email.split('@')[1];
  if (domain.length > 253) {
    return {
      isValid: false,
      message: 'Dominio de email demasiado largo'
    };
  }
  
  // Lista de dominios temporales conocidos (opcional)
  const tempDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org'
  ];
  
  if (tempDomains.includes(domain.toLowerCase())) {
    return {
      isValid: false,
      message: 'No se permiten emails temporales'
    };
  }
  
  return { isValid: true, normalizedEmail: email.toLowerCase().trim() };
}

/**
 * Validar nombre de usuario/persona
 */
function validateName(name) {
  if (!name) {
    return {
      isValid: false,
      message: 'El nombre es requerido'
    };
  }
  
  const trimmedName = name.trim();
  
  // Longitud
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'El nombre debe tener al menos 2 caracteres'
    };
  }
  
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'El nombre no puede exceder 100 caracteres'
    };
  }
  
  // Solo letras, espacios y caracteres acentuados
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message: 'El nombre solo puede contener letras y espacios'
    };
  }
  
  // No permitir solo espacios
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedName)) {
    return {
      isValid: false,
      message: 'El nombre debe contener al menos una letra'
    };
  }
  
  return { isValid: true, normalizedName: trimmedName };
}

/**
 * Sanitizar entrada HTML
 */
function sanitizeHTML(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // Remover tags HTML
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Decodificar entidades HTML comunes
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#96;': '`'
  };
  
  let sanitized = withoutTags;
  Object.keys(htmlEntities).forEach(entity => {
    sanitized = sanitized.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
  });
  
  return sanitized.trim();
}

/**
 * Validar rango de fechas
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Validar que las fechas sean válidas
  if (isNaN(start.getTime())) {
    return {
      isValid: false,
      message: 'Fecha de inicio inválida'
    };
  }
  
  if (isNaN(end.getTime())) {
    return {
      isValid: false,
      message: 'Fecha de fin inválida'
    };
  }
  
  // Validar que la fecha de inicio sea anterior a la de fin
  if (start >= end) {
    return {
      isValid: false,
      message: 'La fecha de inicio debe ser anterior a la fecha de fin'
    };
  }
  
  // Validar que las fechas no sean muy futuras (más de 1 año)
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (start > oneYearFromNow || end > oneYearFromNow) {
    return {
      isValid: false,
      message: 'Las fechas no pueden ser más de 1 año en el futuro'
    };
  }
  
  // Validar que el rango no sea muy grande (más de 1 año)
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  
  if (end.getTime() - start.getTime() > oneYearInMs) {
    return {
      isValid: false,
      message: 'El rango de fechas no puede ser mayor a 1 año'
    };
  }
  
  return { isValid: true };
}

/**
 * Validar UUID v4
 */
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid) {
    return {
      isValid: false,
      message: 'UUID es requerido'
    };
  }
  
  if (!uuidRegex.test(uuid)) {
    return {
      isValid: false,
      message: 'Formato de UUID inválido'
    };
  }
  
  return { isValid: true };
}

/**
 * Validar parámetros de paginación
 */
function validatePagination(page, limit) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  const errors = [];
  
  if (pageNum < 1) {
    errors.push('La página debe ser mayor a 0');
  }
  
  if (pageNum > 1000) {
    errors.push('La página no puede ser mayor a 1000');
  }
  
  if (limitNum < 1) {
    errors.push('El límite debe ser mayor a 0');
  }
  
  if (limitNum > 100) {
    errors.push('El límite no puede ser mayor a 100');
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      message: errors.join(', ')
    };
  }
  
  return {
    isValid: true,
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
}

/**
 * Validar entrada de búsqueda/filtro
 */
function validateSearchQuery(query) {
  if (!query) {
    return { isValid: true, query: '' };
  }
  
  const trimmedQuery = query.trim();
  
  // Longitud mínima para búsqueda
  if (trimmedQuery.length < 2) {
    return {
      isValid: false,
      message: 'La búsqueda debe tener al menos 2 caracteres'
    };
  }
  
  // Longitud máxima
  if (trimmedQuery.length > 100) {
    return {
      isValid: false,
      message: 'La búsqueda no puede exceder 100 caracteres'
    };
  }
  
  // Sanitizar para prevenir inyección SQL
  const sanitizedQuery = trimmedQuery.replace(/['"\\]/g, '');
  
  return {
    isValid: true,
    query: sanitizedQuery
  };
}

/**
 * Validador compuesto para registro completo
 */
function validateUserRegistration(userData) {
  const errors = [];
  
  // Validar nombre
  const nameValidation = validateName(userData.nombre);
  if (!nameValidation.isValid) {
    errors.push({ field: 'nombre', message: nameValidation.message });
  }
  
  // Validar email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  }
  
  // Validar contraseña
  const passwordValidation = validateStrongPassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.message });
  }
  
  // Validar teléfono (opcional)
  if (userData.telefono) {
    const phoneValidation = validateColombianPhone(userData.telefono);
    if (!phoneValidation.isValid) {
      errors.push({ field: 'telefono', message: phoneValidation.message });
    }
  }
  
  // Validar tipo de negocio
  const businessValidation = validateBusinessType(userData.tipo_negocio);
  if (!businessValidation.isValid) {
    errors.push({ field: 'tipo_negocio', message: businessValidation.message });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      nombre: nameValidation.normalizedName,
      email: emailValidation.normalizedEmail,
      telefono: userData.telefono ? validateColombianPhone(userData.telefono).cleanPhone : null,
      tipo_negocio: businessValidation.normalizedType,
      rol: userData.rol || 'tendero'
    } : null
  };
}

module.exports = {
  validateColombianPhone,
  validateStrongPassword,
  validateBusinessType,
  validateEmail,
  validateName,
  sanitizeHTML,
  validateDateRange,
  validateUUID,
  validatePagination,
  validateSearchQuery,
  validateUserRegistration
};
