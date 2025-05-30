import { registerAs } from '@nestjs/config';
import impactConfig from './impact.config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  version: process.env.APP_VERSION || '1.0.0',
  hostname: process.env.HOSTNAME || 'localhost',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
}));

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
}));

export const corsConfig = registerAs('cors', () => ({
  origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  burstLimit: parseInt(process.env.RATE_LIMIT_BURST || '50', 10),
}));

export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
}));

export const loggingConfig = registerAs('logging', () => ({
  level: process.env.LOG_LEVEL || 'info',
  dir: process.env.LOG_DIR || 'logs',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  maxSize: process.env.LOG_MAX_SIZE || '10m',
}));

export const emailConfig = registerAs('email', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM,
}));

export const mpesaConfig = registerAs('mpesa', () => ({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const monitoringConfig = registerAs('monitoring', () => ({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  errorRetentionPeriod: parseInt(process.env.ERROR_RETENTION_PERIOD || '604800000', 10), // 7 days
}));

export { impactConfig };
