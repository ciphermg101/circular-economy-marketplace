import { registerAs } from '@nestjs/config';
import { plainToInstance} from 'class-transformer';
import {validateSync} from 'class-validator';
import { AppConfigDto, CorsConfigDto, EmailConfigDto, RedisConfigDto, SentryConfigDto, SupabaseConfigDto } from '@common/configs/dto/config.dto';

function validateConfig<T extends object>(cls: new () => T, config: Record<string, any>): T {
  const instance = plainToInstance(cls, config, { enableImplicitConversion: true });
  const errors = validateSync(instance, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${JSON.stringify(errors, null, 2)}`);
  }
  return instance;
}

export const appConfig = registerAs('app', () =>
  validateConfig(AppConfigDto, {
    env: process.env.NODE_ENV ?? '',
    port: process.env.PORT ?? '',
    apiPrefix: process.env.API_PREFIX ?? '',
    version: process.env.APP_VERSION ?? '',
    hostname: process.env.HOSTNAME ?? '',
  })
);

export const corsConfig = registerAs('cors', () =>
  validateConfig(CorsConfigDto, {
    origins: process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: process.env.CORS_CREDENTIALS ?? 'true',
  })
);

export const supabaseConfig = registerAs('supabase', () =>
  validateConfig(SupabaseConfigDto, {
    url: process.env.SUPABASE_URL ?? '',
    anon_key: process.env.SUPABASE_ANON_KEY ?? '',
  })
);

export const emailConfig = registerAs('email', () =>
  validateConfig(EmailConfigDto, {
    host: process.env.SMTP_HOST ?? '',
    port: process.env.SMTP_PORT ?? '',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? '',
  })
);

export const redisConfig = registerAs('redis', () =>
  validateConfig(RedisConfigDto, {
    url: process.env.REDIS_URL ?? '',
  })
);

export const sentryConfig = registerAs('monitoring', () =>
  validateConfig(SentryConfigDto, {
    sentryDsn: process.env.SENTRY_DSN ?? '',
  })
);