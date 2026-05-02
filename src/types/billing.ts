export type AgencyPlan = 'FREELANCER' | 'AGENCY' | 'AGENCY_PRO';

// UI-only labels — backend enum values stay unchanged
export const PLAN_LABELS: Record<AgencyPlan, string> = {
  FREELANCER: 'Starter',
  AGENCY: 'Agency',
  AGENCY_PRO: 'Agency Pro',
};

export interface PlanLimits {
  maxClients: number | null;
  maxStaff: number | null;
  maxIntegrationsPerCampaign: number | null;
  monthlyPriceUsd: number;
  displayName: string;
}

export interface BillingStatus {
  plan: AgencyPlan;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  limits: PlanLimits;
  usage: {
    clients: number;
    staff: number;
  };
}
