# ==============================================
# SCRIPTS DE DESARROLLO
# ==============================================
# Comandos útiles para el desarrollo del microservicio
# Ejecutar desde el directorio raíz del proyecto

# ==============================================
# DESARROLLO LOCAL
# ==============================================

# Instalar dependencias
npm install

# Iniciar en modo desarrollo con nodemon
npm run dev

# Ejecutar tests
npm test

# Verificar linting
npm run lint

# Formatear código
npm run format

# ==============================================
# DOCKER COMPOSE - COMANDOS BÁSICOS
# ==============================================

# Crear directorios de datos
mkdir -p data/postgres data/redis

# Iniciar servicios (solo producción)
docker-compose up -d

# Iniciar servicios con desarrollo (incluye pgAdmin y Redis Commander)
docker-compose --profile development up -d

# Ver logs en tiempo real
docker-compose logs -f usuarios-service

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# ==============================================
# DOCKER - COMANDOS INDIVIDUALES
# ==============================================

# Construir imagen del microservicio
docker build -t usuarios-service:latest .

# Ejecutar container individualmente
docker run -p 3002:3002 --env-file .env usuarios-service:latest

# Inspeccionar container en ejecución
docker exec -it usuarios-service bash

# Ver logs del container
docker logs -f usuarios-service

# ==============================================
# BASE DE DATOS
# ==============================================

# Conectar a PostgreSQL (cuando está en Docker)
docker exec -it usuarios-postgres psql -U postgres -d usuarios_service

# Hacer backup de la base de datos
docker exec usuarios-postgres pg_dump -U postgres usuarios_service > backup.sql

# Restaurar backup
docker exec -i usuarios-postgres psql -U postgres usuarios_service < backup.sql

# ==============================================
# REDIS
# ==============================================

# Conectar a Redis CLI
docker exec -it usuarios-redis redis-cli

# Ver todas las claves
docker exec usuarios-redis redis-cli KEYS "*"

# ==============================================
# PRODUCCIÓN
# ==============================================

# Variables de entorno requeridas para producción
export NODE_ENV=production
export JWT_SECRET="tu_jwt_secret_super_seguro_aqui"
export JWT_REFRESH_SECRET="tu_refresh_secret_super_seguro_aqui"
export DB_PASSWORD="tu_password_de_bd_seguro"

# Iniciar en producción
docker-compose -f docker-compose.prod.yml up -d

# ==============================================
# DESARROLLO CON NODEMON (SIN DOCKER)
# ==============================================

# Instalar PostgreSQL localmente (Windows con Chocolatey)
choco install postgresql

# Instalar Redis localmente (Windows)
choco install redis-64

# Iniciar PostgreSQL (Windows)
net start postgresql-x64-14

# Iniciar Redis (Windows)
redis-server

# Crear base de datos local
createdb -U postgres usuarios_service

# ==============================================
# TESTING
# ==============================================

# Ejecutar tests unitarios
npm run test:unit

# Ejecutar tests de integración
npm run test:integration

# Tests con coverage
npm run test:coverage

# ==============================================
# MONITOREO Y DEBUGGING
# ==============================================

# Ver métricas de containers
docker stats

# Inspeccionar red
docker network inspect usuarios_usuarios-network

# Ver información del container
docker inspect usuarios-service

# ==============================================
# LIMPIEZA
# ==============================================

# Limpiar containers no utilizados
docker system prune -f

# Limpiar imágenes no utilizadas
docker image prune -f

# Limpiar volúmenes no utilizados
docker volume prune -f

# ==============================================
# SEGURIDAD
# ==============================================

# Escanear vulnerabilidades en la imagen
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/root/.cache/ aquasec/trivy image usuarios-service:latest

# Verificar secrets en el código
npm audit

# ==============================================
# MIGRACIÓN Y DESPLIEGUE
# ==============================================

# Ejecutar migraciones (cuando estén implementadas)
docker exec usuarios-service npm run migrate

# Ejecutar seeds de datos
docker exec usuarios-service npm run seed
