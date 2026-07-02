import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const jwtSecret = configService.get<string>('JWT_SECRET', '');
  if (jwtSecret.length < 32) {
    // eslint-disable-next-line no-console
    console.warn(
      '[WARN] JWT_SECRET is weak or uses a default value. Change it before going to production.',
    );
  }

  app.use(helmet());
  app.enableCors({
    origin: true,
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
