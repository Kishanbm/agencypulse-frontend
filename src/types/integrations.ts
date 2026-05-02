export type IntegrationStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR"
  | "SYNCING";

export interface IntegrationConnection {
  id: string;
  platform: string;
  status: IntegrationStatus;
  externalAccountId: string | null;
  platformAccountType: string | null;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
