import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { ShopService } from './shop.service';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  listItems() {
    return this.shopService.listItems();
  }

  @Post('items')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  createItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShopItemDto) {
    return this.shopService.createItem(user.id, dto);
  }

  @Post('orders')
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.shopService.createOrder(user.id, dto);
  }

  @Get('orders/me')
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.shopService.listOrders(user.id);
  }

  @Get('orders/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  listPendingOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.shopService.listPendingOrders(user);
  }

  @Post('orders/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  approveOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.shopService.approveOrder(user, id);
  }

  @Post('orders/:id/received')
  markReceived(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.shopService.markReceived(user.id, id);
  }

  @Post('orders/:id/cancel')
  cancelOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.shopService.cancelOrder(user, id);
  }
}
