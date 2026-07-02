import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoinTransactionType, NotificationType, Prisma, ShopOrderStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  getLocalizedText,
  localizedText,
  normalizeLocalizedText,
} from '../common/i18n/localized-content';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { isStudentInScope, resolveStaffScope } from '../common/utils/staff-scope.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';

const orderInclude = {
  item: true,
  user: {
    select: {
      ...publicUserBaseSelect,
      studentProfile: true,
    },
  },
  approver: {
    select: publicUserBaseSelect,
  },
} satisfies Prisma.ShopOrderInclude;

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listItems() {
    return this.prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItemById(id: string) {
    const item = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }

    return item;
  }

  async createItem(actorId: string, dto: CreateShopItemDto) {
    const nameI18n = normalizeLocalizedText(dto.nameI18n);
    const descriptionI18n = normalizeLocalizedText(dto.descriptionI18n);
    const item = await this.prisma.shopItem.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
        ...(nameI18n ? { nameI18n } : {}),
        ...(descriptionI18n ? { descriptionI18n } : {}),
        imageUrl: dto.imageUrl,
        coinCost: dto.coinCost,
        stock: dto.stock ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log(actorId, 'shop.item_created', 'ShopItem', item.id, null, {
      name: item.name,
    });

    return item;
  }

  async updateItem(actorId: string, id: string, dto: UpdateShopItemDto) {
    const existing = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Shop item not found');
    }

    const nameI18n = dto.nameI18n !== undefined ? normalizeLocalizedText(dto.nameI18n) : undefined;
    const descriptionI18n = dto.descriptionI18n !== undefined ? normalizeLocalizedText(dto.descriptionI18n) : undefined;

    const item = await this.prisma.shopItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(nameI18n !== undefined ? { nameI18n: nameI18n || undefined } : {}),
        ...(descriptionI18n !== undefined ? { descriptionI18n: descriptionI18n || undefined } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.coinCost !== undefined ? { coinCost: dto.coinCost } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.auditService.log(actorId, 'shop.item_updated', 'ShopItem', item.id, { name: existing.name }, {
      name: item.name,
    });

    return item;
  }

  async deleteItem(actorId: string, id: string) {
    const existing = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Shop item not found');
    }

    const item = await this.prisma.shopItem.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(actorId, 'shop.item_deleted', 'ShopItem', item.id, { isActive: true }, {
      isActive: false,
    });

    return item;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const quantity = dto.quantity ?? 1;
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const item = await tx.shopItem.findUnique({ where: { id: dto.itemId } });
      if (!item || !item.isActive) {
        throw new NotFoundException('Shop item is not available');
      }
      if (item.stock !== -1 && item.stock < quantity) {
        throw new BadRequestException('Insufficient shop item stock');
      }

      const balanceAggregate = await tx.coinTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const balance = balanceAggregate._sum.amount ?? 0;
      const totalCost = item.coinCost * quantity;
      if (balance < totalCost) {
        throw new BadRequestException('Insufficient coin balance');
      }

      const createdOrder = await tx.shopOrder.create({
        data: {
          userId,
          itemId: item.id,
          quantity,
          totalCost,
          notes: dto.notes,
          status: ShopOrderStatus.PENDING,
        },
        include: orderInclude,
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -totalCost,
          type: CoinTransactionType.RESERVE,
          reason: `Reserved for shop order ${item.name}`,
          referenceId: createdOrder.id,
        },
      });

      return createdOrder;
    });

    await this.auditService.log(userId, 'shop.order_created', 'ShopOrder', order.id, null, {
      totalCost: order.totalCost,
      quantity: order.quantity,
    });
    await this.notificationsService.createNotification(
      userId,
      'Shop order created',
      `Your order for ${order.item.name} is pending approval.`,
      NotificationType.SHOP,
      {
        titleI18n: localizedText("Do'kon buyurtmasi yaratildi", 'Заказ магазина создан', 'Shop order created'),
        bodyI18n: localizedText(
          `${getLocalizedText(order.item.nameI18n, 'uz', order.item.name)} uchun buyurtmangiz tasdiqlanishini kutmoqda.`,
          `Ваш заказ на ${getLocalizedText(order.item.nameI18n, 'ru', order.item.name)} ожидает подтверждения.`,
          `Your order for ${order.item.name} is pending approval.`,
        ),
      },
    );

    return order;
  }

  async approveOrder(actor: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.shopOrder.findUnique({
        where: { id: orderId },
        include: {
          ...orderInclude,
          user: {
            select: {
              ...publicUserBaseSelect,
              studentProfile: true,
            },
          },
        },
      });
      if (!existing) {
        throw new NotFoundException('Shop order not found');
      }
      if (existing.status !== ShopOrderStatus.PENDING) {
        throw new ConflictException('Only pending orders can be approved');
      }

      const scope = resolveStaffScope(actor);
      const studentProfile = existing.user.studentProfile;
      if (scope && studentProfile) {
        if (!isStudentInScope(scope, studentProfile.facultyId, studentProfile.groupId)) {
          throw new ForbiddenException('Order is not in your assigned scope');
        }
      }

      if (existing.item.stock !== -1 && existing.item.stock < existing.quantity) {
        throw new BadRequestException('Insufficient stock to approve this order');
      }

      if (existing.item.stock !== -1) {
        await tx.shopItem.update({
          where: { id: existing.itemId },
          data: {
            stock: {
              decrement: existing.quantity,
            },
          },
        });
      }

      return tx.shopOrder.update({
        where: { id: orderId },
        data: {
          status: ShopOrderStatus.APPROVED,
          approvedBy: actor.id,
          approvedAt: new Date(),
        },
        include: orderInclude,
      });
    });

    await this.auditService.log(actor.id, 'shop.order_approved', 'ShopOrder', order.id, null, {
      status: order.status,
    });
    await this.notificationsService.createNotification(
      order.userId,
      'Order approved',
      `Your order for ${order.item.name} has been approved.`,
      NotificationType.SHOP,
      {
        titleI18n: localizedText('Buyurtma tasdiqlandi', 'Заказ подтверждён', 'Order approved'),
        bodyI18n: localizedText(
          `${getLocalizedText(order.item.nameI18n, 'uz', order.item.name)} uchun buyurtmangiz tasdiqlandi.`,
          `Ваш заказ на ${getLocalizedText(order.item.nameI18n, 'ru', order.item.name)} подтверждён.`,
          `Your order for ${order.item.name} has been approved.`,
        ),
      },
    );

    return order;
  }

  async markReceived(userId: string, orderId: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.shopOrder.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });
      if (!existing) {
        throw new NotFoundException('Shop order not found');
      }
      if (existing.userId !== userId) {
        throw new ForbiddenException('You can only mark your own orders as received');
      }
      if (existing.status !== ShopOrderStatus.APPROVED) {
        throw new ConflictException('Only approved orders can be marked as received');
      }

      const updated = await tx.shopOrder.update({
        where: { id: orderId },
        data: {
          status: ShopOrderStatus.RECEIVED,
          receivedAt: new Date(),
        },
        include: orderInclude,
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: 0,
          type: CoinTransactionType.DEDUCT,
          reason: `Finalized reserved coins for order ${updated.id}`,
          referenceId: updated.id,
        },
      });

      return updated;
    });

    await this.auditService.log(userId, 'shop.order_received', 'ShopOrder', order.id, null, {
      status: order.status,
    });

    return order;
  }

  async cancelOrder(actor: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.shopOrder.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });
      if (!existing) {
        throw new NotFoundException('Shop order not found');
      }
      if (existing.status === ShopOrderStatus.CANCELLED || existing.status === ShopOrderStatus.RECEIVED) {
        throw new ConflictException('This order can no longer be cancelled');
      }
      if (actor.role === UserRole.STUDENT && existing.userId !== actor.id) {
        throw new ForbiddenException('You can only cancel your own orders');
      }

      if (actor.role === UserRole.STAFF) {
        const scope = resolveStaffScope(actor);
        const studentProfile = existing.user.studentProfile;
        if (scope && studentProfile) {
          if (!isStudentInScope(scope, studentProfile.facultyId, studentProfile.groupId)) {
            throw new ForbiddenException('Order is not in your assigned scope');
          }
        }
      }

      if (existing.status === ShopOrderStatus.APPROVED && existing.item.stock !== -1) {
        await tx.shopItem.update({
          where: { id: existing.itemId },
          data: {
            stock: {
              increment: existing.quantity,
            },
          },
        });
      }

      await tx.coinTransaction.create({
        data: {
          userId: existing.userId,
          amount: existing.totalCost,
          type: CoinTransactionType.REFUND,
          reason: `Refund for cancelled order ${existing.id}`,
          referenceId: existing.id,
        },
      });

      return tx.shopOrder.update({
        where: { id: orderId },
        data: {
          status: ShopOrderStatus.CANCELLED,
        },
        include: orderInclude,
      });
    });

    await this.auditService.log(actor.id, 'shop.order_cancelled', 'ShopOrder', order.id, null, {
      status: order.status,
    });
    await this.notificationsService.createNotification(
      order.userId,
      'Order cancelled',
      `Your order for ${order.item.name} was cancelled and refunded.`,
      NotificationType.SHOP,
      {
        titleI18n: localizedText('Buyurtma bekor qilindi', 'Заказ отменён', 'Order cancelled'),
        bodyI18n: localizedText(
          `${getLocalizedText(order.item.nameI18n, 'uz', order.item.name)} uchun buyurtmangiz bekor qilindi va coin qaytarildi.`,
          `Ваш заказ на ${getLocalizedText(order.item.nameI18n, 'ru', order.item.name)} отменён, coin возвращены.`,
          `Your order for ${order.item.name} was cancelled and refunded.`,
        ),
      },
    );

    return order;
  }

  listOrders(userId?: string) {
    return this.prisma.shopOrder.findMany({
      where: userId ? { userId } : undefined,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingOrders(actor: AuthenticatedUser) {
    const scope = resolveStaffScope(actor);

    const where: Prisma.ShopOrderWhereInput = { status: ShopOrderStatus.PENDING };

    if (scope) {
      const conditions: Prisma.ShopOrderWhereInput[] = [];
      if (scope.facultyWideIds.length) {
        conditions.push({
          user: { studentProfile: { facultyId: { in: scope.facultyWideIds } } },
        });
      }
      if (scope.groupSpecificIds.length) {
        conditions.push({
          user: { studentProfile: { groupId: { in: scope.groupSpecificIds } } },
        });
      }
      if (conditions.length) {
        where.OR = conditions;
      } else {
        return [];
      }
    }

    return this.prisma.shopOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'asc' },
    });
  }
}
