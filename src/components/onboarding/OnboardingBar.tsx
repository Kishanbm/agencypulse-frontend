import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';

interface OnboardingStatus {
  hasClient: boolean;
  hasIntegration: boolean;
  hasDashboard: boolean;
  hasLogo: boolean;
  isComplete: boolean;
}

const LS_DISMISSED = 'agencypulse-onboarding-dismissed';
const LS_EXPANDED  = 'agencypulse-onboarding-expanded';

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === 'true' ? true : v === 'false' ? false : fallback;
  } catch { return fallback; }
}

export function OnboardingBar() {
  const [dismissed, setDismissed] = useState(() => readBool(LS_DISMISSED, false));
  const [expanded, setExpanded]   = useState(() => readBool(LS_EXPANDED, false));

  const { data: status } = useQuery<OnboardingStatus>({
    queryKey: ['agencies', 'me', 'onboarding'],
    queryFn: () => api.get<OnboardingStatus>('/agencies/me/onboarding').then(r => r.data),
    staleTime: 10_000,
  });

  if (!status || status.isComplete || dismissed) return null;

  const steps = [
    { done: true,                  label: 'Create account' },
    { done: status.hasClient,      label: 'Add first client' },
    { done: status.hasIntegration, label: 'Connect integration' },
    { done: status.hasDashboard,   label: 'Create dashboard' },
    { done: status.hasLogo,        label: 'Upload agency logo' },
  ];

  const completedCount  = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(LS_DISMISSED, 'true'); } catch { /* */ }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem(LS_EXPANDED, String(next)); } catch { /* */ }
  }

  return (
    <div style={{ borderTop: '1px solid #ECECE6', background: '#fff' }}>

      {/* ── Step cards — expand upward from the strip ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="checklist"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderBottom: '1px solid #ECECE6' }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-4">
              <StepCard
                done={status.hasClient}
                title="Add First Client"
                desc="Create a workspace for a client to house their data and reports."
                to="/clients"
                cta="Go to Clients"
              />
              <StepCard
                done={status.hasIntegration}
                title="Connect Integration"
                desc="Link data sources to pull real-time metrics into dashboards."
                to="/clients"
                cta="Connect sources"
              />
              <StepCard
                done={status.hasDashboard}
                title="Create Dashboard"
                desc="Build a live analytics dashboard using pre-made templates."
                to="/clients"
                cta="Build dashboard"
              />
              <StepCard
                done={status.hasLogo}
                title="Upload Agency Logo"
                desc="White-label the platform with your agency's logo and brand colors."
                to="/settings/branding"
                cta="Go to Settings"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collapsed strip — always visible at bottom ── */}
      <div
        className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none"
        onClick={toggle}
      >
        <Rocket className="size-3.5 shrink-0" style={{ color: '#5B47E0' }} />
        <span className="text-xs font-semibold text-foreground">Setup guide</span>

        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#ECECE6', maxWidth: 160 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg,#5B47E0,#7C6FF7)' }}
          />
        </div>
        <span className="text-[11px] font-semibold" style={{ color: '#5B47E0' }}>
          {completedCount}/{steps.length}
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ done, title, desc, to, cta }: {
  done: boolean; title: string; desc: string; to: string; cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 p-3 rounded-xl transition-all"
      style={{
        border: done ? '1px solid rgba(16,217,160,0.30)' : '1px solid #ECECE6',
        background: done ? 'rgba(16,217,160,0.03)' : '#FAFAF7',
        pointerEvents: done ? 'none' : 'auto',
      }}
    >
      <div className="flex items-center gap-2">
        {done
          ? <CheckCircle2 className="size-4 shrink-0" style={{ color: '#10D9A0' }} />
          : <Circle className="size-4 shrink-0 text-muted-foreground group-hover:text-[#5B47E0] transition-colors" />
        }
        <span className="text-xs font-semibold text-foreground leading-tight">{title}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
      {!done && (
        <span className="text-[11px] font-semibold mt-auto" style={{ color: '#5B47E0' }}>
          {cta} →
        </span>
      )}
    </Link>
  );
}
