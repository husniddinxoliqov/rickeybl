import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
