import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BadgesModule } from './badges/badges.module';
import { CoinsModule } from './coins/coins.module';
import { EventsModule } from './events/events.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { GroupsModule } from './groups/groups.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopModule } from './shop/shop.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';

const BOT_TOKEN_PLACEHOLDERS = new Set([
  'your_telegram_bot_token',
  'your_bot_token',
  '0000000000:dev_only_bot_token_placeholder',
  'YOUR_BOT_TOKEN',
  'placeholder',
  'token',
  'xxx',
]);

const ROOT_USERNAME_PLACEHOLDERS = new Set([
  'admin',
  'root',
  'administrator',
  'user',
]);

const ROOT_PASSWORD_PLACEHOLDERS = new Set([
  'your_root_password_here',
  'change_this_password',
  'password',
  'changeme',
]);

const ROOT_EMAIL_PLACEHOLDERS = new Set([
  'admin@example.com',
  'root@example.com',
  'user@example.com',
]);

const WEAK_JWT_SECRETS = new Set([
  'your_jwt_secret_here_change_in_production',
  'secret',
  'changeme',
  'jwt_secret',
]);

function validateEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const portValue = env.PORT?.trim() || '3000';
  const port = Number(portValue);

  if (Number.isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT value "${portValue}": expected an integer between 1 and 65535.`,
    );
  }

  if (nodeEnv === 'production') {
    const corsOrigin = env.CORS_ORIGIN?.trim();
    if (!corsOrigin || corsOrigin === '*') {
      throw new Error(
        'CORS_ORIGIN is not set for production. Provide one or more explicit origins separated by commas.',
      );
    }

    const botToken = env.BOT_TOKEN?.trim();
    if (!botToken || BOT_TOKEN_PLACEHOLDERS.has(botToken)) {
      throw new Error(
        'Invalid BOT_TOKEN: set a real Telegram bot token before running in production.',
      );
    }

    const databaseUrl = env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Provide a valid PostgreSQL connection string before running in production.',
      );
    }

    const jwtSecret = env.JWT_SECRET?.trim() ?? '';
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not set. Provide a strong secret (≥ 32 chars) before running in production.',
      );
    }
    if (WEAK_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET is weak or uses a default value. Set a strong secret (≥ 32 chars) before running in production.',
      );
    }

    const rootPassword = env.ROOT_PASSWORD?.trim();
    if (!rootPassword || ROOT_PASSWORD_PLACEHOLDERS.has(rootPassword)) {
      throw new Error(
        'ROOT_PASSWORD is not set or uses a placeholder. Set a strong password before running in production.',
      );
    }

    const rootUsername = env.ROOT_USERNAME?.trim();
    if (!rootUsername || ROOT_USERNAME_PLACEHOLDERS.has(rootUsername.toLowerCase())) {
      throw new Error(
        'ROOT_USERNAME is not set or uses a default value ("admin", "root", etc.). Set a custom admin username before running in production.',
      );
    }

    const rootEmail = env.ROOT_EMAIL?.trim().toLowerCase();
    if (!rootEmail || ROOT_EMAIL_PLACEHOLDERS.has(rootEmail)) {
      throw new Error(
        'ROOT_EMAIL is not set or uses a default placeholder. Set a unique root email before running in production.',
      );
    }
  }

  return env;
}

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuditModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    StudentsModule,
    GroupsModule,
    CoinsModule,
    BadgesModule,
    EventsModule,
    ShopModule,
    AdminModule,
    AnnouncementsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
