import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { WEBHOOK_BODY_LIMIT } from './constants/webhooks.js';

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

// THE RAW BODY, AND WHY IT IS MOUNTED BEFORE express.json().
//
// Stripe signs the EXACT BYTES it sends. express.json() discards them and hands
// back a re-serialised object, which produces a different HMAC — so every
// webhook would fail verification with "No signatures found matching the
// expected signature", a message that reads like a wrong secret and sends you
// hunting in the dashboard instead of here.
//
// Scoped to the webhook path only. `type: '*/*'` so a proxy rewriting the
// content type cannot silently break it. Safe to sit ahead of express.json():
// body-parser marks a request once parsed, so the JSON parser skips it rather
// than fighting over the stream. The size cap matters because this endpoint is
// unauthenticated.
app.use('/api/v1/webhooks', express.raw({ type: '*/*', limit: WEBHOOK_BODY_LIMIT }));

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
