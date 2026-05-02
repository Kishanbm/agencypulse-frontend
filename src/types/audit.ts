export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'CONNECT'
  | 'DISCONNECT'
  | 'GENERATE'
  | 'INVITE'
  | 'REVOKE';

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
