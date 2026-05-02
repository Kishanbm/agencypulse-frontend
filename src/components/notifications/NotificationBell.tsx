import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, CheckCheck, AlertTriangle, XCircle,
  CheckCircle2, FileText, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, API_BASE } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Notification, NotificationListResponse } from '@/types/notifications';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

// ─── Type → icon + colour ─────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ALERT_TRIGGERED: { icon: AlertTriangle,  color: '#d97706',  bg: 'rgba(245,165,36,0.10)'  },
  SYNC_FAILED:     { icon: XCircle,        color: '#f43f5e',  bg: 'rgba(244,63,94,0.10)'   },
  SYNC_CONNECTED:  { icon: CheckCircle2,   color: '#10D9A0',  bg: 'rgba(16,217,160,0.10)'  },
  REPORT_READY:    { icon: FileText,       color: '#5B47E0',  bg: 'rgba(91,71,224,0.10)'   },
  INVITE_ACCEPTED: { icon: UserCheck,      color: '#8B5CF6',  bg: 'rgba(139,92,246,0.10)'  },
};

// ─── Navigation ───────────────────────────────────────────────────────────────

function navTarget(type: string): string {
  switch (type) {
    case 'INVITE_ACCEPTED': return '/team';
    case 'SYNC_FAILED':
    case 'SYNC_CONNECTED':  return '/clients';
    default:                return '/clients';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen]     = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [, setTick]         = useState(0); // ticks every minute to refresh relative times

  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const abortRef      = useRef<AbortController | null>(null);
  const retryRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Refresh relative timestamps every minute
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ─── Data ──────────────────────────────────────────────────────────────────

  const { data } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', 'list'],
    queryFn: () => api.get('/notifications?limit=20').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000, // baseline polling as SSE fallback
  });

  const unreadCount = data?.unreadCount ?? 0;
  const items       = data?.items ?? [];
  const badgeLabel  = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  // ─── SSE ───────────────────────────────────────────────────────────────────

  const connectSSE = useCallback(() => {
    if (!token) return;
    abortRef.current?.abort();
    if (retryRef.current) clearTimeout(retryRef.current);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('SSE response invalid');

        retryCountRef.current = 0; // reset backoff on successful connection

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.replace('data:', '').trim();
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === 'HEARTBEAT' || parsed.type === 'CONNECTED') continue;
              // Real notification arrived — refresh list + pulse bell
              qc.invalidateQueries({ queryKey: ['notifications'] });
              setHasNew(true);
              setTimeout(() => setHasNew(false), 2000);
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // intentional disconnect
        // Exponential backoff: 5s → 7.5s → 11s … capped at 30s
        const delay = Math.min(5000 * Math.pow(1.5, retryCountRef.current), 30_000);
        retryCountRef.current++;
        retryRef.current = setTimeout(connectSSE, delay);
      }
    })();
  }, [token, qc]);

  useEffect(() => {
    connectSSE();
    return () => {
      abortRef.current?.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connectSSE]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async function handleMarkRead(n: Notification) {
    if (n.isRead) return;
    // Optimistic update
    qc.setQueryData<NotificationListResponse>(['notifications', 'list'], (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          item.id === n.id ? { ...item, isRead: true } : item,
        ),
        unreadCount: Math.max(0, old.unreadCount - 1),
      };
    });
    try {
      await api.patch(`/notifications/${n.id}/read`);
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function handleMarkAllRead() {
    // Optimistic update
    qc.setQueryData<NotificationListResponse>(['notifications', 'list'], (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      };
    });
    try {
      await api.post('/notifications/read-all');
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  function handleItemClick(n: Notification) {
    handleMarkRead(n);
    setOpen(false);
    navigate(navTarget(n.type));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div
          className={cn(
            'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-all',
            hasNew && 'scale-110',
          )}
          style={{
            background: open ? 'rgba(91,71,224,0.10)' : 'transparent',
            border: '1px solid #ECECE6',
          }}
          aria-label="Notifications"
          onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          <Bell
            className={cn(
              'h-4 w-4 transition-transform',
              hasNew && 'animate-bounce',
            )}
          />
          {badgeLabel && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white" style={{ background: '#f43f5e' }}>
              {badgeLabel}
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="p-0"
        sideOffset={8}
        style={{
          width: 'min(340px, calc(100vw - 16px))',
          maxHeight: 'min(480px, calc(100dvh - 80px))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #ECECE6' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="size-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(91,71,224,0.10)' }}
            >
              <Bell className="size-3" style={{ color: '#5B47E0' }} />
            </div>
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span
                className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: '#f43f5e' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: '#5B47E0' }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">You're all caught up</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            <div className="divide-y">
              {items.map((n) => {
                const meta = TYPE_META[n.type] ?? {
                  icon: Bell,
                  color: '#6b7280',
                  bg: 'rgba(107,114,128,0.10)',
                };
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    style={!n.isRead ? { background: 'rgba(91,71,224,0.03)' } : undefined}
                  >
                    <div
                      className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg }}
                    >
                      <Icon className="size-4" style={{ color: meta.color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm',
                          n.isRead
                            ? 'text-muted-foreground'
                            : 'font-semibold text-foreground',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <div
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: '#5B47E0' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
