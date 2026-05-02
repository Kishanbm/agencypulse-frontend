import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertTriangle, CreditCard, Users, Building2,
  Zap, Star, Info, Loader2, Crown,
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

function UsageMeter({ label, icon: Icon, current, max }: {
  label: string; icon: React.ElementType; current: number; max: number | null;
}) {
  const unlimited = max === null;
  const overLimit = !unlimited && current > max!;
  const pct = unlimited ? 0 : Math.min((current / max!) * 100, 100);
  const barColor = overLimit ? '#f43f5e' : pct > 80 ? '#F5A524' : '#5B47E0';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="font-bold tabular" style={{ color: overLimit ? '#f43f5e' : 'inherit' }}>
          {unlimited ? (
            <span style={{ color: '#10D9A0' }}>Unlimited</span>
          ) : (
            `${current} / ${max}`
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
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
  const isPopular = plan === 'AGENCY';
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
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: isCurrent
          ? `2px solid ${meta.accentColor}`
          : '1px solid #ECECE6',
        background: '#fff',
        boxShadow: isCurrent ? `0 8px 32px rgba(91,71,224,0.12)` : undefined,
      }}
    >
      {/* Top gradient strip */}
      <div className="h-1.5 w-full" style={{ background: meta.gradient }} />

      {/* Badge */}
      {(isCurrent || (isPopular && !isCurrent)) && (
        <div className="absolute top-4 right-4">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ background: isCurrent ? meta.accentColor : '#10D9A0' }}
          >
            {isCurrent ? <><CheckCircle2 className="size-2.5" />Current</> : <><Star className="size-2.5" />Popular</>}
          </span>
        </div>
      )}
      {isPro && !isCurrent && (
        <div className="absolute top-4 right-4">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#FF7A59,#F5A524)' }}
          >
            <Crown className="size-2.5" />Pro
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-bold text-base text-foreground">{PLAN_LABELS[plan]}</h3>
          <div className="mt-1 flex items-baseline gap-1">
            {isFree ? (
              <span className="font-heading font-bold text-3xl text-foreground">Free</span>
            ) : (
              <>
                <span className="font-heading font-bold text-3xl" style={{ color: meta.accentColor }}>
                  ${meta.price}
                </span>
                <span className="text-xs text-muted-foreground">/month</span>
              </>
            )}
          </div>
        </div>

        <ul className="mb-5 flex-1 space-y-2">
          {PLAN_FEATURES[plan].map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" style={{ color: meta.accentColor }} />
              {f}
            </li>
          ))}
        </ul>

        {isCurrent ? (
          (status === 'active' || status === 'trialing') && !isFree ? (
            <button
              onClick={onManage}
              className="w-full h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${meta.accentColor}`, color: meta.accentColor }}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              className="w-full h-9 rounded-xl text-xs font-semibold cursor-default opacity-60"
              style={{ border: '1px solid #ECECE6', color: '#9CA3AF' }}
              disabled
            >
              Current Plan
            </button>
          )
        ) : canUpgrade ? (
          <button
            onClick={() => onUpgrade(plan)}
            disabled={isLoadingThis}
            className="w-full h-9 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
            style={{ background: meta.gradient }}
          >
            {isLoadingThis && <Loader2 className="size-3.5 animate-spin" />}
            {isLoadingThis ? 'Redirecting…' : `Upgrade to ${PLAN_LABELS[plan]}`}
          </button>
        ) : isDowngrade ? (
          <button
            title="Manage your subscription in the Stripe portal to downgrade"
            className="w-full h-9 rounded-xl text-xs font-semibold cursor-not-allowed opacity-50"
            style={{ border: '1px solid #ECECE6', color: '#9CA3AF' }}
            disabled
          >
            Downgrade
          </button>
        ) : (
          <button
            title="Only the agency owner can manage billing"
            className="w-full h-9 rounded-xl text-xs font-semibold cursor-not-allowed opacity-50"
            style={{ border: '1px solid #ECECE6', color: '#9CA3AF' }}
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
      <div className="p-5 lg:p-7 space-y-4 max-w-5xl mx-auto">
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (stripeNotConfigured) {
    return (
      <div className="p-5 lg:p-7 max-w-2xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-6">Billing & Plan</h1>
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.25)' }}>
          <Info className="mt-0.5 size-5 shrink-0" style={{ color: '#d97706' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#d97706' }}>Billing not configured</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stripe has not been set up for this environment. Contact your system administrator to enable billing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-5 lg:p-7 max-w-2xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-6">Billing & Plan</h1>
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.20)' }}>
          <AlertTriangle className="mt-0.5 size-5 shrink-0" style={{ color: '#f43f5e' }} />
          <p className="text-sm text-muted-foreground">Failed to load billing information. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const { plan, subscriptionStatus, trialEndsAt, limits, usage } = data;
  const isTrialing = subscriptionStatus === 'trialing' && trialEndsAt;
  const daysLeft = isTrialing ? trialDaysLeft(trialEndsAt!) : 0;
  const planMeta = PLAN_META[plan];

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Billing & Plan</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Manage your subscription and usage.</p>
      </motion.div>

      {/* Trial banner */}
      {isTrialing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="rounded-2xl p-4 flex items-start gap-3 flex-wrap"
          style={daysLeft <= 3
            ? { background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.20)' }
            : { background: 'rgba(245,165,36,0.06)', border: '1px solid rgba(245,165,36,0.25)' }
          }
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0"
            style={{ color: daysLeft <= 3 ? '#f43f5e' : '#d97706' }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              Trial ends in <span className="font-bold">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upgrade now to keep access to all Agency features after your trial ends.
            </p>
          </div>
          {isOwner && (
            <button
              disabled={upgrading === 'AGENCY'}
              onClick={() => handleUpgrade('AGENCY')}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-bold text-white shrink-0 disabled:opacity-60"
              style={{ background: daysLeft <= 3 ? '#f43f5e' : 'linear-gradient(135deg,#111827,#1f2937)' }}
            >
              {upgrading === 'AGENCY' && <Loader2 className="size-3 animate-spin" />}
              Upgrade Now
            </button>
          )}
        </motion.div>
      )}

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Current plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="h-1 w-full" style={{ background: planMeta.gradient }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: `rgba(91,71,224,0.10)` }}
              >
                <CreditCard className="size-3.5" style={{ color: '#5B47E0' }} />
              </div>
              <span className="font-heading font-semibold text-sm">Current Plan</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-heading font-bold text-2xl text-foreground">{PLAN_LABELS[plan]}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={subscriptionStatus === 'active'
                  ? { background: 'rgba(16,217,160,0.12)', color: '#10D9A0' }
                  : subscriptionStatus === 'trialing'
                  ? { background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }
                  : { background: 'rgba(244,63,94,0.10)', color: '#f43f5e' }
                }
              >
                {subscriptionStatus === 'trialing' ? 'Trial' : subscriptionStatus}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {plan === 'FREELANCER' ? 'Free forever' : plan === 'AGENCY' ? '$79 / month' : '$179 / month'}
            </p>
            {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing') &&
              plan !== 'FREELANCER' && isOwner && (
              <button
                disabled={portalLoading}
                onClick={handlePortal}
                className="mt-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ border: `1px solid ${planMeta.accentColor}`, color: planMeta.accentColor }}
              >
                {portalLoading && <Loader2 className="size-3 animate-spin" />}
                {portalLoading ? 'Opening…' : 'Manage Subscription'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Usage card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg,#10D9A0,#5B47E0)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,217,160,0.10)' }}
              >
                <Zap className="size-3.5" style={{ color: '#10D9A0' }} />
              </div>
              <span className="font-heading font-semibold text-sm">Usage</span>
            </div>
            <div className="space-y-3">
              <UsageMeter label="Clients" icon={Building2} current={usage.clients} max={limits.maxClients} />
              <UsageMeter label="Staff members" icon={Users} current={usage.staff} max={limits.maxStaff} />
              <div className="text-xs text-muted-foreground">
                Integrations per campaign:{' '}
                <span className="font-semibold text-foreground">
                  {formatLimit(limits.maxIntegrationsPerCampaign)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="font-heading font-semibold text-sm text-foreground mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLAN_ORDER.map((p, i) => (
            <motion.div
              key={p}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease: "easeOut" as const }}
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
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Only the agency owner can upgrade or manage the subscription.
          </p>
        )}
      </div>
    </div>
  );
}
