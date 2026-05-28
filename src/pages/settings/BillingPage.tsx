import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertTriangle, CreditCard, Users, Building2,
  Zap, Star, Info, Loader2, Crown, Sparkles, Receipt
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { useRole } from '@/hooks/useRole';
import { hasRole } from '@/lib/rbac';
import type { BillingStatus, AgencyPlan } from '@/types/billing';
import { PLAN_LABELS } from '@/types/billing';

const PLAN_ORDER: AgencyPlan[] = ['FREELANCER', 'AGENCY', 'AGENCY_PRO'];

const PLAN_FEATURES: Record<AgencyPlan, string[]> = {
  FREELANCER: [
    '2 clients', '1 staff member', '2 integrations per campaign',
    'Dashboards & reports', 'Email support',
  ],
  AGENCY: [
    '20 clients', '10 staff members', '10 integrations per campaign',
    'Dashboards & reports', 'Custom KPIs & templates',
    'White-label branding', 'Priority support',
  ],
  AGENCY_PRO: [
    'Unlimited clients', 'Unlimited staff', 'Unlimited integrations',
    'Dashboards & reports', 'Custom KPIs & templates',
    'White-label branding', 'AI assistant & insights', 'Dedicated support',
  ],
};

const PLAN_META: Record<AgencyPlan, { price: number; gradient: string; accentColor: string }> = {
  FREELANCER: { price: 0,   gradient: 'linear-gradient(135deg,#64748b,#94a3b8)', accentColor: '#64748b' },
  AGENCY:     { price: 79,  gradient: 'linear-gradient(135deg,#5B47E0,#8B5CF6)', accentColor: '#5B47E0' },
  AGENCY_PRO: { price: 179, gradient: 'linear-gradient(135deg,#FF7A59,#F5A524)', accentColor: '#FF7A59' },
};

function formatLimit(val: number | null): string {
  return val === null ? 'Unlimited' : String(val);
}

function trialDaysLeft(trialEndsAt: string): number {
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function UsageMeter({ label, icon: Icon, current, max, color = '#5B47E0' }: {
  label: string; icon: React.ElementType; current: number; max: number | null; color?: string;
}) {
  const unlimited = max === null;
  const overLimit = !unlimited && current > max!;
  const pct = unlimited ? 0 : Math.min((current / max!) * 100, 100);
  const barColor = overLimit ? '#f43f5e' : color;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider">
          <Icon className="size-3" />
          {label}
        </span>
        <span className="font-bold tabular" style={{ color: overLimit ? '#f43f5e' : 'inherit' }}>
          {unlimited ? (
            <span style={{ color: '#0f172a' }}>Unlimited</span>
          ) : (
            `${current} / ${max}`
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full bg-slate-100 overflow-hidden" style={{ borderRadius: 0 }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, current, status, isOwner, onUpgrade, onManage, upgrading }: {
  plan: AgencyPlan; current: AgencyPlan; status: string; isOwner: boolean;
  onUpgrade: (plan: AgencyPlan) => void; onManage: () => void; upgrading: AgencyPlan | null;
}) {
  const isCurrent = plan === current;
  const isPro = plan === 'AGENCY_PRO';
  const isFree = plan === 'FREELANCER';
  const meta = PLAN_META[plan];
  const planOrder: Record<AgencyPlan, number> = { FREELANCER: 0, AGENCY: 1, AGENCY_PRO: 2 };
  const isDowngrade = planOrder[plan] < planOrder[current];
  const isUpgrade = planOrder[plan] > planOrder[current];
  const canUpgrade = isOwner && isUpgrade;
  const isLoadingThis = upgrading === plan;

  return (
    <div
      className="relative flex flex-col bg-white overflow-hidden transition-all duration-300"
      style={{
        border: isCurrent ? `2px solid ${meta.accentColor}` : '1px solid #ECECE6',
        borderRadius: 0,
        boxShadow: isCurrent 
          ? `0 2px 8px -2px rgba(0,0,0,0.05), 0 20px 40px -10px ${meta.accentColor}50` 
          : '0 2px 8px -2px rgba(0,0,0,0.05), 0 16px 32px -4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Top Banner indicating Current or Pro */}
      {isCurrent ? (
        <div className="text-white text-[10px] font-bold uppercase tracking-wider text-center py-2 flex justify-center items-center gap-1.5" style={{ background: meta.accentColor }}>
          <CheckCircle2 className="size-3" /> Current Plan
        </div>
      ) : isPro ? (
        <div className="text-white text-[10px] font-bold uppercase tracking-wider text-center py-2 flex justify-center items-center gap-1.5" style={{ background: meta.gradient }}>
          <Crown className="size-3" /> Professional
        </div>
      ) : (
        <div className="h-2 w-full" style={{ background: meta.gradient }} />
      )}

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="mb-6">
          <h3 className="font-heading font-bold text-lg text-slate-900">{PLAN_LABELS[plan]}</h3>
          <div className="mt-2 flex items-baseline gap-1">
            {isFree ? (
              <span className="font-heading font-bold text-4xl text-slate-900">Free</span>
            ) : (
              <>
                <span className="font-heading font-bold text-4xl" style={{ color: meta.accentColor }}>
                  ${meta.price}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">/month</span>
              </>
            )}
          </div>
        </div>

        <ul className="mb-8 flex-1 space-y-3">
          {PLAN_FEATURES[plan].map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: meta.accentColor }} />
              {f}
            </li>
          ))}
        </ul>

        {isCurrent ? (
          (status === 'active' || status === 'trialing') && !isFree ? (
            <button
              onClick={onManage}
              className="w-full h-10 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${meta.accentColor}`, color: meta.accentColor, borderRadius: 0 }}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              className="w-full h-10 text-sm font-bold cursor-default bg-slate-100 text-slate-500"
              style={{ borderRadius: 0 }}
              disabled
            >
              Current Plan
            </button>
          )
        ) : canUpgrade ? (
          <button
            onClick={() => onUpgrade(plan)}
            disabled={isLoadingThis}
            className="w-full h-10 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: meta.gradient, borderRadius: 0 }}
          >
            {isLoadingThis && <Loader2 className="size-4 animate-spin" />}
            {isLoadingThis ? 'Redirecting…' : `Upgrade to ${PLAN_LABELS[plan]}`}
          </button>
        ) : isDowngrade ? (
          <button
            title="Manage your subscription in the Stripe portal to downgrade"
            className="w-full h-10 text-sm font-bold cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200"
            style={{ borderRadius: 0 }}
            disabled
          >
            Downgrade
          </button>
        ) : (
          <button
            title="Only the agency owner can manage billing"
            className="w-full h-10 text-sm font-bold cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200"
            style={{ borderRadius: 0 }}
            disabled
          >
            {isUpgrade ? `Upgrade to ${PLAN_LABELS[plan]}` : 'Current Plan'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const role = useRole();
  const isOwner = hasRole(role, 'AGENCY_OWNER');
  const [upgrading, setUpgrading] = useState<AgencyPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data, isLoading, isError, error } = useQuery<BillingStatus>({
    queryKey: ['billing', 'status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data),
    staleTime: 60_000,
  });

  const stripeNotConfigured =
    isError && (error as { response?: { status?: number } })?.response?.status === 500;

  async function handleUpgrade(plan: AgencyPlan) {
    if (upgrading) return;
    setUpgrading(plan);
    try {
      const { data: res } = await api.post<{ checkoutUrl: string }>('/billing/checkout', { plan });
      window.location.href = res.checkoutUrl;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Could not start checkout. Try again.'));
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { data: res } = await api.post<{ portalUrl: string }>('/billing/portal');
      window.location.href = res.portalUrl;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Could not open billing portal.'));
      setPortalLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 w-full flex flex-col">
        <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
          <div className="h-8 bg-slate-100 animate-pulse w-64 mb-4" />
          <div className="h-4 bg-slate-100 animate-pulse w-96" />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-100 animate-pulse w-full border border-slate-200" />
            <div className="h-48 bg-slate-100 animate-pulse w-full border border-slate-200" />
          </div>
          <div className="h-96 bg-slate-100 animate-pulse w-full border border-slate-200" />
        </div>
      </div>
    );
  }

  if (stripeNotConfigured || isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 w-full flex flex-col">
        <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="size-8 text-slate-800" />
            Billing & Plan
          </h1>
          <p className="text-slate-500 mt-2 text-lg max-w-2xl">Manage your subscription and usage.</p>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold text-sm text-red-900">
                {stripeNotConfigured ? 'Billing not configured' : 'Failed to load billing'}
              </p>
              <p className="mt-0.5 text-sm text-red-700">
                {stripeNotConfigured
                  ? 'Stripe has not been set up for this environment. Contact your system administrator to enable billing.'
                  : 'Failed to load billing information. Please refresh the page.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { plan, subscriptionStatus, trialEndsAt, limits, usage } = data;
  const isTrialing = subscriptionStatus === 'trialing' && trialEndsAt;
  const daysLeft = isTrialing ? trialDaysLeft(trialEndsAt!) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 w-full flex flex-col">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 py-10">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight flex items-center gap-3">
                <Receipt className="size-8 text-slate-800" />
                Billing & Plan
              </h1>
              <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                Manage your subscription, view current limits, and access your billing portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Trial banner */}
        {isTrialing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="p-5 flex items-start gap-4 flex-wrap shadow-sm"
            style={{ 
              background: daysLeft <= 3 ? '#fef2f2' : '#f8fafc', 
              border: daysLeft <= 3 ? '1px solid #fca5a5' : '1px solid #cbd5e1',
              borderRadius: 0
            }}
          >
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0"
              style={{ color: daysLeft <= 3 ? '#ef4444' : '#64748b' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900">
                Trial ends in <span className="font-extrabold">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                Upgrade now to keep access to all Agency features after your trial ends.
              </p>
            </div>
            {isOwner && (
              <button
                disabled={upgrading === 'AGENCY'}
                onClick={() => handleUpgrade('AGENCY')}
                className="inline-flex items-center gap-2 px-5 h-10 text-sm font-bold text-white shrink-0 disabled:opacity-60 bg-slate-900 hover:bg-slate-800 transition-colors"
                style={{ borderRadius: 0 }}
              >
                {upgrading === 'AGENCY' && <Loader2 className="size-4 animate-spin" />}
                Upgrade Now
              </button>
            )}
          </motion.div>
        )}

        {/* Current plan + usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Current plan card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
            className="bg-white"
            style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05), 0 16px 32px -4px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-[#ECECE6]">
              <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-slate-800" />
                Current Plan
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="font-heading font-bold text-3xl text-slate-900">{PLAN_LABELS[plan]}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border"
                  style={subscriptionStatus === 'active'
                    ? { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', borderRadius: 0 }
                    : subscriptionStatus === 'trialing'
                    ? { background: '#f8fafc', color: '#334155', borderColor: '#e2e8f0', borderRadius: 0 }
                    : { background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca', borderRadius: 0 }
                  }
                >
                  {subscriptionStatus === 'trialing' ? 'Trial' : subscriptionStatus}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
                {plan === 'FREELANCER' ? 'Free forever' : plan === 'AGENCY' ? '$79 / month' : '$179 / month'}
              </p>
              
              {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing') &&
                plan !== 'FREELANCER' && isOwner && (
                <button
                  disabled={portalLoading}
                  onClick={handlePortal}
                  className="inline-flex items-center justify-center gap-2 px-5 h-10 w-full md:w-auto text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ borderRadius: 0, border: `1px solid ${PLAN_META[plan]?.accentColor || '#0f172a'}`, color: PLAN_META[plan]?.accentColor || '#0f172a' }}
                >
                  {portalLoading && <Loader2 className="size-4 animate-spin" />}
                  {portalLoading ? 'Opening Portal…' : 'Manage Subscription'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Usage card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="bg-white"
            style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05), 0 16px 32px -4px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-[#ECECE6]">
              <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <Zap className="size-4 text-slate-800" />
                Usage Limits
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="space-y-6">
                <UsageMeter label="Clients" icon={Building2} current={usage.clients} max={limits.maxClients} />
                <UsageMeter label="Staff members" icon={Users} current={usage.staff} max={limits.maxStaff} />
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Integrations per campaign</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 text-xs">
                    {formatLimit(limits.maxIntegrationsPerCampaign)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Plan comparison */}
        <div className="pt-10">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
              <Sparkles className="size-6 text-slate-800" />
              Available Plans
            </h2>
            <p className="text-slate-500 mt-2 text-base">Select the plan that fits your agency's scale and needs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PLAN_ORDER.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                className="h-full"
              >
                <PlanCard
                  plan={p}
                  current={plan}
                  status={subscriptionStatus}
                  isOwner={isOwner}
                  onUpgrade={handleUpgrade}
                  onManage={handlePortal}
                  upgrading={upgrading}
                />
              </motion.div>
            ))}
          </div>

          {!isOwner && (
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Info className="size-5 shrink-0 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">
                Only the agency owner can upgrade or manage the subscription.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
