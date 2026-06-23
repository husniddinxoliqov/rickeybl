import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [BadgesController],
  providers: [BadgesService],
})
export class BadgesModule {}
