const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

require("dotenv").config();

const logger = require("./utils/logger");
const { connectDatabase } = require("./config/database");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");
const salesRoutes = require("./routes/sales");
const providersRoutes = require("./routes/providers");
const objectsRoutes = require("./routes/objects");
const qrRoutes = require("./routes/qrRoutes");
const ordersRoutes = require("./routes/orders");

const app = express();
// Trigger restart for env update

app.use(helmet());
// Allowed origins desde env (coma-separados). Incluye localhost para pruebas.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || 'https://techderos.com.co,http://localhost:4173,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://192.168.2.82:3001').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // permitir requests sin origin (curl, mobile, servidor)
      if (!origin) return callback(null, true);
      return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('CORS not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  })
);
// Responder correctamente a preflight OPTIONS
app.options('*', cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Registrar rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/providers", providersRoutes);
app.use("/api/objects", objectsRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/orders", ordersRoutes);

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

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint no encontrado",
    path: req.originalUrl,
  });
});

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

async function startServer() {
  try {
    await connectDatabase();
    logger.info("Conexión a base de datos establecida");
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

process.on("SIGTERM", () => {
  logger.info("Recibida señal SIGTERM, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Recibida señal SIGINT, cerrando servidor...");
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
