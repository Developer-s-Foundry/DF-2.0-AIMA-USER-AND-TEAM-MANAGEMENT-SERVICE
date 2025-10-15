// src/app.ts
import express, { Application, Request, Response} from 'express';
import { env } from './config/env.config';

const app: Application = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Health check endpoint ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV,
  });
});



export default app;
