import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BadgesModule } from './badges/badges.module';
import { CoinsModule } from './coins/coins.module';
import { EventsModule } from './events/events.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { GroupsModule } from './groups/groups.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopModule } from './shop/shop.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';

const BOT_TOKEN_PLACEHOLDERS = new Set([
  'your_telegram_bot_token',
  'YOUR_BOT_TOKEN',
  'placeholder',
  'token',
  'xxx',
]);

const ROOT_PASSWORD_PLACEHOLDERS = new Set([
  'your_root_password_here',
  'change_this_password',
  'password',
  'changeme',
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
  }

  return env;
}

@Module({
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
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
