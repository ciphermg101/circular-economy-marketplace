import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    url: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    entities: [__dirname + '/src/modules/**/*.entity.js'],
    synchronize: true,
    logging: true,
  };
};

