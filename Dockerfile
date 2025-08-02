# ==============================================
# DOCKERFILE - MICROSERVICIO DE USUARIOS
# ==============================================
# Imagen base Node.js Alpine (ligera)
# Instalación de dependencias en layer separado
# Usuario no-root para seguridad
# Health check integrado
# Variables de entorno para configuración

# Usar imagen oficial de Node.js Alpine (más ligera)
FROM node:18-alpine AS base

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# ==============================================
# STAGE: DEPENDENCIES
# ==============================================
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# ==============================================
# STAGE: BUILD (si hubiera proceso de build)
# ==============================================
FROM dependencies AS build

# Instalar dependencias de desarrollo para build
RUN npm ci --no-audit --no-fund

# Copiar código fuente
COPY src/ ./src/

# Aquí irían comandos de build si los hubiera
# RUN npm run build

# ==============================================
# STAGE: PRODUCTION
# ==============================================
FROM base AS production

# Copiar dependencias de producción
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY --from=build /app/src ./src
COPY package*.json ./

# Crear directorio para logs
RUN mkdir -p logs

# Cambiar ownership a usuario nodejs
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3002

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e " \
        const http = require('http'); \
        const options = { \
            hostname: 'localhost', \
            port: process.env.PORT || 3002, \
            path: '/health', \
            method: 'GET', \
            timeout: 5000 \
        }; \
        const req = http.request(options, (res) => { \
            if (res.statusCode === 200) { \
                process.exit(0); \
            } else { \
                process.exit(1); \
            } \
        }); \
        req.on('error', () => process.exit(1)); \
        req.on('timeout', () => { \
            req.destroy(); \
            process.exit(1); \
        }); \
        req.setTimeout(5000); \
        req.end(); \
    "

# Comando de inicio con dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]

# ==============================================
# LABELS PARA METADATA
# ==============================================
LABEL maintainer="Equipo de Desarrollo <dev@empresa.com>"
LABEL description="Microservicio de gestión de usuarios"
LABEL version="1.0.0"
LABEL component="usuarios-service"
