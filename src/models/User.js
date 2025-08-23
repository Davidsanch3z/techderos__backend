/**
 * Modelo de Usuario - Adaptado para tabla existente 'user'
 * Responsabilidades:
 * - Definir esquema de datos de usuario para tabla existente 'user'
 * - Métodos de instancia (hashPassword, comparePassword)
 * - Validaciones de datos a nivel de modelo
 * - Transformaciones de datos (toJSON sin password)
 * - Relaciones con tabla roles existente
 */

const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");
const logger = require("../utils/logger");

class User {
  constructor(userData) {
    // Mapear a la estructura de la tabla existente
    this.id = userData.id || uuidv4();
    this.email = userData.email;
    this.password = userData.password; // La tabla usa 'password' no 'password_hash'
    this.name = userData.name || userData.nombre; // Mapear 'nombre' a 'name'
    this.roleId = userData.roleId || this.mapRoleToId(userData.rol);
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
    this.empresaId = userData.empresaId || null;

    // Propiedades virtuales para compatibilidad con authService
    this.email_verified = userData.isActive || false; // Mapear isActive a email_verified
    this.status = userData.isActive ? "active" : "pending";
    this.rol = this.mapIdToRole(this.roleId);
    this.last_login = userData.last_login;
    this.failed_login_attempts = userData.failed_login_attempts || 0;
    this.locked_until = userData.locked_until;
  }

  /**
   * Mapear rol string a roleId
   */
  mapRoleToId(rol) {
    const roleMap = {
      administrador: "admin",
      tendero: "user",
      supervisor: "manager",
      admin: "admin",
      user: "user",
      usuario: "user",
      moderador: "manager",
      manager: "manager",
    };
    return roleMap[rol] || "user";
  }

  /**
   * Mapear roleId a rol string
   */
  mapIdToRole(roleId) {
    const idMap = {
      admin: "administrador",
      user: "usuario",
      manager: "moderador",
    };
    return idMap[roleId] || "usuario";
  }

  /**
   * Hash de contraseña usando bcrypt
   */
  async hashPassword(password) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(password, saltRounds);
  }

  /**
   * Comparar contraseña con hash almacenado
   */
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  /**
   * Convertir a JSON sin datos sensibles
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      rol: this.rol,
      roleId: this.roleId,
      isActive: this.isActive,
      email_verified: this.email_verified,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Guardar usuario en base de datos (tabla existente "user")
   */
  async save() {
    try {
      this.updatedAt = new Date();

      // Verificar si el usuario ya existe
      const existingUser = await User.findById(this.id);

      if (existingUser) {
        // Actualizar usuario existente
        const query = `
          UPDATE "users" 
          SET email = $1, password = $2, name = $3, "roleId" = $4, 
              "isActive" = $5, "updatedAt" = $6, "empresaId" = $7
          WHERE id = $8
          RETURNING *
        `;
        const values = [
          this.email,
          this.password,
          this.name,
          this.roleId,
          this.isActive,
          this.updatedAt,
          this.empresaId,
          this.id,
        ];

        const result = await db.query(query, values);

        if (result.rows.length > 0) {
          Object.assign(this, result.rows[0]);
          return this;
        }
      } else {
        // Crear nuevo usuario
        const query = `
          INSERT INTO "users" (id, email, password, name, "roleId", "isActive", "createdAt", "updatedAt", "empresaId")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        const values = [
          this.id,
          this.email,
          this.password,
          this.name,
          this.roleId,
          this.isActive,
          this.createdAt,
          this.updatedAt,
          this.empresaId,
        ];

        const result = await db.query(query, values);

        if (result.rows.length > 0) {
          Object.assign(this, result.rows[0]);
          return this;
        }
      }

      throw new Error("No se pudo guardar el usuario");
    } catch (error) {
      logger.error("Error guardando usuario:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    try {
      const query = "SELECT * FROM users WHERE email = $1;";
      const result = await db.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      logger.error("Error buscando usuario por email:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM "users" WHERE id = $1;';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      logger.error("Error buscando usuario por ID:", error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  static async getUsers(filters = {}) {
    try {
      const { page = 1, limit = 10, rol, status, search } = filters;

      let query = 'SELECT * FROM "users";';
      const params = [];
      let paramCount = 0;

      // Filtro por búsqueda (nombre o email)
      if (search) {
        paramCount++;
        query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Filtro por rol
      if (rol) {
        paramCount++;
        query += ` AND "roleId" = $${paramCount}`;
        params.push(rol);
      }

      // Filtro por estado
      if (status) {
        paramCount++;
        const isActive = status === "active";
        query += ` AND "isActive" = $${paramCount}`;
        params.push(isActive);
      }

      // Contar total de registros
      const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
      const countResult = await db.query(countQuery, params);
      const totalUsers = parseInt(countResult.rows[0].count);

      // Agregar paginación
      const offset = (page - 1) * limit;
      query += ` ORDER BY "createdAt" DESC LIMIT $${paramCount + 1} OFFSET $${
        paramCount + 2
      }`;
      params.push(limit, offset);

      // Ejecutar consulta principal
      const result = await db.query(query, params);

      // Convertir resultados a instancias de User
      const users = result.rows.map((row) => new User(row).toJSON());

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit,
        },
      };
    } catch (error) {
      logger.error("Error obteniendo usuarios:", error);
      throw error;
    }
  }

  /**
   * Métodos simplificados para compatibilidad con AuthService
   * La tabla actual no soporta tokens de verificación, así que usamos métodos dummy
   */

  /**
   * Buscar usuario por token de verificación de email (método dummy)
   */
  static async findByEmailVerificationToken(token) {
    // La tabla actual no tiene este campo, retornamos null
    logger.warn(
      "findByEmailVerificationToken llamado pero no soportado por la tabla actual"
    );
    return null;
  }

  /**
   * Buscar usuario por token de reset de contraseña (método dummy)
   */
  static async findByPasswordResetToken(token) {
    // La tabla actual no tiene este campo, retornamos null
    logger.warn(
      "findByPasswordResetToken llamado pero no soportado por la tabla actual"
    );
    return null;
  }

  /**
   * Actualizar último login (método simplificado)
   */
  async updateLastLogin() {
    this.last_login = new Date();
    // No guardamos en DB ya que la tabla no tiene este campo
    logger.info(`Last login actualizado para usuario ${this.id}`);
  }

  /**
   * Verificar email (activar usuario)
   */
  async verifyEmail() {
    this.isActive = true;
    this.email_verified = true;
    await this.save();
    logger.info(`Email verificado para usuario ${this.id}`);
  }

  /**
   * Establecer token de verificación de email (método dummy)
   */
  async setEmailVerificationToken(token) {
    // La tabla actual no soporta este campo
    logger.warn(
      "setEmailVerificationToken llamado pero no soportado por la tabla actual"
    );
  }

  /**
   * Establecer token de reset de contraseña (método dummy)
   */
  async setPasswordResetToken(token, expires) {
    // La tabla actual no soporta estos campos
    logger.warn(
      "setPasswordResetToken llamado pero no soportado por la tabla actual"
    );
  }

  /**
   * Limpiar token de reset de contraseña (método dummy)
   */
  async clearPasswordResetToken() {
    // La tabla actual no soporta estos campos
    logger.warn(
      "clearPasswordResetToken llamado pero no soportado por la tabla actual"
    );
  }

  /**
   * Guardar refresh token (simplificado)
   */
  async saveRefreshToken(refreshToken) {
    // En una implementación completa, esto se guardaría en una tabla separada
    // Por ahora, solo loggeamos que se guardó
    logger.info(`Refresh token guardado para usuario ${this.id}`);
  }

  /**
   * Validar refresh token
   */
  async validateRefreshToken(refreshToken) {
    // En una implementación completa, esto verificaría contra la base de datos
    // Por ahora, asumimos que es válido si existe
    return refreshToken && refreshToken.length > 10;
  }

  /**
   * Revocar refresh token
   */
  async revokeRefreshToken(refreshToken) {
    // En una implementación completa, esto eliminaría el token de la base de datos
    logger.info(`Refresh token revocado para usuario ${this.id}`);
  }

  /**
   * Revocar todos los refresh tokens del usuario
   */
  async revokeAllRefreshTokens() {
    // En una implementación completa, esto eliminaría todos los tokens del usuario
    logger.info(`Todos los refresh tokens revocados para usuario ${this.id}`);
  }

  /**
   * Verificar si la cuenta está bloqueada (método simplificado)
   */
  isAccountLocked() {
    return this.locked_until && this.locked_until > new Date();
  }

  /**
   * Incrementar intentos fallidos (método simplificado)
   */
  async incrementFailedAttempts() {
    this.failed_login_attempts = (this.failed_login_attempts || 0) + 1;

    // Bloquear cuenta después de 5 intentos fallidos
    if (this.failed_login_attempts >= 5) {
      this.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }

    // Nota: No guardamos en DB porque la tabla actual no tiene estos campos
    logger.warn(
      `Intentos fallidos: ${this.failed_login_attempts} para usuario ${this.id}`
    );
  }

  /**
   * Resetear intentos fallidos después de login exitoso
   */
  async resetFailedAttempts() {
    this.failed_login_attempts = 0;
    this.locked_until = null;
    this.last_login = new Date();

    // Nota: No guardamos en DB porque la tabla actual no tiene estos campos
    logger.info(`Intentos fallidos reseteados para usuario ${this.id}`);
  }
}

module.exports = User;
