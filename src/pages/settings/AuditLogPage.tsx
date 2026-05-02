import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, ClipboardCopy, ChevronDown, ChevronUp,
  Shield, FilterX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { AuditLog, AuditLogResponse } from '@/types/audit.ts';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'RESTORE',
  'CONNECT', 'DISCONNECT', 'GENERATE', 'INVITE', 'REVOKE',
];

const RESOURCE_OPTIONS = [
  'Client', 'Campaign', 'User', 'Integration',
  'Report', 'Dashboard', 'Goal', 'Alert', 'Note',
];

type ChipId = 'all' | 'integrations' | 'reports' | 'team';

const CHIPS: { id: ChipId; label: string; resourceType: string; action: string }[] = [
  { id: 'all',          label: 'All',          resourceType: '', action: '' },
  { id: 'integrations', label: 'Integrations',  resourceType: 'Integration', action: '' },
  { id: 'reports',      label: 'Reports',       resourceType: 'Report',      action: '' },
  { id: 'team',         label: 'Team',          resourceType: 'User',        action: '' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function absoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

// ─── Action badge ──────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<string, { bg: string; color: string }> = {
  CREATE:     { bg: 'rgba(16,217,160,0.12)',   color: '#10D9A0' },
  CONNECT:    { bg: 'rgba(16,217,160,0.12)',   color: '#10D9A0' },
  INVITE:     { bg: 'rgba(16,217,160,0.12)',   color: '#10D9A0' },
  UPDATE:     { bg: 'rgba(91,71,224,0.10)',    color: '#5B47E0' },
  GENERATE:   { bg: 'rgba(91,71,224,0.10)',    color: '#5B47E0' },
  DELETE:     { bg: 'rgba(244,63,94,0.10)',    color: '#f43f5e' },
  DISCONNECT: { bg: 'rgba(244,63,94,0.10)',    color: '#f43f5e' },
  REVOKE:     { bg: 'rgba(244,63,94,0.10)',    color: '#f43f5e' },
  RESTORE:    { bg: 'rgba(6,182,212,0.10)',    color: '#06b6d4' },
};

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? { bg: 'rgba(107,114,128,0.10)', color: '#6b7280' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: style.bg, color: style.color }}
    >
      {action}
    </span>
  );
}

// ─── Metadata viewer ──────────────────────────────────────────────────────────

function MetadataViewer({ data }: { data: Record<string, unknown> }) {
  const formatted = JSON.stringify(data, null, 2);
  function handleCopy() {
    navigator.clipboard.writeText(formatted).then(() => toast.success('Copied to clipboard'));
  }
  return (
    <div className="relative mt-2 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid #ECECE6' }}>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-background transition-colors"
        title="Copy JSON"
      >
        <ClipboardCopy className="size-3.5" />
      </button>
      <pre className="max-h-48 overflow-auto p-3 pr-8 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {formatted}
      </pre>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<ChipId>('all');

  useEffect(() => {
    const t = setTimeout(() => { setAppliedFrom(fromDate); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [fromDate]);

  useEffect(() => {
    const t = setTimeout(() => { setAppliedTo(toDate); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [toDate]);

  const hasFilters = action !== '' || resourceType !== '' || fromDate !== '' || toDate !== '';

  function applyChip(chip: typeof CHIPS[number]) {
    setActiveChip(chip.id);
    setAction(chip.action);
    setResourceType(chip.resourceType);
    setPage(1);
  }

  const handleActionChange = useCallback((val: string) => {
    setAction(val);
    setPage(1);
    setActiveChip('all');
  }, []);

  const handleResourceChange = useCallback((val: string) => {
    setResourceType(val);
    setPage(1);
    setActiveChip('all');
  }, []);

  function clearFilters() {
    setAction('');
    setResourceType('');
    setFromDate('');
    setToDate('');
    setAppliedFrom('');
    setAppliedTo('');
    setPage(1);
    setActiveChip('all');
  }

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '50');
  if (action)       params.set('action', action);
  if (resourceType) params.set('resourceType', resourceType);
  if (appliedFrom)  params.set('from', appliedFrom);
  if (appliedTo)    params.set('to', appliedTo);

  const { data, isLoading, isError } = useQuery<AuditLogResponse>({
    queryKey: ['auditLog', page, action, resourceType, appliedFrom, appliedTo],
    queryFn: () => api.get(`/agencies/audit-log?${params}`).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  const inputStyle = {
    border: '1px solid #ECECE6',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
    e.currentTarget.style.borderColor = '#5B47E0';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = '#ECECE6';
  };

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,71,224,0.10)' }}>
          <Shield className="size-5" style={{ color: '#5B47E0' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">Audit Log</h1>
          <p className="text-xs text-muted-foreground mt-0.5">A full history of actions performed in your agency</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" as const }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #ECECE6' }}
      >
        {/* Quick chips */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => applyChip(chip)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={activeChip === chip.id
                ? { background: 'rgba(91,71,224,0.10)', color: '#5B47E0', border: '1px solid rgba(91,71,224,0.20)' }
                : { background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid #ECECE6' }
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 px-5 py-4" style={{ borderBottom: '1px solid #ECECE6' }}>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Action</label>
            <select
              value={action}
              onChange={(e) => handleActionChange(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl bg-background text-foreground focus:outline-none appearance-none min-w-[140px]"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Resource</label>
            <select
              value={resourceType}
              onChange={(e) => handleResourceChange(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl bg-background text-foreground focus:outline-none appearance-none min-w-[140px]"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            >
              <option value="">All resources</option>
              {RESOURCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">From</label>
            <input
              type="date"
              className="h-8 px-3 text-xs rounded-xl bg-background text-foreground focus:outline-none w-36"
              style={inputStyle}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">To</label>
            <input
              type="date"
              className="h-8 px-3 text-xs rounded-xl bg-background text-foreground focus:outline-none w-36"
              style={inputStyle}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors hover:bg-muted text-muted-foreground"
              style={{ border: '1px solid #ECECE6' }}
            >
              <FilterX className="size-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading && !data ? (
          <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Failed to load audit log. Please refresh.
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="size-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(91,71,224,0.06)' }}>
              <Shield className="size-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">No audit log entries match your filters.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="h-8 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted transition-colors text-muted-foreground"
                style={{ border: '1px solid #ECECE6' }}
              >
                <FilterX className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #ECECE6' }}>
                <tr>
                  {['Timestamp', 'User', 'Action', 'Resource', 'Name', 'IP', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                {items.map((entry: AuditLog) => (
                  <>
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs text-muted-foreground cursor-default tabular-nums"
                          title={absoluteTime(entry.createdAt)}
                        >
                          {relativeTime(entry.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.userEmail ? (
                          <span className="text-xs text-foreground">{entry.userEmail}</span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(107,114,128,0.10)', color: '#6b7280' }}
                          >
                            System
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {entry.resourceType}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                        {entry.resourceName ?? entry.resourceId ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {entry.ipAddress ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                          <button
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            className="flex items-center gap-1 text-xs font-semibold transition-colors"
                            style={{ color: '#5B47E0' }}
                          >
                            {expandedId === entry.id ? (
                              <><ChevronUp className="size-3" /> Hide</>
                            ) : (
                              <><ChevronDown className="size-3" /> View</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === entry.id && entry.metadata && (
                      <tr key={`${entry.id}-meta`} style={{ background: 'rgba(0,0,0,0.01)' }}>
                        <td colSpan={7} className="px-5 pb-4 pt-0">
                          <MetadataViewer data={entry.metadata} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #ECECE6', background: 'rgba(0,0,0,0.01)' }}>
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of{' '}
              <span className="font-medium text-foreground">{total}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button
                className="size-7 rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors hover:bg-muted"
                style={{ border: '1px solid #ECECE6' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {pageNumbers(page, totalPages).map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={n}
                    className="size-7 rounded-lg text-xs font-semibold transition-all"
                    style={n === page
                      ? { background: '#5B47E0', color: '#fff', border: '1px solid #5B47E0' }
                      : { border: '1px solid #ECECE6', color: 'var(--foreground)' }
                    }
                    onClick={() => setPage(n as number)}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                className="size-7 rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors hover:bg-muted"
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
