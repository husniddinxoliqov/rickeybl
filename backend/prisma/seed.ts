import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Pass SEED_RESET=true as an env variable to wipe all pilot data before
 * seeding fresh.  Useful when transitioning from pilot to production.
 *
 * WARNING: This removes ALL students, events, shop orders, coins, badges,
 * notifications and audit logs.  Users themselves are NOT deleted.
 */
async function resetPilotData() {
  console.log('⚠  SEED_RESET=true — wiping pilot data…');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.shopOrder.deleteMany(),
    prisma.coinTransaction.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.eventRegistration.deleteMany(),
    prisma.event.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.staffAssignment.deleteMany(),
  ]);
  console.log('✓  Pilot data wiped.');
}

async function main() {
  if (process.env.SEED_RESET === 'true') {
    await resetPilotData();
  }

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
      nameI18n: { uz: 'Birinchi qadamlar', ru: 'Первые шаги', en: 'First Steps' },
      descriptionI18n: {
        uz: 'Onboarding jarayonini yakunlagan talabalar uchun.',
        ru: 'Присваивается студентам, завершившим онбординг.',
        en: 'Granted to students who complete onboarding.',
      },
      requiredCoins: 0,
    },
    {
      name: 'Event Starter',
      description: 'Awarded after participating in the first event.',
      nameI18n: { uz: 'Tadbir ishtirokchisi', ru: 'Участник события', en: 'Event Starter' },
      descriptionI18n: {
        uz: "Birinchi tadbirda qatnashgandan so'ng beriladi.",
        ru: 'Присваивается после участия в первом событии.',
        en: 'Awarded after participating in the first event.',
      },
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
      nameI18n: { uz: 'SamDU daftari', ru: 'Тетрадь SamDU', en: 'SamDU Notebook' },
      descriptionI18n: {
        uz: 'Universitetning brendlangan daftari.',
        ru: 'Тетрадь с символикой университета.',
        en: 'University branded notebook.',
      },
      coinCost: 120,
      stock: 50,
    },
    {
      name: 'Priority Event Seat',
      description: 'Reserve a priority seat for a published event.',
      nameI18n: {
        uz: "Ustuvor tadbir o'rni",
        ru: 'Приоритетное место на событии',
        en: 'Priority Event Seat',
      },
      descriptionI18n: {
        uz: "E'lon qilingan tadbir uchun ustuvor o'rin bron qiling.",
        ru: 'Забронируйте приоритетное место на опубликованном мероприятии.',
        en: 'Reserve a priority seat for a published event.',
      },
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

