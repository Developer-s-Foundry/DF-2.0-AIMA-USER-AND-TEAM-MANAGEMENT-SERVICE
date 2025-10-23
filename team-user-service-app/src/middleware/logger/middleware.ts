import { Request, Response, NextFunction } from "express";
import { createLogger, getRequestId } from "../../utils/logger.utils";

/*
 * Extended request interface for typed logger attachment
 */
interface RequestWithLogger extends Request {
  logger: ReturnType<typeof createLogger>;
  startTime: number;
}

/*
 * Middleware: Attaches contextual logger to each request,
 *and logs request + response lifecycle with metadata.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const requestId =
      getRequestId(req) ||
      `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userId = (req as any).user?.id || "anonymous";
    const startTime = Date.now();

    const logger = createLogger(requestId, userId);
    (req as RequestWithLogger).logger = logger;
    (req as RequestWithLogger).startTime = startTime;

    // Capture request metadata
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.get("user-agent") || "unknown",
      requestId,
      userId,
    };

    logger.info(`Incoming request`, meta);

    // Listen for response completion
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const responseMeta = {
        ...meta,
        statusCode: res.statusCode,
        durationMs: duration,
      };

      const level =
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
          ? "warn"
          : "info";

      logger[level](` Response sent`, responseMeta);
    });

    // Handle aborted requests (e.g., client disconnect)
    res.on("close", () => {
      if (!res.writableEnded) {
        const duration = Date.now() - startTime;
        logger.warn(` Request aborted by client`, {
          ...meta,
          durationMs: duration,
        });
      }
    });

    // Handle unexpected response stream errors
    res.on("error", (err) => {
      const duration = Date.now() - startTime;
      logger.error(` Response stream error`, {
        ...meta,
        durationMs: duration,
        error: err.message,
      });
    });

    next();
  } catch (error: any) {
    console.error("requestLogger middleware failed:", error);
    next(); // allow request to continue even if logger setup fails
  }
}
