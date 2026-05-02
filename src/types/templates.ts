export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  widgetCount: number;
  cloneCount: number;
  previewImageUrl?: string | null;
  createdAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sectionCount: number;
  cloneCount: number;
  previewImageUrl?: string | null;
  createdAt: string;
}

export interface CloneDashboardResponse {
  id: string;
  name: string;
  campaignId: string;
}

export interface CloneReportResponse {
  id: string;
  name: string;
  campaignId: string;
}
