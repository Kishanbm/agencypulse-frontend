export type NotificationType =
  | 'ALERT_TRIGGERED'
  | 'SYNC_FAILED'
  | 'SYNC_CONNECTED'
  | 'REPORT_READY'
  | 'INVITE_ACCEPTED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}
