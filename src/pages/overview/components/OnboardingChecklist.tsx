import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Users, Zap, LayoutDashboard, Settings, ChevronRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';

export interface OnboardingStatus {
  hasClient: boolean;
  hasIntegration: boolean;
  hasDashboard: boolean;
  hasLogo: boolean;
  isComplete: boolean;
}

export function OnboardingChecklist({ agencyInterests }: { agencyInterests?: string[] }) {
  const [dismissed, setDismissed] = useState(false);

  const { data: status, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ['agencies', 'me', 'onboarding'],
    queryFn: () => api.get<OnboardingStatus>('/agencies/me/onboarding').then(r => r.data),
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="h-48 rounded-2xl bg-muted animate-pulse" />
    );
  }

  if (!status || status.isComplete || dismissed) {
    return null; // Don't render anything if complete or dismissed
  }

  // Calculate progress
  const steps = [
    { completed: true, label: "Create Agency Account" }, // Implicitly true
    { completed: status.hasClient, label: "Create your first Client" },
    { completed: status.hasIntegration, label: "Connect an Integration" },
    { completed: status.hasDashboard, label: "Create a Dashboard" },
    { completed: status.hasLogo, label: "Upload your Agency Logo" }
  ];
  
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Dynamic intent-based tailoring
  const preferredIntegration = agencyInterests && agencyInterests.length > 0 
    ? `${agencyInterests[0]} integrations`
    : 'integrations';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl overflow-hidden relative mb-6"
        style={{ border: '1px solid #ECECE6' }}
      >
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:bg-slate-50 hover:text-foreground rounded-lg transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="p-5 lg:p-6">
          <div className="max-w-2xl">
            <h2 className="font-heading font-bold text-xl tracking-tight text-foreground">
              Welcome to AgencyPulse!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete these quick steps to set up your agency portal and wow your clients.
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5B47E0] transition-all duration-700 ease-out rounded-full" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <span className="text-sm font-semibold text-foreground">{progressPercent}% complete</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Step 1: Create Client */}
            <Link 
              to="/clients" 
              className="group flex flex-col p-4 rounded-xl transition-all"
              style={{ 
                border: status.hasClient ? '1px solid rgba(16,217,160,0.3)' : '1px solid #ECECE6',
                background: status.hasClient ? 'rgba(16,217,160,0.03)' : 'white' 
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {status.hasClient 
                  ? <CheckCircle2 className="size-5 text-[#10D9A0]" />
                  : <Circle className="size-5 text-muted-foreground group-hover:text-[#5B47E0] transition-colors" />
                }
                <span className={`font-semibold text-sm ${status.hasClient ? 'text-foreground' : 'text-foreground'}`}>
                  Add First Client
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                Create a dedicated workspace for a client to house their data and reports.
              </p>
              {!status.hasClient && (
                <div className="flex items-center text-[#5B47E0] text-xs font-semibold group-hover:underline">
                  Go to Clients <ChevronRight className="size-3 ml-0.5" />
                </div>
              )}
            </Link>

            {/* Step 2: Connect Integration */}
            <Link 
              to="/clients" 
              className="group flex flex-col p-4 rounded-xl transition-all"
              style={{ 
                border: status.hasIntegration ? '1px solid rgba(16,217,160,0.3)' : '1px solid #ECECE6',
                background: status.hasIntegration ? 'rgba(16,217,160,0.03)' : 'white' 
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {status.hasIntegration 
                  ? <CheckCircle2 className="size-5 text-[#10D9A0]" />
                  : <Circle className="size-5 text-muted-foreground group-hover:text-[#5B47E0] transition-colors" />
                }
                <span className="font-semibold text-sm text-foreground">Connect {preferredIntegration}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                Link data sources to pull real-time metrics into your dashboards.
              </p>
              {!status.hasIntegration && (
                <div className="flex items-center text-[#5B47E0] text-xs font-semibold group-hover:underline">
                  Connect sources <ChevronRight className="size-3 ml-0.5" />
                </div>
              )}
            </Link>

            {/* Step 3: Create Dashboard */}
            <Link 
              to="/clients" 
              className="group flex flex-col p-4 rounded-xl transition-all"
              style={{ 
                border: status.hasDashboard ? '1px solid rgba(16,217,160,0.3)' : '1px solid #ECECE6',
                background: status.hasDashboard ? 'rgba(16,217,160,0.03)' : 'white' 
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {status.hasDashboard 
                  ? <CheckCircle2 className="size-5 text-[#10D9A0]" />
                  : <Circle className="size-5 text-muted-foreground group-hover:text-[#5B47E0] transition-colors" />
                }
                <span className="font-semibold text-sm text-foreground">Create Dashboard</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                Build a live analytics dashboard using one of our beautiful pre-made templates.
              </p>
              {!status.hasDashboard && (
                <div className="flex items-center text-[#5B47E0] text-xs font-semibold group-hover:underline">
                  Build dashboard <ChevronRight className="size-3 ml-0.5" />
                </div>
              )}
            </Link>

            {/* Step 4: White-label */}
            <Link 
              to="/settings" 
              className="group flex flex-col p-4 rounded-xl transition-all"
              style={{ 
                border: status.hasLogo ? '1px solid rgba(16,217,160,0.3)' : '1px solid #ECECE6',
                background: status.hasLogo ? 'rgba(16,217,160,0.03)' : 'white' 
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {status.hasLogo 
                  ? <CheckCircle2 className="size-5 text-[#10D9A0]" />
                  : <Circle className="size-5 text-muted-foreground group-hover:text-[#5B47E0] transition-colors" />
                }
                <span className="font-semibold text-sm text-foreground">Upload Agency Logo</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                White-label the platform by uploading your agency's logo and brand colors.
              </p>
              {!status.hasLogo && (
                <div className="flex items-center text-[#5B47E0] text-xs font-semibold group-hover:underline">
                  Go to Settings <ChevronRight className="size-3 ml-0.5" />
                </div>
              )}
            </Link>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
