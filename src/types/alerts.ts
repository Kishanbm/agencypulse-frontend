export type AlertCondition =
  | 'ABOVE'
  | 'BELOW'
  | 'PERCENT_CHANGE_ABOVE'
  | 'PERCENT_CHANGE_BELOW';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertPeriodType = 'DAILY' | 'WEEKLY';

export interface Alert {
  id: string;
  name: string;
  platform: string;
  metricKey: string;
  condition: AlertCondition;
  threshold: number;
  periodType: AlertPeriodType;
  severity: AlertSeverity;
  recipientEmails: string[];
  cooldownHours: number | null;
  isActive: boolean;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  firedAt: string;
  value: number;
  threshold: number;
  message?: string;
}
