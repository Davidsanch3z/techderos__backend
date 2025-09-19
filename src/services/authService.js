const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const userService = require("./userService");
// const emailService = require('./emailService'); // Comentado temporalmente
const logger = require("../utils/logger");
const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} = require("../utils/helpers");

class AuthService {
  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    try {
      const { nombre, email, password, telefono, tipo_negocio, rol } = userData;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new ValidationError("El email ya está registrado");
      }

      // Crear nuevo usuario adaptado a la tabla existente
      const user = new User({
        name: nombre, // Mapear 'nombre' a 'name'
        email,
        isActive: true, // Activar directamente ya que no tenemos verificación de email
        empresaId: null,
      });

      user.roleId = user.mapRoleToId(userData.rol) || "user";

      await user.hashPassword(password);
      const savedUser = await user.save();
      logger.info(`Usuario registrado: ${email}`);
      return {
        success: true,
        message: "Usuario registrado exitosamente.",
        user: savedUser.toJSON(),
      };
    } catch (error) {
      logger.error("Error en registro:", error);
      throw error;
    }
  }

  /**
   * Autenticar usuario (login)
   */
  async login(email, password, ipAddress = null) {
    try {
      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AuthenticationError("Credenciales inválidas");
      }

      // Verificar si la cuenta está bloqueada (método simplificado)
      if (user.isAccountLocked()) {
        const minutesLeft = Math.ceil(
          (user.locked_until - new Date()) / (1000 * 60)
        );
        throw new AuthenticationError(
          `Cuenta bloqueada. Intenta nuevamente en ${minutesLeft} minutos.`
        );
      }

      // Verificar contraseña
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new AuthenticationError("Credenciales inválidas");
      }

      // Verificar si la cuenta está activa
      if (!user.isActive) {
        throw new AuthenticationError(
          "Tu cuenta no está activa. Contacta al administrador."
        );
      }

      // Login exitoso - resetear intentos fallidos
      await this.resetFailedAttempts(user);
      await user.updateLastLogin();

      // Generar tokens
      const tokens = await this.generateTokens(user);

      logger.info(`Login exitoso: ${email}`, { ipAddress });

      return {
        success: true,
        message: "Login exitoso",
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      logger.error("Error en login:", error);
      throw error;
    }
  }

  /**
   * Generar tokens JWT (access y refresh)
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      status: user.status,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || "7d",
      issuer: process.env.JWT_ISSUER || "usuarios-service",
      audience: process.env.JWT_AUDIENCE || "gestion-comercial",
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
        issuer: process.env.JWT_ISSUER || "usuarios-service",
      }
    );

    // Guardar refresh token en base de datos
    await user.saveRefreshToken(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiryTime(
        process.env.JWT_ACCESS_EXPIRY || "15m"
      ),
    };
  }

  /**
   * Renovar token de acceso usando refresh token
   */
  async refreshToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Buscar usuario
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AuthenticationError("Usuario no encontrado");
      }

      // Verificar que el refresh token existe en la base de datos
      const isValidRefreshToken = await user.validateRefreshToken(refreshToken);
      if (!isValidRefreshToken) {
        throw new AuthenticationError("Refresh token inválido");
      }

      // Verificar estado del usuario
      if (!user.isActive) {
        throw new AuthenticationError("Usuario no activo");
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(user);

      // Invalidar el refresh token anterior
      await user.revokeRefreshToken(refreshToken);

      return {
        success: true,
        tokens,
      };
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        throw new AuthenticationError("Refresh token inválido o expirado");
      }
      throw error;
    }
  }

  /**
   * Verificar token de acceso
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario para verificar que sigue activo
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError("Token inválido");
      }

      return {
        valid: true,
        user: decoded,
      };
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return {
          valid: false,
          error: "Token inválido o expirado",
        };
      }
      throw error;
    }
  }

  /**
   * Cerrar sesión (invalidar tokens)
   */
  async logout(userId, refreshToken = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      if (refreshToken) {
        await user.revokeRefreshToken(refreshToken);
      } else {
        // Revocar todos los refresh tokens del usuario
        await user.revokeAllRefreshTokens();
      }

      logger.info(`Logout exitoso: ${user.email}`);

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      };
    } catch (error) {
      logger.error("Error en logout:", error);
      throw error;
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Por seguridad, no revelamos si el email existe
        return {
          success: true,
          message:
            "Si el email existe, recibirás las instrucciones de recuperación",
        };
      }

      // Generar token de recuperación
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await user.setPasswordResetToken(resetToken, resetExpires);

      // Enviar email de recuperación
      // await emailService.sendPasswordResetEmail(user.email, resetToken); // Comentado temporalmente

      logger.info(`Solicitud de recuperación de contraseña: ${email}`);

      return {
        success: true,
        message:
          "Si el email existe, recibirás las instrucciones de recuperación",
      };
    } catch (error) {
      logger.error("Error en solicitud de recuperación:", error);
      throw error;
    }
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findByPasswordResetToken(token);
      if (!user || user.password_reset_expires < new Date()) {
        throw new ValidationError("Token de recuperación inválido o expirado");
      }

      // Cambiar contraseña
      await user.hashPassword(newPassword);
      await user.clearPasswordResetToken();
      await user.save();

      // Revocar todos los refresh tokens por seguridad
      await user.revokeAllRefreshTokens();

      logger.info(`Contraseña restablecida: ${user.email}`);

      return {
        success: true,
        message: "Contraseña restablecida exitosamente",
      };
    } catch (error) {
      logger.error("Error en reset de contraseña:", error);
      throw error;
    }
  }

  /**
   * Verificar email con token
   */
  async verifyEmail(token) {
    try {
      const user = await User.findByEmailVerificationToken(token);
      if (!user) {
        throw new ValidationError("Token de verificación inválido");
      }

      await user.verifyEmail();

      logger.info(`Email verificado: ${user.email}`);

      return {
        success: true,
        message: "Email verificado exitosamente",
        user: user.toJSON(),
      };
    } catch (error) {
      logger.error("Error en verificación de email:", error);
      throw error;
    }
  }

  /**
   * Reenviar email de verificación
   */
  async resendVerificationEmail(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      if (user.email_verified) {
        throw new ValidationError("El email ya está verificado");
      }

      // Generar nuevo token de verificación
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await user.setEmailVerificationToken(verificationToken);

      // Enviar email
      await this.sendVerificationEmail(user);

      return {
        success: true,
        message: "Email de verificación reenviado",
      };
    } catch (error) {
      logger.error("Error reenviando email de verificación:", error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      // Verificar contraseña actual
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new ValidationError("Contraseña actual incorrecta");
      }

      // Cambiar contraseña
      await user.hashPassword(newPassword);
      await user.save();

      // Revocar todos los refresh tokens por seguridad
      await user.revokeAllRefreshTokens();

      logger.info(`Contraseña cambiada: ${user.email}`);

      return {
        success: true,
        message: "Contraseña cambiada exitosamente",
      };
    } catch (error) {
      logger.error("Error cambiando contraseña:", error);
      throw error;
    }
  }

  // Métodos auxiliares

  /**
   * Manejar intento de login fallido
   */
  async handleFailedLogin(user) {
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutos

    user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

    if (user.failed_login_attempts >= maxAttempts) {
      user.locked_until = new Date(Date.now() + lockoutDuration);
      logger.warn(`Usuario bloqueado por intentos fallidos: ${user.email}`);
    }

    await user.save();
  }

  /**
   * Resetear intentos fallidos de login
   */
  async resetFailedAttempts(user) {
    if (user.failed_login_attempts > 0 || user.locked_until) {
      user.failed_login_attempts = 0;
      user.locked_until = null;
      await user.save();
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, updateData) {
    try {
      const { nombre, telefono, tipo_negocio } = updateData;

      // Buscar usuario
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      // Preparar datos de actualización
      const updateFields = {};
      if (nombre) updateFields.name = nombre;
      if (telefono) updateFields.telefono = telefono;
      if (tipo_negocio) updateFields.tipo_negocio = tipo_negocio;

      if (Object.keys(updateFields).length === 0) {
        throw new ValidationError(
          "No se proporcionaron campos para actualizar"
        );
      }

      // Actualizar usuario usando userService
      await userService.updateUser(userId, updateFields);

      // Obtener usuario actualizado
      const updatedUser = await userService.getUserById(userId);

      logger.info(`Perfil actualizado para usuario: ${updatedUser.email}`);

      // Crear objeto seguro manualmente
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        telefono: updatedUser.telefono,
        tipo_negocio: updatedUser.tipo_negocio,
        rol: updatedUser.rol,
        roleId: updatedUser.roleId,
        isActive: updatedUser.isActive,
        email_verified: updatedUser.email_verified,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return {
        success: true,
        message: "Perfil actualizado exitosamente",
        user: safeUser,
      };
    } catch (error) {
      logger.error("Error actualizando perfil:", error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Buscar usuario con password (necesario para verificación)
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError("Contraseña actual incorrecta");
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new ValidationError(
          "La nueva contraseña debe ser diferente a la actual"
        );
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña directamente en el modelo
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);

      return {
        success: true,
        message: "Contraseña cambiada exitosamente",
      };
    } catch (error) {
      logger.error("Error cambiando contraseña:", error);
      throw error;
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(userId) {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      // Crear objeto seguro manualmente
      const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        telefono: user.telefono,
        tipo_negocio: user.tipo_negocio,
        rol: user.rol,
        roleId: user.roleId,
        isActive: user.isActive,
        email_verified: user.email_verified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        message: "Perfil obtenido exitosamente",
        user: safeUser,
      };
    } catch (error) {
      logger.error("Error obteniendo perfil:", error);
      throw error;
    }
  }

  /**
   * Enviar email de verificación
   */
  async sendVerificationEmail(user) {
    try {
      // await emailService.sendVerificationEmail(user.email, user.email_verification_token); // Comentado temporalmente
      logger.info("Email de verificación enviado (simulado)");
    } catch (error) {
      logger.error("Error enviando email de verificación:", error);
      // No lanzamos error para no bloquear el registro
    }
  }

  /**
   * Calcular tiempo de expiración del token
   */
  getTokenExpiryTime(expiry) {
    const timeUnits = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // 15 minutos por defecto

    const [, amount, unit] = match;
    return parseInt(amount) * timeUnits[unit];
  }
}

module.exports = new AuthService();
