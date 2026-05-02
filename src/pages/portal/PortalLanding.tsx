import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ArrowRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { useBranding } from '@/contexts/BrandingContext';
import { useAuthStore } from '@/lib/store';

interface PortalClient {
  id: string;
  name: string;
  logoUrl: string | null;
  status: string;
  _count?: { campaigns: number };
}

export function PortalLanding() {
  const navigate  = useNavigate();
  const { branding } = useBranding();
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const { data: clients, isLoading } = useQuery<PortalClient[]>({
    queryKey: ['portal', 'clients'],
    queryFn:  () => api.get('/clients').then((r) => r.data?.items ?? r.data?.data ?? r.data),
    staleTime: 120_000,
  });

  useEffect(() => {
    if (clients && clients.length === 1) {
      navigate(`/portal/${clients[0].id}`, { replace: true });
    }
  }, [clients, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-8 p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-16 rounded-2xl bg-muted animate-pulse" />
          <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mx-auto">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-4 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
        >
          <div className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(91,71,224,0.08)' }}>
            <Building2 className="size-8" style={{ color: '#5B47E0' }} />
          </div>
          <p className="text-base font-semibold text-foreground">No clients assigned</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact {branding.agencyName} to get access to your dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="text-center space-y-4"
        >
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.agencyName}
              className="mx-auto size-16 rounded-2xl object-cover"
              style={{ border: '1px solid #ECECE6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
          ) : (
            <div
              className="mx-auto size-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: '0 4px 16px rgba(91,71,224,0.25)' }}
            >
              {branding.agencyName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a client to view your performance dashboard.
            </p>
          </div>
        </motion.div>

        {/* Client cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {clients.map((client, i) => (
              <motion.button
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" as const }}
                onClick={() => navigate(`/portal/${client.id}`)}
                className="group bg-white rounded-2xl overflow-hidden text-left transition-shadow hover:shadow-lg"
                style={{ border: '1px solid #ECECE6' }}
              >
                <div className="h-0.5 w-full transition-all" style={{ background: 'linear-gradient(90deg,#5B47E0,#10D9A0)' }} />
                <div className="px-5 py-4 flex items-center gap-4">
                  {client.logoUrl ? (
                    <img
                      src={client.logoUrl}
                      alt={client.name}
                      className="size-11 rounded-xl object-cover shrink-0"
                      style={{ border: '1px solid #ECECE6' }}
                    />
                  ) : (
                    <div
                      className="size-11 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate text-sm">{client.name}</p>
                    {client._count?.campaigns !== undefined && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Layers className="size-3" />
                        {client._count.campaigns} campaign{client._count.campaigns !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div
                    className="size-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5"
                    style={{ background: 'rgba(91,71,224,0.08)' }}
                  >
                    <ArrowRight className="size-4" style={{ color: '#5B47E0' }} />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
