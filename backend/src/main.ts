import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

const WEAK_JWT_SECRETS = new Set([
  'your_jwt_secret_here_change_in_production',
  'secret',
  'changeme',
  'jwt_secret',
]);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  const jwtSecret = configService.get<string>('JWT_SECRET', '');
  if (WEAK_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
    // eslint-disable-next-line no-console
    console.warn(
      '[WARN] JWT_SECRET is weak or uses a default value. Change it before going to production.',
    );
  }

  const corsOrigin = configService.get<string>('CORS_ORIGIN')?.trim();
  let corsOrigins: true | string[] = true;
  if (corsOrigin && corsOrigin !== '*') {
    corsOrigins = corsOrigin
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (corsOrigin === '*' && nodeEnv === 'production') {
    throw new Error('CORS_ORIGIN cannot be "*" in production.');
  }

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
