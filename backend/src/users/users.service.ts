import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { PrismaService } from '../prisma/prisma.service';

const userSelect = {
  ...publicUserBaseSelect,
  studentProfile: {
    include: {
      faculty: true,
      group: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      select: userSelect,
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
