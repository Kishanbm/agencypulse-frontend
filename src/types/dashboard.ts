export type WidgetType = 'KPI' | 'LINE_CHART' | 'BAR_CHART' | 'TABLE' | 'PIE_CHART';
export type IntegrationPlatform = 'GA4' | 'GOOGLE_ADS' | 'META_ADS' | 'GOOGLE_SEARCH_CONSOLE' | 'LINKEDIN_ADS' | 'MAILCHIMP' | 'SHOPIFY';

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
