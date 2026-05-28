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
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#ECECE6] shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-2">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-slate-900">
            Notifications
            {total > 0 && <span className="ml-3 text-lg font-normal text-slate-500">({total})</span>}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
        {/* Main Unified Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white overflow-hidden flex-1 flex flex-col"
          style={{ border: '1px solid #ECECE6', borderRadius: 0, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05), 0 16px 32px -4px rgba(0,0,0,0.1)' }}
        >
          {/* Card Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-b border-[#ECECE6]">
            {/* Tabs */}
            <div className="flex gap-1 rounded-none p-1 bg-white border border-[#ECECE6]">
              {(['all', 'unread'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className="rounded-none px-5 py-1.5 text-sm font-bold transition-all capitalize cursor-pointer"
                  style={tab === t
                    ? { background: 'slate-900', color: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #ECECE6' }
                    : { color: 'var(--muted-foreground)', border: '1px solid transparent' }
                  }
                >
                  <span className="flex items-center gap-2">
                    {t}
                    {t === 'unread' && unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 font-bold rounded-none">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-none text-sm font-bold transition-all cursor-pointer"
                  style={selectMode ? {
                    border: '1px solid #5B47E0',
                    color: '#5B47E0',
                    background: 'rgba(91,71,224,0.05)',
                  } : {
                    border: '1px solid #0f172a',
                    color: '#0f172a',
                    background: 'transparent',
                  }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-none text-sm font-bold transition-all border border-slate-900 bg-slate-900 text-white hover:opacity-90 cursor-pointer"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Bulk action bar */}
          <AnimatePresence>
            {someSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden bg-slate-50 border-b border-slate-200"
              >
                <div className="flex items-center justify-between gap-3 px-6 py-3">
                  <span className="text-sm font-bold text-slate-900">
                    {selected.size} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkMarkRead}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-bold transition-colors bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <CheckCheck className="size-3.5" />
                      Mark as read
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-none text-xs font-bold transition-colors bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      Delete selected
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {isLoading ? (
              <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 px-6 py-5">
                    <div className="size-10 animate-pulse rounded-none bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-48 animate-pulse rounded-none bg-slate-100" />
                      <div className="h-3 w-72 animate-pulse rounded-none bg-slate-100" />
                      <div className="h-3 w-16 animate-pulse rounded-none bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center flex-1 flex flex-col items-center justify-center">
                <div className="size-16 flex items-center justify-center mb-4 bg-slate-50 border border-slate-200 rounded-none shrink-0">
                  <Bell className="size-8 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {tab === 'unread' ? 'No unread notifications' : "You're all caught up"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {tab === 'unread'
                    ? 'All notifications have been read.'
                    : 'New notifications will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {/* Select-all header row */}
                <AnimatePresence initial={false}>
                  {selectMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="size-4 rounded-none cursor-pointer border-slate-300"
                            style={{ accentColor: '#0f172a' }}
                          />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                      icon: Bell, color: '#64748b', bg: '#f8fafc', label: n.type,
                    };
                    const Icon = meta.icon;
                    const isChecked = selected.has(n.id);
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03, ease: "easeOut" }}
                        className="flex w-full items-start gap-4 px-6 py-5 transition-colors hover:bg-slate-50"
                        style={isChecked
                          ? { background: 'rgba(15,23,42,0.02)' }
                          : !n.isRead
                            ? { background: 'rgba(91,71,224,0.02)' }
                            : undefined
                        }
                      >
                        {/* Checkbox */}
                        <AnimatePresence initial={false}>
                          {selectMode && (
                            <motion.div
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="flex items-center pt-2 shrink-0 overflow-hidden pr-2"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelect(n.id)}
                                className="size-4 rounded-none cursor-pointer border-slate-300"
                                style={{ accentColor: '#0f172a' }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Clickable content area */}
                        <button
                          onClick={() => handleMarkRead(n)}
                          className="flex flex-1 items-start gap-5 text-left min-w-0 cursor-pointer"
                        >
                          {/* Icon */}
                          <div
                            className="size-12 shrink-0 rounded-none flex items-center justify-center border"
                            style={{ background: meta.bg, borderColor: `${meta.color}20` }}
                          >
                            <Icon className="size-5" style={{ color: meta.color }} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <p className={n.isRead ? 'text-base font-medium text-slate-700' : 'text-base font-bold text-slate-900'}>
                                {n.title}
                              </p>
                              <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400 pt-1" title={absoluteTime(n.createdAt)}>
                                {relativeTime(n.createdAt)}
                              </span>
                            </div>
                            {n.message && (
                              <p className="mt-1 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            )}
                            <span
                              className="mt-3 inline-flex items-center px-2 py-0.5 rounded-none border text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: '#fff', borderColor: `${meta.color}40`, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </button>

                        {/* Right: unread dot + delete */}
                        <div className="flex shrink-0 flex-col items-center gap-3 pt-2">
                          {!n.isRead && (
                            <div className="size-2 rounded-full bg-slate-900" />
                          )}
                          <button
                            onClick={(e) => handleDelete(e, n)}
                            className="rounded-none p-1.5 transition-colors hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="size-4" />
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
              <div className="flex items-center justify-between px-6 py-4 mt-auto bg-gray-50 border-t border-[#ECECE6]">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Showing{' '}
                  <span className="text-slate-900">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span>
                  {' '}of <span className="text-slate-900">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="size-8 bg-white border border-[#ECECE6] rounded-none flex items-center justify-center transition-colors hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-3 text-sm font-bold text-slate-900">{page} / {totalPages}</span>
                  <button
                    className="size-8 bg-white border border-[#ECECE6] rounded-none flex items-center justify-center transition-colors hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
