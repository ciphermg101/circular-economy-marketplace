import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from "@nestjs/swagger";

export function configureSwagger(app: INestApplication) {
  const configOptions = new DocumentBuilder()
    .setTitle("Circular Economy Marketplace API")
    .setDescription("API documentation for the Circular Economy Marketplace")
    .setVersion("1.0")
    .addTag("circular-economy-marketplace")
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('reviews', 'Product reviews endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('messages', 'Real-time messaging endpoints')
    .build();

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: "Circular Economy Marketplace API Docs",
  };
  const document = SwaggerModule.createDocument(app, configOptions);
  SwaggerModule.setup("docs", app, document, customOptions);
}
