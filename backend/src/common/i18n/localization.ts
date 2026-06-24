export type AppLocale = 'uz' | 'ru' | 'en';

const localizedMessages: Record<string, Record<AppLocale, string>> = {
  'Internal server error': {
    uz: 'Ichki server xatosi',
    ru: 'Внутренняя ошибка сервера',
    en: 'Internal server error',
  },
  'User not found': {
    uz: 'Foydalanuvchi topilmadi',
    ru: 'Пользователь не найден',
    en: 'User not found',
  },
  'Badge not found': {
    uz: 'Badge topilmadi',
    ru: 'Badge не найден',
    en: 'Badge not found',
  },
  'Badge already awarded to this user': {
    uz: 'Bu foydalanuvchiga badge allaqachon berilgan',
    ru: 'Этот badge уже выдан пользователю',
    en: 'Badge already awarded to this user',
  },
  'Event not found': {
    uz: 'Tadbir topilmadi',
    ru: 'Событие не найдено',
    en: 'Event not found',
  },
  'Faculty not found': {
    uz: 'Fakultet topilmadi',
    ru: 'Факультет не найден',
    en: 'Faculty not found',
  },
  'You are already registered for this event': {
    uz: "Siz bu tadbir uchun allaqachon ro'yxatdan o'tgansiz",
    ru: 'Вы уже зарегистрированы на это событие',
    en: 'You are already registered for this event',
  },
  'Student profile already exists for this user': {
    uz: 'Bu foydalanuvchi uchun talaba profili allaqachon mavjud',
    ru: 'Студенческий профиль для этого пользователя уже существует',
    en: 'Student profile already exists for this user',
  },
  'Student ID is already registered': {
    uz: "Talaba ID allaqachon ro'yxatdan o'tgan",
    ru: 'Student ID уже зарегистрирован',
    en: 'Student ID is already registered',
  },
  'Invalid group for selected faculty': {
    uz: 'Tanlangan fakultet uchun guruh mos emas',
    ru: 'Группа не подходит для выбранного факультета',
    en: 'Invalid group for selected faculty',
  },
  'Student profile not found': {
    uz: 'Talaba profili topilmadi',
    ru: 'Студенческий профиль не найден',
    en: 'Student profile not found',
  },
  'Only pending profiles can be approved': {
    uz: 'Faqat kutilayotgan profillar tasdiqlanishi mumkin',
    ru: 'Подтвердить можно только профили в ожидании',
    en: 'Only pending profiles can be approved',
  },
  'Only pending profiles can be rejected': {
    uz: 'Faqat kutilayotgan profillar rad etilishi mumkin',
    ru: 'Отклонить можно только профили в ожидании',
    en: 'Only pending profiles can be rejected',
  },
  'Group not found': {
    uz: 'Guruh topilmadi',
    ru: 'Группа не найдена',
    en: 'Group not found',
  },
  'Shop item not found': {
    uz: "Do'kon mahsuloti topilmadi",
    ru: 'Товар магазина не найден',
    en: 'Shop item not found',
  },
  'Quantity must be at least 1': {
    uz: "Miqdor kamida 1 bo'lishi kerak",
    ru: 'Количество должно быть не меньше 1',
    en: 'Quantity must be at least 1',
  },
  'Shop item is not available': {
    uz: "Do'kon mahsuloti mavjud emas",
    ru: 'Товар магазина недоступен',
    en: 'Shop item is not available',
  },
  'Insufficient shop item stock': {
    uz: 'Mahsulot zaxirasi yetarli emas',
    ru: 'Недостаточно товара на складе',
    en: 'Insufficient shop item stock',
  },
  'Insufficient coin balance': {
    uz: 'Coin balansi yetarli emas',
    ru: 'Недостаточный баланс coin',
    en: 'Insufficient coin balance',
  },
  'Shop order not found': {
    uz: "Do'kon buyurtmasi topilmadi",
    ru: 'Заказ магазина не найден',
    en: 'Shop order not found',
  },
  'Only pending orders can be approved': {
    uz: 'Faqat kutilayotgan buyurtmalar tasdiqlanishi mumkin',
    ru: 'Подтвердить можно только ожидающие заказы',
    en: 'Only pending orders can be approved',
  },
  'Insufficient stock to approve this order': {
    uz: 'Bu buyurtmani tasdiqlash uchun zaxira yetarli emas',
    ru: 'Недостаточно остатков для подтверждения заказа',
    en: 'Insufficient stock to approve this order',
  },
  'You can only mark your own orders as received': {
    uz: "Faqat o'zingizning buyurtmalaringizni qabul qilingan deb belgilaysiz",
    ru: 'Можно отмечать полученными только свои заказы',
    en: 'You can only mark your own orders as received',
  },
  'Only approved orders can be marked as received': {
    uz: 'Faqat tasdiqlangan buyurtmalar qabul qilindi deb belgilanishi mumkin',
    ru: 'Полученными можно отметить только подтверждённые заказы',
    en: 'Only approved orders can be marked as received',
  },
  'This order can no longer be cancelled': {
    uz: 'Bu buyurtmani endi bekor qilib bo‘lmaydi',
    ru: 'Этот заказ больше нельзя отменить',
    en: 'This order can no longer be cancelled',
  },
  'You can only cancel your own orders': {
    uz: "Faqat o'zingizning buyurtmalaringizni bekor qilishingiz mumkin",
    ru: 'Можно отменять только свои заказы',
    en: 'You can only cancel your own orders',
  },
  'Invalid credentials': {
    uz: "Noto'g'ri login yoki parol",
    ru: 'Неверные учетные данные',
    en: 'Invalid credentials',
  },
  'BOT_TOKEN is not configured': {
    uz: 'BOT_TOKEN sozlanmagan',
    ru: 'BOT_TOKEN не настроен',
    en: 'BOT_TOKEN is not configured',
  },
  'Invalid Telegram init data payload': {
    uz: "Telegram initData noto'g'ri",
    ru: 'Некорректный payload Telegram initData',
    en: 'Invalid Telegram init data payload',
  },
  'Invalid auth_date in Telegram payload': {
    uz: "Telegram payload ichidagi auth_date noto'g'ri",
    ru: 'Некорректный auth_date в payload Telegram',
    en: 'Invalid auth_date in Telegram payload',
  },
  'Telegram authentication payload expired': {
    uz: 'Telegram autentifikatsiya payload muddati tugagan',
    ru: 'Срок действия payload авторизации Telegram истёк',
    en: 'Telegram authentication payload expired',
  },
  'Telegram init data signature is invalid': {
    uz: "Telegram initData imzosi noto'g'ri",
    ru: 'Подпись Telegram initData неверна',
    en: 'Telegram init data signature is invalid',
  },
  'Telegram user payload is malformed': {
    uz: "Telegram foydalanuvchi payload noto'g'ri formatda",
    ru: 'Payload пользователя Telegram имеет неверный формат',
    en: 'Telegram user payload is malformed',
  },
  'Amount must be greater than zero': {
    uz: "Miqdor noldan katta bo'lishi kerak",
    ru: 'Сумма должна быть больше нуля',
    en: 'Amount must be greater than zero',
  },
  'Notification not found': {
    uz: 'Bildirishnoma topilmadi',
    ru: 'Уведомление не найдено',
    en: 'Notification not found',
  },
  'User account is inactive': {
    uz: 'Foydalanuvchi hisobi faol emas',
    ru: 'Аккаунт пользователя неактивен',
    en: 'User account is inactive',
  },
  'Insufficient role permissions': {
    uz: 'Rol huquqlari yetarli emas',
    ru: 'Недостаточно прав роли',
    en: 'Insufficient role permissions',
  },
  'Student is not in your assigned scope': {
    uz: 'Talaba sizning belgilangan doirangizda emas',
    ru: 'Студент не входит в вашу зону ответственности',
    en: 'Student is not in your assigned scope',
  },
  'Order is not in your assigned scope': {
    uz: 'Buyurtma sizning belgilangan doirangizda emas',
    ru: 'Заказ не входит в вашу зону ответственности',
    en: 'Order is not in your assigned scope',
  },
  'Staff user not found': {
    uz: 'Xodim foydalanuvchi topilmadi',
    ru: 'Пользователь-сотрудник не найден',
    en: 'Staff user not found',
  },
  'Staff assignment already exists': {
    uz: 'Xodim biriktirilishi allaqachon mavjud',
    ru: 'Назначение сотрудника уже существует',
    en: 'Staff assignment already exists',
  },
  'Staff assignment not found': {
    uz: 'Xodim biriktirilishi topilmadi',
    ru: 'Назначение сотрудника не найдено',
    en: 'Staff assignment not found',
  },
  'Group not found or does not belong to the given faculty': {
    uz: 'Guruh topilmadi yoki ko\'rsatilgan fakultetga tegishli emas',
    ru: 'Группа не найдена или не принадлежит указанному факультету',
    en: 'Group not found or does not belong to the given faculty',
  },
};

export function resolveLocale(header?: string | string[]): AppLocale {
  const raw = Array.isArray(header) ? header.join(',') : header ?? '';
  const tokens = raw
    .split(',')
    .map((item) => item.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('uz')) {
      return 'uz';
    }
    if (token.startsWith('ru')) {
      return 'ru';
    }
    if (token.startsWith('en')) {
      return 'en';
    }
  }

  return 'uz';
}

export function translateBackendMessage(
  message: string | string[],
  locale: AppLocale,
): string | string[] {
  if (Array.isArray(message)) {
    return message.map((item) => localizedMessages[item]?.[locale] ?? item);
  }

  return localizedMessages[message]?.[locale] ?? message;
}
