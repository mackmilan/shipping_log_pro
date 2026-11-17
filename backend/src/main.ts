import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // Enable CORS for frontend requests
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('ShippingLog Pro - Truck Unloading Window API')
    .setDescription(
      'Sistema de Gestão e Controle de Janela de Tempos de Descarga de Caminhões com Rastreamento de Etapas',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '127.0.0.1');
  logger.log(`🚀 Backend rodando com sucesso em http://127.0.0.1:${port}/api`);
  logger.log(`📚 Documentação Swagger disponível em http://localhost:${port}/api/docs`);
}
bootstrap();
