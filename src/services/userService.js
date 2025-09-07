/**
 * Servicio de Usuarios
 * Funciones principales:
 * - createUser: Lógica compleja de creación de usuarios
 * - updateUserProfile: Actualización con validaciones de negocio
 * - changePassword: Cambio seguro de contraseñas
 * - getUsersWithFilters: Búsqueda y filtrado avanzado
 * - deactivateUser: Desactivación con cleanup de datos
 */

const User = require("../models/User");
const db = require("../config/database");
const Role = require("../models/Role");
const authService = require("./authService");
const emailService = require("./emailService");
const logger = require("../utils/logger");

class UserService {
  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      return user.toJSON();
    } catch (error) {
      logger.error("Error obteniendo usuario por ID:", error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email) {
    try {
      const user = await User.findByEmail(email);
      return user ? user.toJSON() : null;
    } catch (error) {
      logger.error("Error obteniendo usuario por email:", error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData) {
    try {
      // Verificar si el email ya existe
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        const error = new Error("Ya existe un usuario con este email");
        error.statusCode = 400;
        throw error;
      }

      // Crear el usuario

      console.log("USER ROL ID -->");
      console.log(userData.rol);

      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        rol: userData.rol || "usuario",
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        emailVerified:
          userData.emailVerified !== undefined ? userData.emailVerified : false,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Hash de la contraseña
      await user.hashPassword(userData.password);

      // Guardar en la base de datos
      await user.save();

      logger.info("Usuario creado exitosamente", {
        userId: user.id,
        email: userData.email,
        rol: userData.rol,
      });

      return user.toJSON();
    } catch (error) {
      logger.error("Error creando usuario:", error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      // Validaciones de negocio
      await this.validateUserUpdate(user, updateData);

      // Aplicar actualizaciones
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] !== undefined &&
          key !== "id" &&
          key !== "password"
        ) {
          user[key] = updateData[key];
        }
      });

      user.updated_at = new Date();

      if (updateData.password) {
        await user.hashPassword(updateData.password);
      }

      await user.save();

      logger.info("Usuario actualizado", {
        userId,
        updateData: Object.keys(updateData),
      });

      return user.toJSON();
    } catch (error) {
      logger.error("Error actualizando usuario:", error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        const error = new Error("Contraseña actual incorrecta");
        error.statusCode = 400;
        throw error;
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        const error = new Error(
          "La nueva contraseña debe ser diferente a la actual"
        );
        error.statusCode = 400;
        throw error;
      }

      // Actualizar contraseña
      await user.hashPassword(newPassword);
      user.updated_at = new Date();
      await user.save();

      // Revocar todos los tokens por seguridad
      await user.revokeAllRefreshTokens();

      // Enviar notificación de seguridad
      try {
        await emailService.sendSecurityAlert(
          user.email,
          "Contraseña cambiada desde el perfil"
        );
      } catch (emailError) {
        logger.warn("Error enviando alerta de seguridad:", emailError);
      }

      logger.info("Contraseña cambiada exitosamente", { userId });
    } catch (error) {
      logger.error("Error cambiando contraseña:", error);
      throw error;
    }
  }

  /**
   * Obtener usuarios con filtros y paginación
   */
  async getUsers(filters = {}) {
    try {
      const result = await User.getUsers(filters);

      logger.info("Usuarios obtenidos con filtros", {
        filters,
        total: result.pagination.total,
      });

      return result;
    } catch (error) {
      logger.error("Error obteniendo usuarios:", error);
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      if (user.status === "inactive") {
        const error = new Error("El usuario ya está inactivo");
        error.statusCode = 400;
        throw error;
      }

      // Actualizar estado
      user.status = "inactive";
      user.updated_at = new Date();
      await user.save();

      // Revocar todos los tokens del usuario
      await user.revokeAllRefreshTokens();

      // Enviar notificación
      try {
        await emailService.sendAccountLockNotification(
          user.email,
          "Cuenta desactivada por administrador"
        );
      } catch (emailError) {
        logger.warn(
          "Error enviando notificación de desactivación:",
          emailError
        );
      }

      logger.info("Usuario desactivado", { userId });
    } catch (error) {
      logger.error("Error desactivando usuario:", error);
      throw error;
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      if (user.status === "active") {
        const error = new Error("El usuario ya está activo");
        error.statusCode = 400;
        throw error;
      }

      // Actualizar estado
      user.status = "active";
      user.updated_at = new Date();

      // Reset intentos fallidos si existían
      user.failed_login_attempts = 0;
      user.locked_until = null;

      await user.save();

      // Enviar notificación
      try {
        await emailService.sendSecurityAlert(
          user.email,
          "Cuenta reactivada por administrador"
        );
      } catch (emailError) {
        logger.warn("Error enviando notificación de activación:", emailError);
      }

      logger.info("Usuario activado", { userId });
    } catch (error) {
      logger.error("Error activando usuario:", error);
      throw error;
    }
  }
  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(userId) {
    try {
      // Verificar existencia
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
      }
      // Hard delete: eliminar registro de la base de datos
      const query = "DELETE FROM users WHERE id = ?";
      await db.query(query, [userId]);
      // Revocar todos los tokens del usuario
      await user.revokeAllRefreshTokens();
      logger.info("Usuario eliminado", { userId });
      return;
    } catch (error) {
      logger.error("Error eliminando usuario:", error);
      throw error;
    }
  }

  /**
      // Eliminar registro físicamente de la tabla
      // Revocar todos los tokens del usuario antes de borrar
      await user.revokeAllRefreshTokens();
      const deleteQuery = 'DELETE FROM "user" WHERE id = $1';
      const result = await db.query(deleteQuery, [userId]);
      if (result.rowCount === 0) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
      }
    try {
      const stats = await User.getStats();
      
      // Agregar estadísticas adicionales
      const additionalStats = {
        conversion_rate: stats.total_users > 0 
          ? ((stats.active_users / stats.total_users) * 100).toFixed(2) 
          : 0,
        activation_rate: stats.pending_users > 0
          ? ((stats.active_users / (stats.active_users + stats.pending_users)) * 100).toFixed(2)
          : 0
      };

      const finalStats = {
        ...stats,
        ...additionalStats,
        generated_at: new Date().toISOString()
      };

      logger.info('Estadísticas de usuarios generadas', { totalUsers: stats.total_users });
      
      return finalStats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios por término
   */
  async searchUsers(searchTerm, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: searchTerm,
      };

      const result = await User.getUsers(searchFilters);

      logger.info("Búsqueda de usuarios realizada", {
        searchTerm,
        results: result.pagination.total,
      });

      return result;
    } catch (error) {
      logger.error("Error buscando usuarios:", error);
      throw error;
    }
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(roleName, filters = {}) {
    try {
      const roleFilters = {
        ...filters,
        rol: roleName,
      };

      const result = await User.getUsers(roleFilters);

      logger.info("Usuarios obtenidos por rol", {
        rol: roleName,
        total: result.pagination.total,
      });

      return result;
    } catch (error) {
      logger.error("Error obteniendo usuarios por rol:", error);
      throw error;
    }
  }

  /**
   * Validar actualización de usuario
   */
  async validateUserUpdate(user, updateData) {
    // Validar cambio de email
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== user.id) {
        const error = new Error("El email ya está en uso por otro usuario");
        error.statusCode = 409;
        throw error;
      }

      // Si se cambia el email, marcar como no verificado
      updateData.email_verified = false;
      updateData.email_verification_token = require("crypto")
        .randomBytes(32)
        .toString("hex");
    }

    // Validar cambio de rol
    if (updateData.rol && updateData.rol !== user.rol) {
      const role = await Role.findByName(updateData.rol);
      if (!role) {
        const error = new Error("Rol especificado no válido");
        error.statusCode = 400;
        throw error;
      }
    }

    // Validar cambio de estado
    if (updateData.status) {
      const validStatuses = ["pending", "active", "inactive", "suspended"];
      if (!validStatuses.includes(updateData.status)) {
        const error = new Error("Estado especificado no válido");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  /**
   * Limpiar datos de usuarios inactivos antiguos
   */
  async cleanupInactiveUsers(daysInactive = 365) {
    try {
      const cutoffDate = new Date(
        Date.now() - daysInactive * 24 * 60 * 60 * 1000
      );

      const query = `
        UPDATE users 
        SET 
          email = CONCAT('deleted_', id, '@deleted.com'),
          nombre = 'Usuario Eliminado',
          telefono = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE 
          status = 'inactive' 
          AND updated_at < $1
          AND email NOT LIKE 'deleted_%'
        RETURNING id
      `;

      const db = require("../config/database");
      const result = await db.query(query, [cutoffDate]);

      logger.info(
        `Limpieza de usuarios inactivos: ${result.rowCount} usuarios anonimizados`
      );

      return result.rowCount;
    } catch (error) {
      logger.error("Error limpiando usuarios inactivos:", error);
      throw error;
    }
  }

  /**
   * Obtener actividad reciente de usuarios
   */
  async getRecentUserActivity(days = 30) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as new_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as activated_users
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `;

      const db = require("../config/database");
      const result = await db.query(query);

      return result.rows;
    } catch (error) {
      logger.error("Error obteniendo actividad reciente:", error);
      throw error;
    }
  }
}

module.exports = new UserService();
