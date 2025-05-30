import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { logger } from './utils/logger'; // Import the logger factory function
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { SecurityMiddleware } from './middleware/security.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appLogger = logger(configService); // Create a logger instance using ConfigService

  // Use the logger for HTTP logging
  app.useLogger(appLogger); // Set the logger

   // Apply helmet middleware for security
   app.use(helmet()); 

  const port = configService.get('app.port');
  const apiPrefix = configService.get('app.apiPrefix');

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable compression
  app.use(compression());

  // Apply security middleware
  const securityMiddleware = app.get(SecurityMiddleware);
  app.use(securityMiddleware.use.bind(securityMiddleware));

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Circular Economy Marketplace API')
    .setDescription('API documentation for the Circular Economy Marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start the server
  await app.listen(port);
  
  appLogger.info(`Application is running on: ${await app.getUrl()}`);
  appLogger.info(`Swagger documentation is available at: ${await app.getUrl()}/docs`);
}

bootstrap();