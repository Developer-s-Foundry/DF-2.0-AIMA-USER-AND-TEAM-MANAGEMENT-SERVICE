import express, { Application, Request, Response, NextFunction } from "express";
import { env } from "./config/env.config";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger, loggerStream } from "./utils/logger.utils";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";

// --- Routes ---
import internalRoutes from "./routes/internal.routes";
import serviceRoutes from "./routes/service.routes";
import onCallScheduleRoutes from "./routes/onCallSchedule.routes";
import escalationPolicyRoutes from "./routes/escalationPolicy.routes";
import { requestLogger } from "./middleware/logger/middleware";

const app: Application = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("combined", { stream: loggerStream }));
app.use(requestLogger);

// --- Swagger Documentation ---
// Serve the Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true, // Enables the search box
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "AIMAS Service API Documentation",
  })
);

// A simple JSON endpoint for the raw spec
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// --- API Routes ---
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/onCallSchedule`, onCallScheduleRoutes);
app.use(`${API_PREFIX}/escalationPolicy`, escalationPolicyRoutes);

// --- Internal Routes ---
app.use("/internal", internalRoutes);

// --- Health check endpoint ---
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV,
  });
});

// --- 404 Handler ---
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
