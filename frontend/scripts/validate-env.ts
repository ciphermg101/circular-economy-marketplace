import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

// Define environment variable schema
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_VERSION: z.string().default('1.0.0'),

  // API
  NEXT_PUBLIC_API_URL: z.string().url(),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),

  // Maps (optional)
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Analytics and Monitoring (optional)
  NEXT_PUBLIC_GA_TRACKING_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_STRIPE: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_CHAT: z.string().transform((val) => val === 'true'),
});

try {
  // Validate environment variables
  const env = envSchema.parse(process.env);
  console.log('✅ Environment variables are valid');
  
  // Type check: this will ensure our types match our runtime validation
  type Env = z.infer<typeof envSchema>;
  const _: Env = env; // This will error if types don't match
  
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('❌ Error validating environment variables:', error);
  }
  process.exit(1);
} 