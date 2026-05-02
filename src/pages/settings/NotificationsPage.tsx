import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, CheckCheck, AlertTriangle, XCircle,
  CheckCircle2, FileText, UserCheck, ChevronLeft, ChevronRight, Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
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

function absoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ALERT_TRIGGERED: { icon: AlertTriangle,  color: '#d97706',  bg: 'rgba(245,165,36,0.10)',  label: 'Alert'       },
  SYNC_FAILED:     { icon: XCircle,        color: '#f43f5e',  bg: 'rgba(244,63,94,0.10)',   label: 'Sync Failed' },
  SYNC_CONNECTED:  { icon: CheckCircle2,   color: '#10D9A0',  bg: 'rgba(16,217,160,0.10)',  label: 'Connected'   },
  REPORT_READY:    { icon: FileText,       color: '#5B47E0',  bg: 'rgba(91,71,224,0.10)',   label: 'Report'      },
  INVITE_ACCEPTED: { icon: UserCheck,      color: '#8B5CF6',  bg: 'rgba(139,92,246,0.10)',  label: 'Team'        },
};

type Tab = 'all' | 'unread';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab]           = useState<Tab>('all');
  const [page, setPage]         = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const qc                  = useQueryClient();
  const limit               = 30;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (tab === 'unread') params.set('isRead', 'false');

  const { data, isLoading } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', 'page', tab, page],
    queryFn: () => api.get(`/notifications?${params}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const items       = data?.items ?? [];
  const total       = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages  = Math.ceil(total / limit);

  const allSelected  = items.length > 0 && items.every((n) => selected.has(n.id));
  const someSelected = selected.size > 0;

  function switchTab(t: Tab) {
    setTab(t);
    setPage(1);
    setSelected(new Set());
    setSelectMode(false);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((n) => n.id)));
    }
  }

  async function handleMarkRead(n: Notification) {
    if (n.isRead) return;
    qc.setQueryData<NotificationListResponse>(
      ['notifications', 'page', tab, page],
      (old) => old
        ? { ...old, items: old.items.map((i) => i.id === n.id ? { ...i, isRead: true } : i), unreadCount: Math.max(0, old.unreadCount - 1) }
        : old,
    );
    try {
      await api.patch(`/notifications/${n.id}/read`);
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function handleMarkAllRead() {
    qc.setQueryData<NotificationListResponse>(
      ['notifications', 'page', tab, page],
      (old) => old ? { ...old, items: old.items.map((i) => ({ ...i, isRead: true })), unreadCount: 0 } : old,
    );
    try {
      await api.post('/notifications/read-all');
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function handleDelete(e: React.MouseEvent, n: Notification) {
    e.stopPropagation();
    setSelected((prev) => { const next = new Set(prev); next.delete(n.id); return next; });
    qc.setQueryData<NotificationListResponse>(
      ['notifications', 'page', tab, page],
      (old) => old
        ? {
            ...old,
            items: old.items.filter((i) => i.id !== n.id),
            total: old.total - 1,
            unreadCount: !n.isRead ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          }
        : old,
    );
    try {
      await api.delete(`/notifications/${n.id}`);
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function handleBulkMarkRead() {
    const ids = Array.from(selected);
    qc.setQueryData<NotificationListResponse>(
      ['notifications', 'page', tab, page],
      (old) => {
        if (!old) return old;
        const unreadMarked = old.items.filter((i) => ids.includes(i.id) && !i.isRead).length;
        return {
          ...old,
          items: old.items.map((i) => ids.includes(i.id) ? { ...i, isRead: true } : i),
          unreadCount: Math.max(0, old.unreadCount - unreadMarked),
        };
      },
    );
    setSelected(new Set());
    setSelectMode(false);
    try {
      await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`)));
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    qc.setQueryData<NotificationListResponse>(
      ['notifications', 'page', tab, page],
      (old) => {
        if (!old) return old;
        const unreadDeleted = old.items.filter((i) => ids.includes(i.id) && !i.isRead).length;
        return {
          ...old,
          items: old.items.filter((i) => !ids.includes(i.id)),
          total: old.total - ids.length,
          unreadCount: Math.max(0, old.unreadCount - unreadDeleted),
        };
      },
    );
    setSelected(new Set());
    setSelectMode(false);
    try {
      await Promise.all(ids.map((id) => api.delete(`/notifications/${id}`)));
    } finally {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[900px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(91,71,224,0.10)' }}
          >
            <Bell className="size-5" style={{ color: '#5B47E0' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">
              Notifications
              {total > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-all"
              style={selectMode ? {
                border: '1px solid rgba(91,71,224,0.30)',
                color: '#5B47E0',
                background: 'rgba(91,71,224,0.10)',
                backdropFilter: 'blur(8px)',
              } : {
                border: '1px solid rgba(0,0,0,0.12)',
                color: 'var(--foreground)',
                background: 'rgba(255,255,255,0.70)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: '1px solid rgba(0,0,0,0.12)',
                color: 'var(--foreground)',
                background: 'rgba(255,255,255,0.70)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid #ECECE6' }}>
        {(['all', 'unread'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className="rounded-lg px-5 py-1.5 text-sm font-medium transition-all capitalize"
            style={tab === t
              ? { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: 'var(--foreground)' }
              : { color: 'var(--muted-foreground)' }
            }
          >
            {t}
            {t === 'unread' && unreadCount > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: '#f43f5e' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(91,71,224,0.06)', border: '1px solid rgba(91,71,224,0.18)' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#5B47E0' }}>
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkRead}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)' }}
              >
                <CheckCheck className="size-3.5" />
                Mark as read
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.20)' }}
              >
                <Trash2 className="size-3.5" />
                Delete selected
              </button>
              <button
                onClick={exitSelectMode}
                className="h-8 px-3 rounded-lg text-xs font-medium transition-colors hover:bg-muted text-muted-foreground"
                style={{ border: '1px solid #ECECE6' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        {isLoading ? (
          <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="size-10 animate-pulse rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-72 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div
              className="mx-auto mb-4 size-14 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(91,71,224,0.08)' }}
            >
              <Bell className="size-7" style={{ color: '#5B47E0' }} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {tab === 'unread' ? 'No unread notifications' : "You're all caught up"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === 'unread'
                ? 'All notifications have been read.'
                : 'New notifications will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select-all header row — only visible in select mode */}
            <AnimatePresence initial={false}>
              {selectMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' as const }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 px-5 py-3"
                    style={{ borderBottom: '1px solid #F5F5F0', background: 'rgba(91,71,224,0.03)' }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="size-4 rounded cursor-pointer"
                        style={{ accentColor: '#5B47E0' }}
                      />
                      <span className="text-xs font-semibold" style={{ color: '#5B47E0' }}>
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
              {items.map((n, i) => {
                const meta = TYPE_META[n.type] ?? {
                  icon: Bell, color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: n.type,
                };
                const Icon = meta.icon;
                const isChecked = selected.has(n.id);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03, ease: "easeOut" as const }}
                    className="flex w-full items-start gap-3 px-5 py-4 transition-colors"
                    style={isChecked
                      ? { background: 'rgba(91,71,224,0.04)' }
                      : !n.isRead
                        ? { background: 'rgba(91,71,224,0.02)' }
                        : undefined
                    }
                  >
                    {/* Checkbox — only in select mode */}
                    <AnimatePresence initial={false}>
                      {selectMode && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15, ease: 'easeOut' as const }}
                          className="flex items-center pt-1 shrink-0 overflow-hidden"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(n.id)}
                            className="size-4 rounded cursor-pointer mr-1"
                            style={{ accentColor: '#5B47E0' }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Clickable content area */}
                    <button
                      onClick={() => handleMarkRead(n)}
                      className="flex flex-1 items-start gap-4 text-left min-w-0"
                    >
                      {/* Icon */}
                      <div
                        className="size-10 shrink-0 rounded-xl flex items-center justify-center"
                        style={{ background: meta.bg }}
                      >
                        <Icon className="size-5" style={{ color: meta.color }} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <p className={n.isRead ? 'text-sm leading-snug text-muted-foreground' : 'text-sm leading-snug font-semibold text-foreground'}>
                            {n.title}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground/60 pt-0.5" title={absoluteTime(n.createdAt)}>
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        {n.message && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        )}
                        <span
                          className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </button>

                    {/* Right: unread dot + delete */}
                    <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
                      {!n.isRead && (
                        <div className="size-2 rounded-full" style={{ background: '#5B47E0' }} />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, n)}
                        className="rounded-lg p-1 transition-colors hover:bg-red-50"
                        style={{ color: '#f43f5e' }}
                        title="Delete notification"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #ECECE6', background: 'rgba(0,0,0,0.01)' }}>
            <p className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span>
              {' '}of <span className="font-medium text-foreground">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                className="size-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ border: '1px solid #ECECE6' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-xs text-muted-foreground">{page} / {totalPages}</span>
              <button
                className="size-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ border: '1px solid #ECECE6' }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
