import type { ElementType } from 'react';

export interface MetricWithDelta {
  value: number;
  prior: number | null;
  delta: number | null;
}

export interface AgencyMetricsSummaryResult {
  metrics: Record<string, MetricWithDelta>;
  period: { from: string; to: string };
  priorPeriod: { from: string; to: string };
}

export interface CampaignRankingItem {
  campaignId: string;
  campaignName: string;
  clientId: string;
  clientName: string;
  value: number;
  priorValue: number | null;
  delta: number | null;
}

export interface AgencyHealthSummary {
  totalCampaigns: number;
  totalIntegrations: number;
  connected: number;
  expired: number;
  error: number;
  disconnected: number;
}

export interface AgencyHealthCampaign {
  campaignId: string;
  campaignName: string;
  clientName: string;
  connectedCount: number;
  expiredCount: number;
  errorCount: number;
}

export interface AgencyHealthResponse {
  summary: AgencyHealthSummary;
  campaigns: AgencyHealthCampaign[];
}

export interface Client {
  id: string;
  name: string;
  status: string;
  _count?: { campaigns: number };
}

export type InsightSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}
