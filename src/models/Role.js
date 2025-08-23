/**
 * Modelo Role adaptado para la tabla existente
 * Estructura de la tabla roles:
 * - id: text
 * - name: text
 * - description: text
 * - permissions: ARRAY
 * - createdAt: timestamp
 * - updatedAt: timestamp  
 * - deletedAt: timestamp
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class Role {
  constructor(roleData = {}) {
    this.id = roleData.id;
    this.name = roleData.name;
    this.description = roleData.description;
    this.permissions = roleData.permissions || [];
    this.createdAt = roleData.createdAt || roleData.createdat;
    this.updatedAt = roleData.updatedAt || roleData.updatedat;
    this.deletedAt = roleData.deletedAt || roleData.deletedat;
  }

  /**
   * Verificar si el rol tiene un permiso específico
   */
  hasPermission(permission) {
    return this.permissions.includes('ALL') || this.permissions.includes(permission);
  }

  /**
   * Obtener nivel de jerarquía del rol
   */
  getHierarchyLevel() {
    const hierarchies = {
      'admin': 100,
      'Manager': 80,
      'Usuario': 50
    };
    return hierarchies[this.name] || 0;
  }

  /**
   * Guardar rol (actualizar o crear)
   */
  async save() {
    try {
      const query = `
        INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          updatedAt = NOW()
        RETURNING *
      `;

      const values = [
        this.id,
        this.name,
        this.description,
        this.permissions
      ];

      const result = await db.query(query, values);
      
      if (result.rows.length > 0) {
        Object.assign(this, result.rows[0]);
        logger.info(`Rol guardado: ${this.name}`);
      }
      
      return this;
    } catch (error) {
      logger.error('Error guardando rol:', error);
      throw error;
    }
  }

  /**
   * Buscar rol por nombre
   */
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM roles WHERE name = $1 AND "deletedAt" IS NULL';
      const result = await db.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Role(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando rol por nombre:', error);
      throw error;
    }
  }

  /**
   * Buscar rol por ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM roles WHERE id = $1 AND "deletedAt" IS NULL';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Role(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando rol por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los roles
   */
  static async findAll() {
    try {
      const query = 'SELECT * FROM roles WHERE "deletedAt" IS NULL ORDER BY name';
      const result = await db.query(query);
      
      return result.rows.map(row => new Role(row));
    } catch (error) {
      logger.error('Error obteniendo todos los roles:', error);
      throw error;
    }
  }

  // /**
  //  * Los roles ya existen en la base de datos, así que no necesitamos crearlos
  //  * Solo validamos que existan los roles básicos
  //  */
  // static async initializeDefaultRoles() {
  //   try {
  //     logger.info('Verificando roles existentes...');
      
  //     const roles = await Role.findAll();
  //     logger.info(`Se encontraron ${roles.length} roles en la base de datos:`);
      
  //     roles.forEach(role => {
  //       logger.info(`- ${role.name} (${role.id}): ${role.description}`);
  //     });
      
  //     return true;
  //   } catch (error) {
  //     logger.error('Error verificando roles:', error);
  //     throw error;
  //   }
  // }
}

module.exports = Role;
