import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { Client } from '../overview.types';

// Cycling gradient pairs for client avatars
const CLIENT_GRADIENTS = [
  'linear-gradient(135deg, #5B47E0, #8B5CF6)',
  'linear-gradient(135deg, #FF7A59, #FF9A76)',
  'linear-gradient(135deg, #10D9A0, #34d399)',
  'linear-gradient(135deg, #F5A524, #fbbf24)',
  'linear-gradient(135deg, #5B47E0, #FF7A59)',
  'linear-gradient(135deg, #10D9A0, #5B47E0)',
  'linear-gradient(135deg, #FF7A59, #F5A524)',
  'linear-gradient(135deg, #8B5CF6, #10D9A0)',
];

export function OverviewClients() {
  const navigate = useNavigate();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients', 'list'],
    queryFn:  () => api.get('/clients?limit=50').then((r) => r.data?.data ?? r.data?.items ?? r.data),
    staleTime: 120_000,
  });

  const visible = (clients ?? []).slice(0, 8);

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECECE6' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
        <div className="flex items-center gap-2">
          <div
            className="size-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(91,71,224,0.10)' }}
          >
            <Users className="size-3.5" style={{ color: '#5B47E0' }} />
          </div>
          <h3 className="font-heading font-semibold text-sm">Clients</h3>
          {(clients ?? []).length > 0 && (
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(91,71,224,0.08)', color: '#5B47E0' }}
            >
              {(clients ?? []).filter((c) => c.status === 'ACTIVE').length} active
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
          style={{ color: '#5B47E0' }}
        >
          View all <ArrowRight className="size-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4">
              <div className="size-10 animate-pulse rounded-2xl bg-muted" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 size-10 text-muted-foreground/20" />
          <p className="text-sm font-medium text-foreground">No clients yet</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-3 inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ border: '1px solid #ECECE6', color: '#5B47E0' }}
          >
            Add your first client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {visible.map((client, i) => {
            const gradientBg = CLIENT_GRADIENTS[i % CLIENT_GRADIENTS.length];
            return (
              <motion.button
                key={client.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex flex-col items-center gap-2 p-4 text-center border-r border-b last:border-r-0 hover:bg-muted/20 transition-colors"
                style={{ borderColor: '#ECECE6' }}
              >
                <div
                  className="size-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                  style={{ background: gradientBg }}
                >
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 w-full">
                  <p className="truncate text-xs font-medium text-foreground">{client.name}</p>
                  <p
                    className="text-[10px] mt-0.5 font-medium"
                    style={{ color: client.status === 'ACTIVE' ? '#10D9A0' : '#9CA3AF' }}
                  >
                    {client.status === 'ACTIVE' ? 'Active' : client.status?.toLowerCase()}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
