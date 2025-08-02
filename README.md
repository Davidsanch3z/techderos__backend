# Gestión Comercial - Microservicio de Usuarios

## 🚀 Descripción

Microservicio completo para gestión de usuarios desarrollado con Node.js, Express y PostgreSQL. Implementa autenticación JWT, roles y permisos, auditoría completa y está completamente dockerizado para desarrollo y producción.

## 📋 Características

### 🔐 Autenticación y Autorización
- **JWT Tokens**: Access tokens de corta duración + Refresh tokens seguros
- **Roles y Permisos**: Sistema granular de permisos basado en roles
- **Protección Brute Force**: Bloqueo automático tras intentos fallidos
- **Verificación de Email**: Proceso completo de verificación
- **Reset de Contraseña**: Sistema seguro de recuperación

### 🛡️ Seguridad
- **Bcrypt**: Hash de contraseñas con salt rounds configurables
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración segura de dominios permitidos
- **Helmet**: Headers de seguridad automáticos
- **Validación**: Esquemas Joi para validación de entrada
- **Sanitización**: Limpieza automática de datos de entrada

### 📊 Auditoría y Monitoreo
- **Auditoría Completa**: Registro de todas las acciones del sistema
- **Logging Estructurado**: Winston con diferentes niveles y formatos
- **Métricas**: Health checks y endpoints de estado
- **Trazabilidad**: Tracking completo de cambios de usuarios

### 🐳 Infraestructura
- **Docker**: Contenerización completa con multi-stage builds
- **Docker Compose**: Orquestación de servicios (app, DB, cache)
- **PostgreSQL**: Base de datos relacional con migraciones
- **Redis**: Cache y gestión de sesiones
- **Health Checks**: Verificación automática de servicios

## 🛠️ Tecnologías

### Backend
- **Node.js** 18+ con **Express.js**
- **PostgreSQL** 15 con pool de conexiones
- **Redis** 7 para cache y sesiones
- **JWT** para autenticación stateless
- **Bcrypt** para hash de contraseñas

### Herramientas de Desarrollo
- **Nodemon** para desarrollo con hot reload
- **ESLint** con configuración estándar
- **Prettier** para formateo de código
- **Jest** para testing unitario e integración
- **Husky** para git hooks

### Infraestructura
- **Docker** y **Docker Compose**
- **Nginx** (configuración incluida)
- **PM2** para gestión de procesos en producción

## 📁 Estructura del Proyecto

```
usuarios-service/
├── src/                          # Código fuente
│   ├── controllers/              # Controladores REST
│   │   ├── authController.js     # Autenticación
│   │   └── userController.js     # Gestión de usuarios
│   ├── models/                   # Modelos de datos
│   │   ├── User.js              # Modelo de usuario
│   │   └── Role.js              # Modelo de roles
│   ├── routes/                   # Definición de rutas
│   │   ├── auth.js              # Rutas de autenticación
│   │   └── users.js             # Rutas de usuarios
│   ├── middleware/               # Middleware personalizado
│   │   ├── auth.js              # Verificación JWT
│   │   ├── validation.js        # Validación Joi
│   │   └── rateLimiter.js       # Rate limiting
│   ├── services/                 # Lógica de negocio
│   │   ├── authService.js       # Servicios de auth
│   │   ├── userService.js       # Servicios de usuario
│   │   └── emailService.js      # Servicios de email
│   ├── config/                   # Configuración
│   │   ├── database.js          # Pool PostgreSQL
│   │   ├── jwt.js               # Configuración JWT
│   │   └── environment.js       # Variables de entorno
│   ├── utils/                    # Utilidades
│   │   ├── logger.js            # Winston logger
│   │   ├── validators.js        # Validadores custom
│   │   └── helpers.js           # Funciones auxiliares
│   └── app.js                    # Aplicación principal
├── sql/                          # Scripts de base de datos
│   ├── init.sql                 # Estructura inicial
│   └── seed.sql                 # Datos de prueba
├── tests/                        # Tests automatizados
├── docs/                         # Documentación
├── logs/                         # Archivos de log
├── data/                         # Datos persistentes
│   ├── postgres/                # Datos PostgreSQL
│   └── redis/                   # Datos Redis
├── docker-compose.yml           # Orquestación de servicios
├── Dockerfile                   # Imagen del microservicio
├── package.json                 # Dependencias y scripts
├── .env.example                 # Variables de entorno ejemplo
└── README.md                    # Esta documentación
```

## 🚀 Inicio Rápido

### 1. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd usuarios-service

# Copiar configuración de entorno
cp .env.example .env

# Editar variables de entorno
# Cambiar JWT_SECRET, DB_PASSWORD, etc.
```

### 2. Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear directorios de datos
mkdir -p data/postgres data/redis

# Iniciar servicios con Docker Compose
docker-compose --profile development up -d

# Verificar que los servicios estén ejecutándose
docker-compose ps

# Iniciar aplicación en modo desarrollo
npm run dev
```

### 3. Acceso a Servicios

- **API**: http://localhost:3002
- **PgAdmin**: http://localhost:8080 (admin@localhost.com / admin123)
- **Redis Commander**: http://localhost:8081

## 🔧 Configuración

### Variables de Entorno Principales

```env
# Aplicación
NODE_ENV=development
PORT=3002
APP_NAME=Gestión Comercial

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usuarios_service
DB_USER=postgres
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_muy_largo
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

## 📡 API Endpoints

### Autenticación

```http
POST /api/auth/register          # Registro de usuario
POST /api/auth/login             # Inicio de sesión
POST /api/auth/refresh           # Renovar tokens
POST /api/auth/logout            # Cerrar sesión
POST /api/auth/verify-email      # Verificar email
POST /api/auth/forgot-password   # Solicitar reset
POST /api/auth/reset-password    # Resetear contraseña
```

### Usuarios

```http
GET    /api/users                # Listar usuarios (admin)
GET    /api/users/:id            # Obtener usuario específico
PUT    /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario (admin)
GET    /api/users/profile        # Perfil del usuario autenticado
PUT    /api/users/profile        # Actualizar perfil propio
```

### Sistema

```http
GET /api/health                  # Health check
GET /api/status                  # Estado detallado
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests unitarios solamente
npm run test:unit

# Tests de integración
npm run test:integration

# Coverage report
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🚀 Despliegue

### Desarrollo

```bash
# Iniciar servicios completos de desarrollo
docker-compose --profile development up -d

# Ver logs en tiempo real
docker-compose logs -f usuarios-service
```

### Producción

```bash
# Configurar variables de entorno de producción
export NODE_ENV=production
export JWT_SECRET="tu_secret_super_seguro_de_produccion"
export DB_PASSWORD="password_de_bd_super_seguro"

# Iniciar servicios de producción
docker-compose up -d

# Verificar estado
docker-compose ps
```

## 👥 Usuarios de Prueba

El sistema se inicializa con los siguientes usuarios:

| Email | Contraseña | Rol | Descripción |
|-------|------------|-----|-------------|
| admin@gestioncomercial.com | Admin123! | superadmin | Super administrador |
| administrador@gestioncomercial.com | Test123! | admin | Administrador |
| gerente@gestioncomercial.com | Test123! | gerente | Gerente comercial |
| vendedor@gestioncomercial.com | Test123! | vendedor | Vendedor |
| cliente@example.com | Test123! | cliente | Cliente final |

## 🔒 Seguridad

### Configuración de Producción

1. **Cambiar todos los secrets por defecto**
2. **Usar contraseñas fuertes para BD**
3. **Configurar CORS correctamente**
4. **Habilitar HTTPS**
5. **Revisar logs regularmente**

### Rate Limiting

- **Login**: 5 intentos por IP cada 15 minutos
- **API General**: 100 requests por IP cada 15 minutos
- **Registration**: 3 registros por IP cada hora

## 📊 Monitoreo

### Logs

```bash
# Ver logs de la aplicación
docker-compose logs -f usuarios-service

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Ver logs de Redis
docker-compose logs -f redis
```

### Health Checks

```bash
# Verificar estado de la API
curl http://localhost:3002/api/health

# Verificar estado detallado
curl http://localhost:3002/api/status
```

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Instalar nueva dependencia
npm install nueva-dependencia

# Ejecutar linting
npm run lint

# Formatear código
npm run format

# Conectar a PostgreSQL
docker exec -it usuarios-postgres psql -U postgres -d usuarios_service

# Conectar a Redis
docker exec -it usuarios-redis redis-cli
```

### Scripts de Base de Datos

```bash
# Hacer backup
docker exec usuarios-postgres pg_dump -U postgres usuarios_service > backup.sql

# Restaurar backup
docker exec -i usuarios-postgres psql -U postgres usuarios_service < backup.sql
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte y preguntas:

- **Issues**: Usar GitHub Issues para bugs y features
- **Documentación**: Ver carpeta `docs/` para documentación adicional
- **Email**: contacto@gestioncomercial.com

---

**Desarrollado con ❤️ para sistemas de gestión comercial**
