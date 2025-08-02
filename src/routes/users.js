/**
 * Rutas de Gestión de Usuarios
 * Endpoints:
 * - GET /me: Obtener perfil propio
 * - PUT /me: Actualizar perfil propio
 * - PATCH /me/password: Cambiar contraseña
 * - POST /: Crear nuevo usuario (admin)
 * - GET /users: Listar usuarios (admin)
 * - GET /users/:id: Obtener usuario específico (admin)
 * - PUT /users/:id: Actualizar usuario (admin)
 * - PATCH /users/:id/deactivate: Desactivar usuario (admin)
 */

const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const userController = require('../controllers/userController');
const { validateUserCreation, validateUserUpdate, validatePasswordChange } = require('../middleware/validation');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting general a todas las rutas
router.use(generalLimiter);

/**
 * @route   GET /api/users/me
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/me',
  requireAuth,
  userController.getMyProfile
);

/**
 * @route   PUT /api/users/me
 * @desc    Actualizar perfil del usuario actual
 * @access  Private
 */
router.put('/me',
  requireAuth,
  validateUserUpdate,
  userController.updateMyProfile
);

/**
 * @route   PATCH /api/users/me/password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Private
 */
router.patch('/me/password',
  requireAuth,
  validatePasswordChange,
  userController.changeMyPassword
);

// Rutas administrativas - Solo para administradores

/**
 * @route   POST /api/users
 * @desc    Crear nuevo usuario
 * @access  Private (Admin only)
 */
router.post('/',
  requireAuth,
  requireRole(['administrador']),
  validateUserCreation,
  userController.createUser
);

/**
 * @route   GET /api/users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (Admin only)
 */
router.get('/stats',
  requireAuth,
  requireRole(['administrador']),
  userController.getUserStats
);

/**
 * @route   GET /api/users
 * @desc    Obtener lista de usuarios con filtros
 * @access  Private (Admin/Supervisor)
 */
router.get('/',
  requireAuth,
  requireRole(['administrador', 'supervisor']),
  userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario específico por ID
 * @access  Private (Admin/Supervisor)
 */
router.get('/:id',
  requireAuth,
  requireRole(['administrador', 'supervisor']),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario específico
 * @access  Private (Admin only)
 */
router.put('/:id',
  requireAuth,
  requireRole(['administrador']),
  validateUserUpdate,
  userController.updateUser
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Desactivar usuario específico
 * @access  Private (Admin only)
 */
router.patch('/:id/deactivate',
  requireAuth,
  requireRole(['administrador']),
  userController.deactivateUser
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activar usuario específico
 * @access  Private (Admin only)
 */
router.patch('/:id/activate',
  requireAuth,
  requireRole(['administrador']),
  userController.activateUser
);

module.exports = router;
