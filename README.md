🚀 Gestión Comercial – Microservicio de Usuarios (Techderos Backend)

Backend robusto y escalable para gestión comercial, autenticación y administración de usuarios.
Este microservicio hace parte del ecosistema Techderos, integrando usuarios, roles, inventario, ventas y lógica core, preparado para desarrollo local y producción.

📋 Tabla de Contenidos

Descripción General

Características Principales

Tecnologías Usadas

Estructura del Proyecto

API Endpoints

Inicio Rápido

Configuración

Usuarios de Prueba

Testing

Despliegue

Seguridad

Contribución

📌 Descripción General

Microservicio backend desarrollado con Node.js y Express, encargado de:

Autenticación y autorización con JWT

Gestión de usuarios, roles y permisos

Inventario, ventas, proveedores y pedidos

Auditoría, logging y seguridad avanzada

Soporta MySQL y PostgreSQL, con arquitectura desacoplada por capas y preparado para integrarse con frontend y otros microservicios.

✨ Características Principales
🔐 Autenticación y Autorización

JWT (Access + Refresh Tokens)

Roles y permisos granulares

Recuperación y cambio de contraseña

Perfil de usuario

Protección contra fuerza bruta

🛡️ Seguridad

Bcrypt para hash de contraseñas

Rate Limiting

Helmet y CORS

Validación de datos con Joi

Sanitización de inputs

📦 Gestión Comercial

Usuarios (admin / supervisor)

Inventario

Ventas

Proveedores

Pedidos

Códigos QR

Objetos personalizados

📊 Auditoría y Monitoreo

Logs estructurados con Winston + Morgan

Health checks

Trazabilidad de acciones

🐳 Infraestructura

Docker y Docker Compose

Redis (cache y sesiones)

Nginx (opcional)

PM2 para producción

🛠️ Tecnologías Usadas
Backend

Node.js 18+

Express.js

MySQL / PostgreSQL

Redis

JWT

Bcrypt

Herramientas

Nodemon

ESLint + Prettier

Jest

Husky

Seguridad & Logging

Helmet

CORS

Rate Limit

Winston

Morgan

📁 Estructura del Proyecto
src/
├── app.js
├── config/
│   ├── database.js
│   ├── jwt.js
│   └── environment.js
├── controllers/
├── routes/
├── services/
├── middleware/
├── models/
├── utils/
├── tests/
├── docs/
└── logs/

📡 API Endpoints
🔐 Autenticación
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

👥 Usuarios (Admin / Supervisor)
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
PATCH  /api/users/:id/activate
PATCH  /api/users/:id/deactivate

📦 Inventario
GET    /api/inventory/list
POST   /api/inventory/create
GET    /api/inventory/get/:id
PATCH  /api/inventory/update/:id
DELETE /api/inventory/delete/:id

💰 Ventas
GET    /api/sales/list
POST   /api/sales/create
GET    /api/sales/get/:id
GET    /api/sales/get-by-dni/:id
PATCH  /api/sales/update/:id
DELETE /api/sales/delete/:id

🚚 Proveedores
GET    /api/providers/list
POST   /api/providers/create
GET    /api/providers/get/:id
PATCH  /api/providers/update/:id
DELETE /api/providers/delete/:id

🛒 Pedidos
GET    /api/orders/list
POST   /api/orders/create
GET    /api/orders/get/:id
PATCH  /api/orders/update/:id
DELETE /api/orders/delete/:id

📱 QR y Objetos
POST   /api/qr/create
GET    /api/qr/list
DELETE /api/qr/delete/:id

POST   /api/objects/create
GET    /api/objects/get/:id
DELETE /api/objects/delete/:id

🚀 Inicio Rápido
1️⃣ Instalación
npm install

2️⃣ Variables de Entorno
NODE_ENV=development
PORT=3002

DB_HOST=localhost
DB_PORT=3306
DB_NAME=usuarios_service
DB_USER=usuario
DB_PASSWORD=password

JWT_SECRET=super_secret_key
JWT_REFRESH_SECRET=refresh_secret_key

CORS_ALLOWED_ORIGINS=http://localhost:3000

3️⃣ Ejecutar
npm run dev


Servidor disponible en:
👉 http://localhost:3002

👥 Usuarios de Prueba
Rol	Email	Contraseña
Tienda	prueba@techderos.com
	Password123!
Admin	admin@gestioncomercial.com
	Admin123!
Vendedor	vendedor@gestioncomercial.com
	Test123!
🧪 Testing
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

🚀 Despliegue
Desarrollo
docker-compose --profile development up -d

Producción
docker-compose up -d

🔒 Seguridad

Cambiar secrets en producción

Usar HTTPS

Configurar CORS correctamente

Revisar logs periódicamente

🤝 Contribución

Fork del proyecto

Crear rama feature

Commit con descripción clara

Pull Request

📝 Licencia

Licencia MIT

Desarrollado con ❤️ para sistemas de gestión comercial – Techderos
