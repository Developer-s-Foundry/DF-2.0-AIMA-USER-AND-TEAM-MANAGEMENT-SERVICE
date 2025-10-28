import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.config";
import { logger, loggerStream } from "./utils/logger.utils";
import { requestLogger } from "./middleware/logger/middleware";

// --- Routes ---
import internalRoutes from "./routes/internal.routes";
import serviceRoutes from "./routes/service.routes";
import onCallScheduleRoutes from "./routes/onCallSchedule.routes";
import escalationPolicyRoutes from "./routes/escalationPolicy.routes";

// --- Express App Initialization ---
const app: Application = express();

// --- Core Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("combined", { stream: loggerStream }));
app.use(requestLogger);

// --- Swagger Documentation (optional setup) ---
// If Swagger spec generation isn’t ready, comment out the next block
try {
  const { specs } = require("./config/swagger");
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "AIMA Service API Docs",
    })
  );

  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(specs);
  });
} catch (err) {
  logger.warn("Swagger not configured. Skipping Swagger setup.");
}

// --- API Routes ---
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/onCallSchedule`, onCallScheduleRoutes);
app.use(`${API_PREFIX}/escalationPolicy`, escalationPolicyRoutes);

// --- Internal Routes ---
app.use("/internal", internalRoutes);

// --- Health Check Endpoint ---
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV,
  });
});

// --- 404 Not Found Handler ---
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// --- Global Error Handler ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(" Unhandled error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
