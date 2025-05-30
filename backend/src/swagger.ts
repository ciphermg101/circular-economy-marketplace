import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Circular Economy Marketplace API')
    .setDescription('API documentation for the Circular Economy Marketplace')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('reviews', 'Product reviews endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('messages', 'Real-time messaging endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

export const apiSchemas = {
  ProductReview: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      comment: { type: 'string' },
      productId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      isVerifiedPurchase: { type: 'boolean' },
      metadata: {
        type: 'object',
        properties: {
          images: { type: 'array', items: { type: 'string' } },
          helpfulCount: { type: 'integer' },
          reportCount: { type: 'integer' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  MpesaPayment: {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', pattern: '^254[0-9]{9}$' },
      amount: { type: 'number', minimum: 1 },
      orderId: { type: 'string', format: 'uuid' },
    },
    required: ['phoneNumber', 'amount', 'orderId'],
  },
  PaymentStatus: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
      },
      message: { type: 'string' },
      transactionId: { type: 'string' },
    },
  },
  EnvironmentalMetrics: {
    type: 'object',
    properties: {
      carbonSaved: { type: 'number', description: 'CO2 savings in kg' },
      waterSaved: { type: 'number', description: 'Water savings in liters' },
      energySaved: { type: 'number', description: 'Energy savings in kWh' },
      wastePrevented: { type: 'number', description: 'Waste prevented in kg' },
    },
  },
}; 