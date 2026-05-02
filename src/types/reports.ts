export type ReportStatus = 'DRAFT' | 'PUBLISHED';
export type SectionType = 'METRICS' | 'CHART' | 'TEXT';
export type ChartType = 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART';

export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  platform?: string;
  metricKeys?: string[];
  chartType?: ChartType;
  content?: string;
  order: number;
}

export interface Report {
  id: string;
  name: string;
  status: ReportStatus;
  sections: ReportSection[];
  campaignId: string;
  version: number;
  aiSummary?: string | null;
  aiSummaryGeneratedAt?: string | null;
  aiSummaryModel?: string | null;
  aiSummaryVersion?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  id: string;
  cronExpression: string;
  recipientEmails: string[];
  dateRangeDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  deliveredAt: string;
  recipientEmails: string[];
  status: string;
  errorMessage?: string;
}

export interface SharedReportData {
  report: {
    id: string;
    name: string;
    sections: ReportSection[];
    status: ReportStatus;
    pdfGeneratedAt: string | null;
    campaignId: string;
  };
  downloadUrl: string | null;
  linkExpiresAt: string | null;
}
