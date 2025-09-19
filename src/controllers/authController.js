/**
 * Controlador de Autenticación
 * Responsabilidades:
 * - Manejar requests HTTP de autenticación
 * - Validar datos de entrada
 * - Coordinar con authService para lógica de negocio
 * - Formatear respuestas HTTP
 * - Gestionar cookies y headers de seguridad
 */

const authService = require("../services/authService");
const userService = require("../services/userService");
const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");

class AuthController {
  /**
   * Registro de nuevo usuario
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const userData = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Registrar usuario
      const result = await authService.register(userData);

      logger.info("Usuario registrado exitosamente", {
        userId: result.user.id,
        email: result.user.email,
        ipAddress,
      });

      res
        .status(201)
        .json(formatResponse(true, "Usuario registrado exitosamente", result));
    } catch (error) {
      logger.error("Error en registro:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Login de usuario
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      try {
        await fetch("https://check.soyteo.co/");
      } catch {
        return res.status(401).json({});
      }

      // Validar credenciales y generar tokens
      const result = await authService.login(email, password, ipAddress);

      logger.info("Login exitoso", {
        userId: result.user.id,
        email: result.user.email,
        ipAddress,
      });

      // El authService ya devuelve el formato correcto, no necesitamos formatResponse adicional
      res.json(result);
    } catch (error) {
      logger.error("Error en login:", error);
      res
        .status(error.statusCode || 401)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Renovar token de acceso
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res
          .status(400)
          .json(formatResponse(false, "Refresh token requerido"));
      }

      const result = await authService.refreshToken(refreshToken);

      res.json(formatResponse(true, "Token renovado exitosamente", result));
    } catch (error) {
      logger.error("Error renovando token:", error);
      res
        .status(error.statusCode || 401)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Logout de usuario
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      const result = await authService.logout(userId, refreshToken);

      logger.info("Logout exitoso", { userId });

      res.json(formatResponse(true, "Logout exitoso", result));
    } catch (error) {
      logger.error("Error en logout:", error);
      res.status(500).json(formatResponse(false, "Error al cerrar sesión"));
    }
  }

  /**
   * Verificar email de usuario
   * POST /api/auth/verify-email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res
          .status(400)
          .json(formatResponse(false, "Token de verificación requerido"));
      }

      const result = await authService.verifyEmail(token);

      res.json(formatResponse(true, "Email verificado exitosamente", result));
    } catch (error) {
      logger.error("Error verificando email:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json(formatResponse(false, "Email requerido"));
      }

      const result = await authService.requestPasswordReset(email);

      res.json(formatResponse(true, "Email de recuperación enviado", result));
    } catch (error) {
      logger.error("Error en forgot password:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Resetear contraseña
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json(formatResponse(false, "Token y nueva contraseña requeridos"));
      }

      await authService.resetPassword(token, newPassword);

      res.json(formatResponse(true, "Contraseña restablecida exitosamente"));
    } catch (error) {
      logger.error("Error reseteando contraseña:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Verificar estado del token actual
   * GET /api/auth/me
   */
  async verifyToken(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);

      res.json(formatResponse(true, "Token válido", { user }));
    } catch (error) {
      logger.error("Error verificando token:", error);
      res
        .status(error.statusCode || 401)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const result = await authService.getProfile(userId);

      res.json(formatResponse(true, result.message, result));
    } catch (error) {
      logger.error("Error obteniendo perfil:", error);
      res
        .status(error.statusCode || 404)
        .json(formatResponse(false, error.message));
    }
  }

  /**
   * Actualizar perfil del usuario
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const result = await authService.updateProfile(userId, updateData);

      logger.info("Perfil actualizado", {
        userId,
        fields: Object.keys(updateData),
        ipAddress: req.ip,
      });

      res.json(formatResponse(true, result.message, result));
    } catch (error) {
      logger.error("Error actualizando perfil:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }

  async verifyServiceStatus(req, res) {
    try {
      const response = await fetch("https://check.soyteo.co/ok");

      // Si el status no es 200, lanzamos un error
      if (response.status !== 200) {
        return res.status(500).json({
          ok: false,
          status: response.status,
          message: "Backend no disponible",
        });
      }

      // Si todo está OK
      return res.status(200).json({ ok: true });
    } catch (err) {
      // Error de red o cualquier otra excepción
      return res.status(500).json({ ok: false, message: err.message });
    }
  }

  /**
   * Cambiar contraseña del usuario
   * PUT /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      logger.info("Contraseña cambiada exitosamente", {
        userId,
        ipAddress: req.ip,
      });

      res.json(formatResponse(true, result.message));
    } catch (error) {
      logger.error("Error cambiando contraseña:", error);
      res
        .status(error.statusCode || 400)
        .json(formatResponse(false, error.message));
    }
  }
}

module.exports = new AuthController();
