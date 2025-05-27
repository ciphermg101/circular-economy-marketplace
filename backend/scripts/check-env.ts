import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
  // App
  'NODE_ENV',
  'PORT',
  'API_PREFIX',

  // Database (Supabase)
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_JWT_SECRET',

  // Security
  'JWT_SECRET',
  'CORS_ORIGINS',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_TTL',

  // Redis
  'REDIS_URL',

  // Email
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
];

const optionalEnvVars = [
  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',

  // Monitoring
  'SENTRY_DSN',
  'LOG_LEVEL',
  'LOG_DIR',
  'LOG_MAX_FILES',
  'LOG_MAX_SIZE',
];

function checkEnvFile(envPath: string) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌ ${envPath} file not found`);
    console.log(`💡 Tip: Run 'npm run env:copy' to create it from .env.example`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = new Set(
    envContent
      .split('\n')
      .map(line => line.split('=')[0].trim())
      .filter(Boolean)
  );

  let missingVars = [];
  let undeclaredVars = new Set(envVars);

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!envVars.has(varName)) {
      missingVars.push(varName);
    }
    undeclaredVars.delete(varName);
  }

  // Remove optional variables from undeclared set
  for (const varName of optionalEnvVars) {
    undeclaredVars.delete(varName);
  }

  // Report results
  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
  }

  if (undeclaredVars.size > 0) {
    console.warn('\n⚠️ Found undeclared environment variables:');
    Array.from(undeclaredVars).forEach(varName => {
      console.warn(`  - ${varName}`);
    });
  }

  const optionalVarsPresent = optionalEnvVars.filter(varName => envVars.has(varName));
  if (optionalVarsPresent.length > 0) {
    console.info('\nℹ️ Optional variables configured:');
    optionalVarsPresent.forEach(varName => {
      console.info(`  - ${varName}`);
    });
  }

  // Check for service-specific configurations
  const serviceConfigs = {
    'Stripe': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    'Sentry': ['SENTRY_DSN'],
  };

  for (const [service, vars] of Object.entries(serviceConfigs)) {
    const configuredVars = vars.filter(varName => envVars.has(varName));
    if (configuredVars.length > 0 && configuredVars.length < vars.length) {
      console.warn(`\n⚠️ Incomplete ${service} configuration:`);
      vars.forEach(varName => {
        console.warn(`  ${envVars.has(varName) ? '✓' : '✗'} ${varName}`);
      });
    }
  }

  if (missingVars.length === 0) {
    console.log('\n✅ All required environment variables are present');
  } else {
    process.exit(1);
  }
}

// Check .env file
const envPath = '.env';
console.log(`\nChecking ${envPath}...`);
checkEnvFile(envPath); 