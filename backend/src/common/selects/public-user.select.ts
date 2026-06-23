import { Prisma } from '@prisma/client';

export const publicUserBaseSelect = {
  id: true,
  telegramId: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
