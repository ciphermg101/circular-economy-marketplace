import { validate } from '../src/config/env.validation';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Skip validation during build
if (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION === 'true') {
  console.log('✅ Skipping environment validation in production build');
  process.exit(0);
}

// Load environment variables from .env file
dotenv.config();

try {
  // Validate environment variables using our class-validator based validation
  const config = validate(process.env);
  console.log('✅ Environment variables are valid');

  // Additional checks for required services
  const requiredUrls = [
    { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
    { name: 'REDIS_URL', value: process.env.REDIS_URL },
  ];

  for (const { name, value } of requiredUrls) {
    if (!value) {
      throw new Error(`Missing required URL: ${name}`);
    }
    try {
      new URL(value);
    } catch {
      throw new Error(`Invalid URL for ${name}: ${value}`);
    }
  }

  // Validate sensitive information is not empty
  const sensitiveVars = [
    'JWT_SECRET',
    'SUPABASE_KEY',
    'SUPABASE_JWT_SECRET',
  ];

  for (const varName of sensitiveVars) {
    const value = process.env[varName];
    if (!value || value.length < 32) {
      throw new Error(`${varName} must be at least 32 characters long`);
    }
  }

  // Validate numeric values
  const numericVars = [
    { name: 'PORT', min: 1, max: 65535 },
    { name: 'RATE_LIMIT_MAX', min: 1 },
    { name: 'RATE_LIMIT_TTL', min: 1 },
    { name: 'SMTP_PORT', min: 1, max: 65535 },
  ];

  for (const { name, min, max } of numericVars) {
    const value = Number(process.env[name]);
    if (isNaN(value)) {
      throw new Error(`${name} must be a number`);
    }
    if (value < min) {
      throw new Error(`${name} must be at least ${min}`);
    }
    if (max && value > max) {
      throw new Error(`${name} must be at most ${max}`);
    }
  }

  console.log('✅ All additional validations passed');

} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  process.exit(1);
} 