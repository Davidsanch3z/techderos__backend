/**
 * Archivo principal de la aplicación
 * Responsabilidades:
 * - Configuración de Express y middlewares globales
 * - Registro de rutas principales
 * - Configuración de manejo de errores
 * - Inicio del servidor HTTP
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const logger = require("./utils/logger");
const { connectDatabase } = require("./config/database");

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");

// Crear aplicación Express
const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Middlewares de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Registrar rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);

// Ruta de documentación API
app.get("/api/docs", (req, res) => {
  res.json({
    message: "API Documentation",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      health: "/health",
      docs: "/api/docs",
    },
    swagger: "/swagger.yaml",
  });
});

// Middleware de manejo de errores 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint no encontrado",
    path: req.originalUrl,
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  logger.error("Error no controlado:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDatabase();
    logger.info("Conexión a base de datos establecida");

    // Iniciar servidor
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor de usuarios iniciado en puerto ${PORT}`);
      logger.info(
        `📚 Documentación disponible en http://localhost:${PORT}/api/docs`
      );
      logger.info(`🏥 Health check en http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  logger.info("Recibida señal SIGTERM, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Recibida señal SIGINT, cerrando servidor...");
  process.exit(0);
});

// Iniciar servidor si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
