import { LoggerService } from '@nestjs/common';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import rfs from 'rotating-file-stream';
import { ConfigService } from '@nestjs/config';
import { getPinoConfig } from '../config/logger.config'; // Import the logger config

// Create a rotating file stream with fallback values
const createRotatingStream = (configService?: ConfigService) => {
  let logDirectory = 'logs';
  let maxFiles = 10;

  try {
    if (configService) {
      const loggingConfig = configService.get('logging') || {};
      logDirectory = loggingConfig.dir || logDirectory;
      maxFiles = loggingConfig.maxFiles || maxFiles;
    }

    const resolvedLogDirectory = path.resolve(logDirectory);

    // Ensure the log directory exists
    if (!fs.existsSync(resolvedLogDirectory)) {
      fs.mkdirSync(resolvedLogDirectory, { recursive: true });
    }

    return rfs.createStream('application.log', {
      interval: '1d', // daily rotation
      path: resolvedLogDirectory,
      compress: 'gzip',
      maxFiles,
    });
  } catch (error) {
    // Fallback to a simple file stream if rotation setup fails
    const resolvedLogDirectory = path.resolve(logDirectory);
    if (!fs.existsSync(resolvedLogDirectory)) {
      fs.mkdirSync(resolvedLogDirectory, { recursive: true });
    }
    return fs.createWriteStream(path.join(resolvedLogDirectory, 'application.log'), { flags: 'a' });
  }
};

export class PinoLogger implements LoggerService {
  private logger: pino.Logger;

  constructor(configService?: ConfigService) {
    const rotatingStream = createRotatingStream(configService);
    const baseLogger = getPinoConfig();

    let environment = 'development';
    let version = '1.0.0';
    let hostname = 'localhost';

    try {
      if (configService) {
        const appConfig = configService.get('app') || {};
        environment = appConfig.env || environment;
        version = appConfig.version || version;
        hostname = appConfig.hostname || hostname;
      }
    } catch (error) {
      // Use default values if config service fails
    }

    // Add additional configurations for rotating file stream
    this.logger = pino({
      ...baseLogger,
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          },
          {
            target: 'pino/file',
            options: { destination: rotatingStream },
          },
        ],
      },
      base: {
        environment,
        version,
        host: hostname,
      },
    });
  }

  log(message: any, context?: string) {
    this.logger.info({ context }, message);
  }

  info(message: any, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: any, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: any, context?: string) {
    this.logger.trace({ context }, message);
  }
}

// Export a default logger instance that will be replaced when the app starts
export const logger = (configService?: ConfigService) => new PinoLogger(configService);