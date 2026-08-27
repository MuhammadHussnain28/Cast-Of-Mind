import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// On Render/Railway every request arrives via the host's proxy, so req.ip would
// be the proxy's address for everyone. Rate limiting would then share ONE
// counter across all users, letting a single attacker lock out the whole
// platform. Trusting one proxy hop makes req.ip the real client address again.
//
// Only in production: enabling it in development would let anyone spoof their
// IP with an X-Forwarded-For header and walk straight past the login limiter.
if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

// Parses the httpOnly refresh cookie into req.cookies for /auth/refresh and
// /auth/logout. Nothing is signed here — the refresh token is a JWT that
// carries its own signature, so a cookie secret would add nothing.
app.use(cookieParser());

app.use(requestLogger);

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
