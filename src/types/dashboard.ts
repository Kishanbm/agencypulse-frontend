export type WidgetType = 'KPI' | 'LINE_CHART' | 'BAR_CHART' | 'TABLE' | 'PIE_CHART';
export type IntegrationPlatform =
  | 'GA4'
  | 'GOOGLE_ADS'
  | 'META_ADS'
  | 'GOOGLE_SEARCH_CONSOLE'
  | 'YOUTUBE_ANALYTICS'
  | 'LINKEDIN_ADS'
  | 'TIKTOK_ADS'
  | 'AMAZON_ADS'
  | 'GOOGLE_SHEETS'
  | 'GOOGLE_BIGQUERY';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  title: string;
  aggregation?: 'sum' | 'avg' | 'last';
  comparison?: 'previous_period' | 'previous_year' | 'none';
  filters?: {
    device?: string;
    country?: string;
  };
  headerColor?: string;
  headerTextColor?: string;
  bodyColor?: string;
  bodyTextColor?: string;
  chartColors?: string[];
  // Google Sheets — per-widget spreadsheet configuration
  spreadsheetId?: string;
  spreadsheetName?: string;
  sheetName?: string;
  dateColumn?: string;
  metricColumn?: string;
  dimensionColumn?: string;
  // Google BigQuery — per-widget SQL query
  sqlQuery?: string;
}

export interface DashboardWidget {
  id: string;
  widgetType: WidgetType;
  platform?: IntegrationPlatform;
  metricKeys: string[];
  config: WidgetConfig;
  position: WidgetPosition;
}

export interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
}
