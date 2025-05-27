declare namespace NodeJS {
  interface ProcessEnv {
    // App
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_VERSION: string;

    // API
    NEXT_PUBLIC_API_URL: string;

    // Authentication
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;

    // Analytics and Monitoring
    NEXT_PUBLIC_GA_TRACKING_ID?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;

    // Feature Flags
    NEXT_PUBLIC_ENABLE_STRIPE: string;
    NEXT_PUBLIC_ENABLE_CHAT: string;
  }
} 