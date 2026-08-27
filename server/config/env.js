import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'PORT',
  'NODE_ENV',
  'CLIENT_ORIGIN',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// A JWT is only as safe as its signing secret. A short or guessable secret means
// anyone can forge a token and log in as any user, including the admin.
// 32 characters is the practical floor; 64 hex characters from
// `openssl rand -hex 32` is the recommended value.
const MIN_SECRET_LENGTH = 32;
const SECRET_VARS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function loadEnv() {
  const isProduction = process.env.NODE_ENV === 'production';

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    // Fail loudly — a missing var must stop the server, never fall back silently.
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the missing values.');
    process.exit(1);
  }

  const weakSecrets = SECRET_VARS.filter((key) => process.env[key].length < MIN_SECRET_LENGTH);

  if (weakSecrets.length > 0) {
    // Never print the value itself, only which variable is at fault.
    console.error(`Weak JWT secret(s): ${weakSecrets.join(', ')}`);
    console.error(`Each must be at least ${MIN_SECRET_LENGTH} characters.`);
    console.error('Generate one with: openssl rand -hex 32');
    process.exit(1);
  }

  // The two secrets must differ. If they are the same, a refresh token would
  // also verify as a valid access token — turning a 7-day credential into an
  // unlimited one and defeating the point of a short access token.
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.');
    console.error('Sharing one secret lets a refresh token pass as an access token.');
    process.exit(1);
  }

  // Email is required in production and optional in development.
  //
  // Without a key in development, the email service prints the message to the
  // terminal instead of sending it — so the whole reset flow can be walked
  // through with no Resend account at all.
  //
  // In production that fallback would mean password resets silently never
  // arriving, with users locked out and nothing in the logs saying why. So the
  // server refuses to start instead.
  if (isProduction && !process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY.');
    console.error('Without it the server cannot send password reset emails.');
    process.exit(1);
  }

  if (isProduction && !process.env.EMAIL_FROM) {
    console.error('Missing EMAIL_FROM.');
    console.error('Set it to a sender on a domain verified in Resend,');
    console.error('for example: Cast of Mind <noreply@castofmind.com>');
    process.exit(1);
  }

  return {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    clientOrigin: process.env.CLIENT_ORIGIN,
    mongodbUri: process.env.MONGODB_URI,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    isProduction,

    // Resend. `emailFrom` falls back to Resend's shared test sender, which can
    // only deliver to the address the Resend account was registered with —
    // enough for development, useless for real users. Production is checked
    // above and will not start without a real value.
    resendApiKey: process.env.RESEND_API_KEY || null,
    emailFrom: process.env.EMAIL_FROM || 'Cast of Mind <onboarding@resend.dev>',

    // Public URL of the logo shown in email headers. Optional — the template
    // falls back to a text wordmark, which is better than a broken-image icon.
    emailLogoUrl: process.env.EMAIL_LOGO_URL || null,
  };
}

export default loadEnv();
