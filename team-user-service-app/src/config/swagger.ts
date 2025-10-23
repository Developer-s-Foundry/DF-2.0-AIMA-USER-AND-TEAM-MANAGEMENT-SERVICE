import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { env } from "./env.config"; // ✅ Use validated env variables

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AIMAS Team & User Management Service",
      version: env.SERVICE_VERSION, // ✅ dynamic version from env
      description:
        "API documentation for the AIMAS service responsible for managing users, teams, on-call schedules, escalation policies, and internal service mappings.",
      contact: {
        name: "AIMAS Dev Team",
        email: "support@aimas.io", // ✅ Use a service contact instead of personal
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`, // ✅ Use actual PORT from env
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        InternalSecret: {
          type: "apiKey",
          in: "header",
          name: "x-internal-secret",
          description:
            "Secret header for internal service-to-service authentication",
        },
        InternalSecretVersion: {
          type: "apiKey",
          in: "header",
          name: "x-internal-secret-version",
          description: "Version identifier for the internal secret key",
        },
      },
    },
    security: [
      {
        InternalSecret: [],
        InternalSecretVersion: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../controllers/*.ts"),
  ],
};

export const specs = swaggerJsdoc(options);
