import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ROOT_USERNAME ?? 'admin';
  const rawPassword = process.env.ROOT_PASSWORD ?? 'change_this_password';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const rootUser = await prisma.user.upsert({
    where: { username },
    update: {
      role: UserRole.ROOT,
      passwordHash,
      isActive: true,
    },
    create: {
      username,
      role: UserRole.ROOT,
      passwordHash,
      isActive: true,
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { code: 'SAMDU-CS' },
    update: { name: 'Computer Science Faculty' },
    create: {
      name: 'Computer Science Faculty',
      code: 'SAMDU-CS',
    },
  });

  await prisma.group.upsert({
    where: { code: 'CS-101' },
    update: {
      name: 'CS 101',
      facultyId: faculty.id,
      joinCode: 'SAMDU-2026',
      isActive: true,
    },
    create: {
      name: 'CS 101',
      code: 'CS-101',
      joinCode: 'SAMDU-2026',
      facultyId: faculty.id,
      coinBalance: 0,
      isActive: true,
    },
  });

  const badges = [
    {
      name: 'First Steps',
      description: 'Granted to students who complete onboarding.',
      requiredCoins: 0,
    },
    {
      name: 'Event Starter',
      description: 'Awarded after participating in the first event.',
      requiredCoins: 50,
    },
  ];

  for (const badge of badges) {
    const existing = await prisma.badge.findFirst({ where: { name: badge.name } });
    if (existing) {
      await prisma.badge.update({
        where: { id: existing.id },
        data: badge,
      });
    } else {
      await prisma.badge.create({ data: badge });
    }
  }

  const shopItems = [
    {
      name: 'SamDU Notebook',
      description: 'University branded notebook.',
      coinCost: 120,
      stock: 50,
    },
    {
      name: 'Priority Event Seat',
      description: 'Reserve a priority seat for a published event.',
      coinCost: 300,
      stock: -1,
    },
  ];

  for (const item of shopItems) {
    const existing = await prisma.shopItem.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.shopItem.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.shopItem.create({ data: item });
    }
  }

  console.log(`Seed complete. Root user: ${rootUser.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
