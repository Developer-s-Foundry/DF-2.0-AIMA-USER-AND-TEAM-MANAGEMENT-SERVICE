import { timeStamp } from 'node:console';
import app from './app';
import { databaseManager } from './config/db.config';
import { logger, Logger } from './utils/logger.utils';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info("Starting Team-User-Service...");
    logger.info("Connecting to dependencies...");
    await databaseManager.connect();

    logger.info("Starting Express server...");
    app.listen(PORT, () => {
      logger.info(`Team-User-Service running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timeStamp: new Date().toISOString()
      });
    });
  } catch (error: any) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Recieved ${signal}, starting graceful shutdown...`)
  try {
    await databaseManager.disconnect();

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch(error: any){
    logger.error("Error during graceful shutdown", {error: error.message});
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

startServer();
