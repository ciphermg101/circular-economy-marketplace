import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { ConfigService } from '@nestjs/config';

export const getWinstonConfig = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const loggingConfig = configService.get('logging');
  const env = configService.get('app.nodeEnv');

  const formatters = {
    level: (label: string) => ({ level: label }),
    timestamp: () => ({ timestamp: new Date().toISOString() }),
    metadata: (meta: any) => ({ ...meta }),
  };

  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    env === 'development'
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    nestWinstonModuleUtilities.format.nestLike('Circular Economy', {
      prettyPrint: true,
    }),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format,
    }),
  ];

  // Add file transport in production
  if (env === 'production') {
    transports.push(
      new winston.transports.File({
        filename: `${loggingConfig.directory}/error.log`,
        level: 'error',
        format,
        maxFiles: loggingConfig.maxFiles,
        maxsize: parseInt(loggingConfig.maxSize),
      }),
      new winston.transports.File({
        filename: `${loggingConfig.directory}/combined.log`,
        format,
        maxFiles: loggingConfig.maxFiles,
        maxsize: parseInt(loggingConfig.maxSize),
      }),
    );
  }

  return {
    level: loggingConfig.level,
    format,
    transports,
    exceptionHandlers: [
      new winston.transports.File({
        filename: `${loggingConfig.directory}/exceptions.log`,
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: `${loggingConfig.directory}/rejections.log`,
      }),
    ],
  };
}; 