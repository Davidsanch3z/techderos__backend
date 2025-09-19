/**
 * Rutas de Autenticación
 * Endpoints:
 * - POST /register: Registro de nuevos usuarios
 * - POST /login: Autenticación de usuarios
 * - POST /logout: Cierre de sesión
 * - POST /refresh: Renovación de tokens
 * - POST /verify-email: Verificación de correo
 * - POST /forgot-password: Solicitud de recuperación
 * - POST /reset-password: Reseteo de contraseña
 * - GET /me: Verificar token y obtener datos del usuario
 * - GET /profile: Obtener perfil del usuario autenticado
 * - PUT /profile: Actualizar perfil del usuario
 * - PUT /change-password: Cambiar contraseña del usuario
 */

const express = require("express");
const router = express.Router();

// Importar controladores y middlewares
const authController = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateUpdateProfile,
  validateChangePassword,
} = require("../middleware/validation");
const { authLimiter, strictLimiter } = require("../middleware/rateLimiter");
const { requireAuth } = require("../middleware/auth");

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
  validateRegister,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario
 * @access  Public
 */
router.post("/login", authLimiter, validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso
 * @access  Public
 */
router.post("/refresh", authLimiter, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión del usuario
 * @access  Private
 */
router.post("/logout", requireAuth, authController.logout);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email del usuario
 * @access  Public
 */
router.post("/verify-email", strictLimiter, authController.verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
router.post("/forgot-password", strictLimiter, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña
 * @access  Public
 */
router.post(
  "/reset-password",
  strictLimiter,
  validatePasswordReset,
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Verificar token y obtener datos del usuario
 * @access  Private
 */
router.get("/me", requireAuth, authController.verifyToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/profile", requireAuth, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put(
  "/profile",
  requireAuth,
  validateUpdateProfile,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put(
  "/change-password",
  requireAuth,
  validateChangePassword,
  authController.changePassword
);

module.exports = router;

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email del usuario
 * @access  Public
 */
router.get("/verify-service-status", authController.verifyServiceStatus);
