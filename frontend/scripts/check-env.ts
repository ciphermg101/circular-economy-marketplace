import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
  // App
  'NODE_ENV',
  'NEXT_PUBLIC_VERSION',

  // API
  'NEXT_PUBLIC_API_URL',

  // Authentication
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',

  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',

  // Feature Flags
  'NEXT_PUBLIC_ENABLE_STRIPE',
  'NEXT_PUBLIC_ENABLE_CHAT',
];

const optionalEnvVars = [
  // Maps
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',

  // Analytics and Monitoring
  'NEXT_PUBLIC_GA_TRACKING_ID',
  'NEXT_PUBLIC_SENTRY_DSN',
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

  if (missingVars.length === 0) {
    console.log('\n✅ All required environment variables are present');
  } else {
    process.exit(1);
  }
}

// Check both .env and .env.local
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`\nChecking ${envPath}...`);
    checkEnvFile(envPath);
    break;
  }
} 