export type UserRole = 'STUDENT' | 'STAFF' | 'ROOT';
export type StudentStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';
export type CoinTransactionType = 'EARN' | 'DEDUCT' | 'RESERVE' | 'REFUND';
export type ShopOrderStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
export type NotificationType = 'INFO' | 'WARNING' | 'REWARD' | 'SHOP' | 'SYSTEM';

/** Localized text map returned from the API for DB content. */
export type I18nMap = Record<string, string>;

export interface Faculty {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Group {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  joinCode: string;
  coinBalance: number;
  isActive: boolean;
  createdAt: string;
  faculty?: Faculty;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  fullName: string;
  facultyId: string;
  groupId: string;
  status: StudentStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  joinedAt: string;
  faculty?: Faculty;
  group?: Group;
}

export interface StaffAssignment {
  id: string;
  userId: string;
  facultyId: string;
  groupId?: string | null;
  createdAt: string;
  faculty?: Faculty;
  group?: Group | null;
}

export interface User {
  id: string;
  telegramId?: string | null;
  username: string;
  email?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  studentProfile?: StudentProfile | null;
  staffAssignments?: StaffAssignment[];
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CoinTransactionType;
  reason: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  nameI18n?: I18nMap | null;
  descriptionI18n?: I18nMap | null;
  iconUrl?: string | null;
  requiredCoins: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  awardedBy?: string | null;
  note?: string | null;
  badge: Badge;
  awarder?: User | null;
}

export interface EventEntity {
  id: string;
  title: string;
  description: string;
  titleI18n?: I18nMap | null;
  descriptionI18n?: I18nMap | null;
  facultyId?: string | null;
  startAt: string;
  endAt?: string | null;
  createdBy: string;
  isPublished: boolean;
  coinsReward: number;
  createdAt: string;
  faculty?: Faculty | null;
  creator?: User;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  event?: EventEntity;
  user?: User;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  nameI18n?: I18nMap | null;
  descriptionI18n?: I18nMap | null;
  imageUrl?: string | null;
  coinCost: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  totalCost: number;
  status: ShopOrderStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  receivedAt?: string | null;
  item: ShopItem;
  user?: User;
  approver?: User | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleI18n?: I18nMap | null;
  body: string;
  bodyI18n?: I18nMap | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  actor?: User | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: User;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  titleI18n?: I18nMap | null;
  bodyI18n?: I18nMap | null;
  createdBy: string;
  facultyId?: string | null;
  groupId?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'username' | 'role'>;
}

export interface PaginatedTransactions {
  items: CoinTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AdminStats {
  users: number;
  studentsPending: number;
  activeOrders: number;
  coinsAwarded: number;
}
