/**
 * Controlador de Usuarios
 * Responsabilidades:
 * - Operaciones CRUD de usuarios
 * - Gestión de perfiles de usuario
 * - Actualización de datos personales
 * - Cambio de contraseñas
 * - Gestión de roles (solo admin)
 */

const userService = require('../services/userService');
const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');

class UserController {
  /**
   * Obtener perfil del usuario actual
   * GET /api/users/me
   */
  async getMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);
      
      res.json(formatResponse(true, 'Perfil obtenido exitosamente', { user }));
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      res.status(error.statusCode || 500).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Actualizar perfil del usuario actual
   * PUT /api/users/me
   */
  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await userService.updateUser(userId, updateData);
      
      logger.info('Perfil actualizado', { userId });
      
      res.json(formatResponse(true, 'Perfil actualizado exitosamente', { user }));
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   * PATCH /api/users/me/password
   */
  async changeMyPassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json(
          formatResponse(false, 'Contraseña actual y nueva contraseña requeridas')
        );
      }

      await userService.changePassword(userId, currentPassword, newPassword);
      
      logger.info('Contraseña cambiada', { userId });
      
      res.json(formatResponse(true, 'Contraseña cambiada exitosamente'));
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Crear nuevo usuario (solo admin)
   * POST /api/users
   */
  async createUser(req, res) {
    try {
      const { name, email, password, rol } = req.body;
      const adminId = req.user.id;
      
      // Verificar si el email ya existe
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json(
          formatResponse(false, 'Ya existe un usuario con este email')
        );
      }

      // Crear el usuario
      const userData = {
        name,
        email,
        password,
        rol: rol || 'usuario',
        isActive: true,
        emailVerified: true // Los usuarios creados por admin están verificados
      };

      const user = await userService.createUser(userData);
      
      logger.info('Usuario creado por admin', { 
        createdUserId: user.id, 
        adminId,
        userEmail: email 
      });
      
      // Remover la contraseña de la respuesta
      const { password: _, ...userResponse } = user;
      
      res.status(201).json(
        formatResponse(true, 'Usuario creado exitosamente', { user: userResponse })
      );
    } catch (error) {
      logger.error('Error creando usuario:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Obtener lista de usuarios (solo admin)
   * GET /api/users
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, rol, status, search } = req.query;
      
      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        rol,
        status,
        search
      };

      const result = await userService.getUsers(filters);
      
      res.json(formatResponse(true, 'Usuarios obtenidos exitosamente', result));
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      res.status(error.statusCode || 500).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Obtener usuario por ID (solo admin)
   * GET /api/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      res.json(formatResponse(true, 'Usuario obtenido exitosamente', { user }));
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      res.status(error.statusCode || 404).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Actualizar usuario por ID (solo admin)
   * PUT /api/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await userService.updateUser(id, updateData);
      
      logger.info('Usuario actualizado por admin', { 
        userId: id,
        adminId: req.user.id 
      });
      
      res.json(formatResponse(true, 'Usuario actualizado exitosamente', { user }));
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Desactivar usuario (solo admin)
   * PATCH /api/users/:id/deactivate
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      
      await userService.deactivateUser(id);
      
      logger.info('Usuario desactivado', { 
        userId: id,
        adminId: req.user.id 
      });
      
      res.json(formatResponse(true, 'Usuario desactivado exitosamente'));
    } catch (error) {
      logger.error('Error desactivando usuario:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Activar usuario (solo admin)
   * PATCH /api/users/:id/activate
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      
      await userService.activateUser(id);
      
      logger.info('Usuario activado', { 
        userId: id,
        adminId: req.user.id 
      });
      
      res.json(formatResponse(true, 'Usuario activado exitosamente'));
    } catch (error) {
      logger.error('Error activando usuario:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   * GET /api/users/stats
   */
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();
      
      res.json(formatResponse(true, 'Estadísticas obtenidas exitosamente', stats));
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(error.statusCode || 500).json(
        formatResponse(false, error.message)
      );
    }
  }
  /**
   * Eliminar usuario específico (solo admin)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      logger.info('Usuario eliminado por admin', { userId: id, adminId: req.user.id });
      res.json(formatResponse(true, 'Usuario eliminado exitosamente'));
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      res.status(error.statusCode || 400).json(
        formatResponse(false, error.message)
      );
    }
  }
}

module.exports = new UserController();
