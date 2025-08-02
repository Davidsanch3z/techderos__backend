# Guía de Conexión Frontend-Backend

Esta guía te ayudará a conectar y ejecutar el sistema completo con frontend React y backend Node.js.

## 🚀 Inicio Rápido

### 1. Iniciar el Backend
```bash
# En la carpeta raíz del proyecto
npm run dev
```
El backend se ejecutará en: http://localhost:3002

### 2. Iniciar el Frontend
```bash
# En otra terminal, ir a la carpeta frontend
cd frontend
npm run dev
```
El frontend se ejecutará en: http://localhost:3000

### 3. Probar la Conexión
```powershell
# Ejecutar el script de prueba
.\test-connection.ps1
```

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env en raíz)
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usuarios_db
DB_USER=postgres
DB_PASSWORD=tu_password

# Servidor
PORT=3002
NODE_ENV=development

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend (.env en carpeta frontend)
```env
# API Backend
VITE_API_BASE_URL=http://localhost:3002/api

# Configuración adicional
VITE_PORT=3000
VITE_APP_NAME=TechDeros Frontend
```

## 🔐 Autenticación

### Credenciales de Prueba

#### Usuario Admin (Demo)
- **Email:** admin@example.com
- **Password:** admin123

#### Usuarios Reales
Los usuarios reales se autentican contra la base de datos PostgreSQL.

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refrescar token

### Usuarios
- `GET /api/users` - Listar usuarios (solo admin)
- `POST /api/users` - Crear usuario (solo admin)
- `GET /api/users/:id` - Obtener usuario específico
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (solo admin)

### Health Check
- `GET /health` - Estado del servidor

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** - Framework principal
- **Vite** - Build tool y servidor de desarrollo
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **CORS** - Configuración de CORS

## 🔄 Flujo de Autenticación

1. **Login:** El usuario envía credenciales al backend
2. **Validación:** El backend verifica contra la base de datos
3. **Token:** Se genera un JWT token
4. **Storage:** El token se guarda en localStorage del frontend
5. **Requests:** Todas las peticiones incluyen el token en el header Authorization
6. **Refresh:** El token se refresca automáticamente cuando es necesario

## 🛡️ Seguridad

### Frontend
- Rutas protegidas con autenticación
- Manejo automático de tokens expirados
- Validación de roles de usuario
- Interceptores de Axios para manejo de errores

### Backend
- Helmet.js para headers de seguridad
- Rate limiting para prevenir ataques
- Validación de entrada con Joi
- CORS configurado apropiadamente
- Passwords hasheados con bcrypt

## 🐛 Solución de Problemas

### Error de Conexión
1. Verificar que ambos servicios estén ejecutándose
2. Comprobar los puertos (3000 para frontend, 3002 para backend)
3. Revisar la configuración de CORS
4. Verificar las variables de entorno

### Error de Autenticación
1. Verificar credenciales de usuario
2. Comprobar que el token sea válido
3. Revisar la configuración JWT en el backend
4. Verificar que la base de datos esté funcionando

### Ejecutar Script de Diagnóstico
```powershell
.\test-connection.ps1
```

## 📝 Estructura de Archivos

```
USUARIOS/
├── src/                          # Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── config/
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── features/
│   │   │   └── auth/
│   │   │       ├── components/
│   │   │       ├── context/
│   │   │       ├── pages/
│   │   │       └── services/
│   │   └── services/
│   └── public/
└── sql/                         # Scripts de base de datos
```

## 🚀 Próximos Pasos

1. **Registro de Usuarios:** Implementar formulario de registro
2. **Recuperación de Contraseña:** Sistema de reset de password
3. **Perfiles de Usuario:** Gestión de perfiles completos
4. **Dashboard Avanzado:** Más funcionalidades en el dashboard
5. **Tests:** Implementar tests automatizados

## 📞 Soporte

Si tienes problemas:
1. Ejecuta el script de diagnóstico: `.\test-connection.ps1`
2. Revisa los logs del servidor backend
3. Inspecciona la consola del navegador para errores del frontend
4. Verifica que todos los servicios estén ejecutándose correctamente
