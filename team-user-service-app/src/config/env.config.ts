import dotenv from "dotenv";
import { str, num, cleanEnv } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  // --- Server Config ---
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: num({ default: 3000 }),
  API_VERSION: str({ default: "v1" }),
  SERVICE_NAME: str({ default: "team-user-service" }),
  SERVICE_VERSION: str({ default: "1.0.0" }),

  // --- Internal Service Security ---
  INTERNAL_SERVICE_SECRETS: str(), // internal auth for service-to-service requests

  // --- Database Config ---
  MONGODB_URI: str(),
  MONGODB_DB_NAME: str({ default: "team-user-service" }),
  MONGODB_POOL_SIZE: num({ default: 10 }),
  MONGODB_CONNECTION_TIMEOUT: num({ default: 30000 }),

  // --- Logging ---
  LOG_LEVEL: str({ default: "info" }),
  LOG_FILE_PATH: str({ default: "./logs/team-user-service.log" }),

  // --- RabbitMQ ---
  RABBITMQ_URL: str({ default: "amqp://localhost:5672" }), // ✅ Add this
});

// --- Custom Validation ---
(() => {
  if (
    !env.MONGODB_URI.startsWith("mongodb://") &&
    !env.MONGODB_URI.startsWith("mongodb+srv://")
  ) {
    console.error(
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
    );
    process.exit(1);
  }

  console.info("Environment configuration validated successfully");
})();

// --- Derived Configs ---
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const mongoOptions = {
  dbName: env.MONGODB_DB_NAME,
  maxPoolSize: env.MONGODB_POOL_SIZE,
  serverSelectionTimeoutMS: env.MONGODB_CONNECTION_TIMEOUT,
  socketTimeoutMS: 45000,
  family: 4,
};
