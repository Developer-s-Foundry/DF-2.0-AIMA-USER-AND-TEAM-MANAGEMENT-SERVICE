import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env, isDevelopment,isProduction } from '../config/env.config';

// --- Environment setup ---
const NODE_ENV = env.NODE_ENV;
const LOG_LEVEL = env.LOG_LEVEL;
const LOG_FILE_PATH = env.LOG_FILE_PATH;
const SERVICE_NAME = env.SERVICE_NAME;


// --- Formats ---
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, requestId, userId, ...meta } = info;
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: service || SERVICE_NAME,
      message,
      ...(requestId ? { requestId } : {}),
      ...(userId ? { userId } : {}),
      ...(Object.keys(meta).length > 0 && { meta })
    };
    return JSON.stringify(logEntry);
  })
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, ...meta } = info;
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    if (requestId) logMessage += ` [ReqID: ${requestId}]`;
    if (userId) logMessage += ` [UserID: ${userId}]`;
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
  })
);

// --- Transports ---
const transports: winston.transport[] = [];

// Console
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : logFormat,
    level: LOG_LEVEL
  })
);

// File (optional)
if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: LOG_FILE_PATH,
      format: logFormat,
      level: LOG_LEVEL,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: LOG_FILE_PATH.replace('.log', '.error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10485760,
      maxFiles: 3,
      tailable: true
    })
  );
}

// --- Base logger ---
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: SERVICE_NAME, environment: NODE_ENV },
  transports,
  exitOnError: false,
  silent: false
});

// --- Contextual Logger Class ---
export class Logger {
  constructor(private requestId?: string, private userId?: string) {}

  private log(level: string, message: string, meta?: object) {
    logger.log(level, message, {
      ...meta,
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.userId && { userId: this.userId })
    });
  }

  error(message: string, meta?: object) { this.log('error', message, meta); }
  warn(message: string, meta?: object) { this.log('warn', message, meta); }
  info(message: string, meta?: object) { this.log('info', message, meta); }
  debug(message: string, meta?: object) { this.log('debug', message, meta); }

  // --- Domain-Specific Logs ---

  // User management (CRUD, role changes)
  userEvent(action: string, userId: string, meta?: object) {
    this.log('info', `USER_EVENT: ${action}`, { userEvent: true, userId, ...meta });
  }

  // Team operations
  teamEvent(action: string, teamId: string, meta?: object) {
    this.log('info', `TEAM_EVENT: ${action}`, { teamEvent: true, teamId, ...meta });
  }

  // On-call operations
  onCallUpdate(teamId: string, assignedTo: string, meta?: object) {
    this.log('info', `ONCALL_UPDATE: Team ${teamId}`, {
      onCall: true,
      teamId,
      assignedTo,
      ...meta
    });
  }

  // Permission/role change
  roleChange(userId: string, oldRole: string, newRole: string, meta?: object) {
    this.log('info', `ROLE_CHANGE: ${userId} ${oldRole} → ${newRole}`, {
      permissionChange: true,
      userId,
      oldRole,
      newRole,
      ...meta
    });
  }
}

// --- Helpers ---
export const createLogger = (requestId?: string, userId?: string) => new Logger(requestId, userId);

export const getRequestId = (req: any): string =>
  req.headers['x-request-id'] || req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const logStartup = (port: number, env: string) => {
  logger.info('Team & User Management Service starting up', {
    startup: true,
    port,
    environment: env,
    nodeVersion: process.version,
    pid: process.pid
  });
};

export const logShutdown = (reason: string) => {
  logger.info('Team & User Management Service shutting down', {
    shutdown: true,
    reason,
    uptime: process.uptime()
  });
};

// --- Handle uncaught exceptions in production ---
if (isProduction) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      fatal: true
    });
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    });
  });
}
