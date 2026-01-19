
# 🚀 Gestión Comercial – Microservicio de Usuarios (Techderos Backend)

Backend robusto y escalable para sistemas de **gestión comercial**, desarrollado con **Node.js y Express**.
Este microservicio forma parte del ecosistema **Techderos** y centraliza la autenticación, gestión de usuarios, roles y la lógica principal del negocio, facilitando la integración con frontend y otros servicios.

---

## 📌 Descripción General

El microservicio se encarga de manejar:

* Autenticación y autorización de usuarios
* Roles y permisos granulares
* Gestión de inventario, ventas, proveedores y pedidos
* Seguridad, auditoría y monitoreo

Está diseñado bajo una **arquitectura por capas**, soporta **MySQL y PostgreSQL**, y puede ejecutarse tanto en entornos locales como productivos mediante Docker.

---

## ✨ Características Principales

### Autenticación y Autorización

Implementa JWT con access y refresh tokens, control de sesión, recuperación de contraseña, gestión de perfil y protección contra ataques de fuerza bruta.

### Seguridad

Incluye hash de contraseñas con Bcrypt, rate limiting, headers de seguridad con Helmet, configuración segura de CORS y validación de datos mediante Joi.

### Gestión Comercial

Permite administrar usuarios, inventario, ventas, proveedores, pedidos, generación de códigos QR y manejo de objetos personalizados del sistema.

### Auditoría y Monitoreo

Cuenta con logging estructurado, trazabilidad de acciones, health checks y endpoints de estado para monitoreo del servicio.

### Infraestructura

Preparado para Docker y Docker Compose, con soporte para Redis, Nginx y PM2 en producción.

---

## 🛠️ Tecnologías Utilizadas

El backend está construido sobre Node.js 18+ con Express.
La base de datos puede ser MySQL o PostgreSQL, usando conexiones optimizadas por pool.
Se utiliza Redis para cache y sesiones, JWT para autenticación, Winston y Morgan para logging, y herramientas modernas como ESLint, Prettier y Jest para desarrollo y testing.

---
## 🚀 Inicio Rápido (Tutorial de Instalación)

Sigue estos pasos para levantar el entorno de desarrollo localmente.

### Prerrequisitos
- Node.js (v18+)
- MySQL (corriendo localmente o en Docker)

### Paso 1: Clonar e Instalar
Asegúrate de estar en la rama correcta (`prueba`):

```bash
# Instalar dependencias
npm install
```

### Paso 2: Configurar Variables de Entorno
Crea un archivo `.env` en la raíz (puedes copiar `.env.template`).
**Importante:** Para desarrollo local (sin Docker para la app), ajusta `DB_HOST` a `localhost`.

Archivo `.env` recomendado para local:
```ini
NODE_ENV=development
PORT_SERVER=3002
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=tusuario
DB_PASSWORD=tupassword
DB_NAME=usuarios_service
DB_PORT=3306 
# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=tu_secreto_super_seguro
```

### Paso 3: Ejecutar el Proyecto
Para desarrollo con recarga automática:

```bash
npm run dev
```
El servidor iniciará en `http://localhost:3002`.

---

## Usuarios de Prueba

Se ha creado un usuario predeterminado en esta rama para facilitar tus pruebas inmediatas:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Tienda** | `prueba@techderos.com` | `Password123!` |

> Puedes usar estas credenciales para hacer login (`POST /api/auth/login`) y obtener un token JWT.

---
## 📁 Estructura del Proyecto

```
src/
├── app.js
├── config/          # Configuración de entorno, BD y JWT
├── controllers/     # Controladores REST
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── middleware/      # Autenticación, validaciones y seguridad
├── models/          # Modelos de datos
├── utils/           # Utilidades y helpers
├── tests/           # Tests automatizados
├── docs/            # Documentación
└── logs/            # Archivos de log
```

---

## Características y Endpoints

A continuación se detallan los módulos principales y sus rutas más importantes.

### 🔐 Autenticación
Base URL: `http://localhost:3002/api/auth`
- `POST http://localhost:3002/api/auth/register`: Registro de nuevos usuarios.
- `POST http://localhost:3002/api/auth/login`: Inicia sesión y devuelve tokens (Access & Refresh).
- `POST http://localhost:3002/api/auth/logout`: Cierra la sesión activa.
- `POST http://localhost:3002/api/auth/refresh`: Renueva el token de acceso vencido.
- `GET http://localhost:3002/api/auth/me`: Obtiene información del usuario actual.
- `GET http://localhost:3002/api/auth/profile`: Ver perfil completo.
- `PUT http://localhost:3002/api/auth/profile`: Actualizar perfil completo.
- `POST http://localhost:3002/api/auth/forgot-password`: Solicitar recuperación de contraseña.
- `POST http://localhost:3002/api/auth/reset-password`: Restablecer contraseña.

### 👥 Usuarios
Base URL: `http://localhost:3002/api/users` (Requiere rol Admin/Supervisor)
- `GET http://localhost:3002/api/users/`: Listar todos los usuarios.
- `POST http://localhost:3002/api/users/`: Crear un usuario (modo administrativo).
- `GET http://localhost:3002/api/users/:id`: Detalles de un usuario específico.
- `PUT http://localhost:3002/api/users/:id`: Actualizar datos de un usuario.
- `PATCH http://localhost:3002/api/users/:id/deactivate`: Desactivar usuario.
- `PATCH http://localhost:3002/api/users/:id/activate`: Activar usuario.

### 📦 Inventario
Base URL: `http://localhost:3002/api/inventory`
- `GET http://localhost:3002/api/inventory/list`: Listar inventario.
- `POST http://localhost:3002/api/inventory/create`: Agregar items.
- `GET http://localhost:3002/api/inventory/get/:id`: Ver detalle de item.
- `PATCH http://localhost:3002/api/inventory/update/:id`: Actualizar stock/datos.
- `DELETE http://localhost:3002/api/inventory/delete/:id`: Eliminar item.

### 💰 Ventas
Base URL: `http://localhost:3002/api/sales`
- `GET http://localhost:3002/api/sales/list`: Listar ventas realizadas.
- `POST http://localhost:3002/api/sales/create`: Registrar nueva venta.
- `GET http://localhost:3002/api/sales/get/:id`: Detalle de una venta.
- `GET http://localhost:3002/api/sales/get-by-dni/:id`: Buscar ventas por cliente.
- `PATCH http://localhost:3002/api/sales/update/:id`: Actualizar venta.
- `DELETE http://localhost:3002/api/sales/delete/:id`: Anular venta.

### 🚚 Proveedores
Base URL: `http://localhost:3002/api/providers`
- `GET http://localhost:3002/api/providers/list`: Listar proveedores.
- `POST http://localhost:3002/api/providers/create`: Crear proveedor.
- `GET http://localhost:3002/api/providers/get/:id`: Ver detalle de proveedor.
- `PATCH http://localhost:3002/api/providers/update/:id`: Actualizar proveedor.
- `DELETE http://localhost:3002/api/providers/delete/:id`: Eliminar proveedor.

### 🛒 Pedidos
Base URL: `http://localhost:3002/api/orders`
- `GET http://localhost:3002/api/orders/list`: Listar pedidos.
- `POST http://localhost:3002/api/orders/create`: Crear pedido.
- `GET http://localhost:3002/api/orders/get/:id`: Ver detalle de pedido.
- `PATCH http://localhost:3002/api/orders/update/:id`: Actualizar pedido.
- `DELETE http://localhost:3002/api/orders/delete/:id`: Cancelar pedido.

### 📱 Códigos QR
Base URL: `http://localhost:3002/api/qr`
- `GET http://localhost:3002/api/qr/list`: Listar códigos QR generados.
- `POST http://localhost:3002/api/qr/create`: Generar nuevo QR.
- `GET http://localhost:3002/api/qr/get/:id`: Ver detalle de QR.
- `DELETE http://localhost:3002/api/qr/delete/:id`: Eliminar QR.

### 🧊 Objetos
Base URL: `http://localhost:3002/api/objects`
- `POST http://localhost:3002/api/objects/create`: Crear objeto.
- `GET http://localhost:3002/api/objects/get/:id`: Ver objeto.
- `DELETE http://localhost:3002/api/objects/delete/:id`: Eliminar objeto.


## 🚀 Inicio Rápido

### Requisitos Previos

* Node.js 18 o superior
* MySQL o PostgreSQL
* Docker (opcional, recomendado)

### Instalación

```bash
npm install
```

### Configuración de Entorno

Crea un archivo `.env` en la raíz del proyecto y define las variables principales:

```env
NODE_ENV=development
PORT=3002

DB_HOST=localhost
DB_PORT=3306
DB_NAME=usuarios_service
DB_USER=usuario
DB_PASSWORD=password

JWT_SECRET=tu_secret_seguro
JWT_REFRESH_SECRET=tu_refresh_secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Ejecución en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3002`.

---

## 👥 Usuarios de Prueba

Para facilitar el desarrollo, el sistema incluye usuarios iniciales para pruebas de autenticación y roles.
Las credenciales pueden modificarse o eliminarse según el entorno.

---

## 🧪 Testing

El proyecto cuenta con pruebas unitarias e integrales:

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

---

## 🚀 Despliegue

### Desarrollo con Docker

```bash
docker-compose --profile development up -d
```

### Producción

Configura las variables de entorno de producción y ejecuta:

```bash
docker-compose up -d
```

---

## 🔒 Seguridad

Antes de pasar a producción se recomienda:

* Cambiar todos los secretos por defecto
* Configurar correctamente CORS
* Habilitar HTTPS
* Revisar periódicamente los logs y métricas

---

## 🤝 Contribución

1. Realiza un fork del proyecto
2. Crea una rama para tu funcionalidad
3. Realiza commits claros y descriptivos
4. Envía un Pull Request


📝 Licencia

Este proyecto se distribuye bajo la licencia MIT.



**Desarrollado con ❤️ para sistemas de gestión comercial – Techderos**


JHONATA DAVID SANCHEZ BALDOVINO/ jhonatan.sancheznick@gmil.com
