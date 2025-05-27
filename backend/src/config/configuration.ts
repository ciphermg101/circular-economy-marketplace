import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_KEY: Joi.string().required(),
  
  // Security
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRATION: Joi.string().default('24h'),
  CORS_ORIGINS: Joi.string().required(),
  RATE_LIMIT_MAX: Joi.number().default(100),
  
  // M-Pesa
  MPESA_CONSUMER_KEY: Joi.string().required(),
  MPESA_CONSUMER_SECRET: Joi.string().required(),
  MPESA_PASSKEY: Joi.string().required(),
  MPESA_SHORTCODE: Joi.string().required(),
  MPESA_ENVIRONMENT: Joi.string().valid('sandbox', 'production').default('sandbox'),
  MPESA_CALLBACK_URL: Joi.string().uri().required(),
  
  // Redis (for caching)
  REDIS_URL: Joi.string().required(),
  
  // Monitoring
  SENTRY_DSN: Joi.string().uri(),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
});

export const appConfig = () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
});

export const authConfig = () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
});

export const corsConfig = () => ({
  origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});

export const rateLimitConfig = () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
});

export const supabaseConfig = () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
});

export const loggingConfig = () => ({
  level: process.env.LOG_LEVEL || 'info',
  dir: process.env.LOG_DIR || 'logs',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  maxSize: process.env.LOG_MAX_SIZE || '10m',
});

export const emailConfig = () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM,
});

export const mpesaConfig = () => ({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL,
});

export const redisConfig = () => ({
  url: process.env.REDIS_URL,
});

export const monitoringConfig = registerAs('monitoring', () => ({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
})); 