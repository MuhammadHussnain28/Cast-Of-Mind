import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
