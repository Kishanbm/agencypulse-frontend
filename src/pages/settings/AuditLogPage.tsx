import React, { useState, useEffect, useCallback } from 'react';
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
      className="inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider"
      style={{ background: '#fff', borderColor: `${style.color}40`, color: style.color }}
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
    <div className="relative mt-2 rounded-none overflow-hidden" style={{ background: '#fafafa', border: '1px solid #ECECE6' }}>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-none p-1.5 text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
        title="Copy JSON"
      >
        <ClipboardCopy className="size-3.5" />
      </button>
      <pre className="max-h-48 overflow-auto p-4 pr-8 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
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
    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    e.currentTarget.style.borderColor = '#0f172a';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = '#ECECE6';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#ECECE6] shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-2">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-slate-900">
            Audit Log
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
          {/* Card Header Bar (Chips & Filters) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-b border-[#ECECE6]">
            {/* Quick chips (Tabs) */}
            <div className="flex gap-1 rounded-none p-1 bg-white border border-[#ECECE6] self-start xl:self-auto">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => applyChip(chip)}
                  className="rounded-none px-5 py-1.5 text-sm font-bold transition-all capitalize cursor-pointer"
                  style={activeChip === chip.id
                    ? { background: '#0f172a', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #0f172a' }
                    : { color: 'var(--muted-foreground)', border: '1px solid transparent' }
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action</label>
                <select
                  value={action}
                  onChange={(e) => handleActionChange(e.target.value)}
                  className="h-9 px-3 py-1.5 text-sm rounded-none bg-white text-slate-900 focus:outline-none appearance-none min-w-[140px] cursor-pointer"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                >
                  <option value="">All actions</option>
                  {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</label>
                <select
                  value={resourceType}
                  onChange={(e) => handleResourceChange(e.target.value)}
                  className="h-9 px-3 py-1.5 text-sm rounded-none bg-white text-slate-900 focus:outline-none appearance-none min-w-[140px] cursor-pointer"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                >
                  <option value="">All resources</option>
                  {RESOURCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</label>
                <input
                  type="date"
                  className="h-9 px-3 py-1.5 text-sm rounded-none bg-white text-slate-900 focus:outline-none w-36 cursor-pointer"
                  style={inputStyle}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
                <input
                  type="date"
                  className="h-9 px-3 py-1.5 text-sm rounded-none bg-white text-slate-900 focus:outline-none w-36 cursor-pointer"
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
                  className="h-9 px-4 rounded-none text-sm font-bold inline-flex items-center gap-1.5 transition-colors bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                  style={{ border: '1px solid #ECECE6' }}
                >
                  <FilterX className="size-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {isLoading && !data ? (
              <div className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-4 w-24 animate-pulse rounded-none bg-slate-100" />
                    <div className="h-4 w-32 animate-pulse rounded-none bg-slate-100" />
                    <div className="h-5 w-16 animate-pulse rounded-none bg-slate-100" />
                    <div className="h-4 w-20 animate-pulse rounded-none bg-slate-100" />
                    <div className="h-4 w-28 animate-pulse rounded-none bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-24 text-center text-sm font-bold text-red-500">
                Failed to load audit log. Please refresh.
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center flex-1 flex flex-col items-center justify-center">
                <div className="size-16 flex items-center justify-center mb-4 bg-slate-50 border border-slate-200 rounded-none shrink-0">
                  <Shield className="size-8 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900">
                  No audit log entries match your filters.
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 h-9 px-4 rounded-none text-sm font-bold inline-flex items-center gap-1.5 transition-colors bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                    style={{ border: '1px solid #ECECE6' }}
                  >
                    <FilterX className="size-4" />
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-[#ECECE6]">
                    <tr>
                      {['Timestamp', 'User', 'Action', 'Resource', 'Name', 'IP', 'Details'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#F5F5F0' }}>
                    {items.map((entry: AuditLog) => (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="text-sm font-medium text-slate-600 tabular-nums"
                              title={absoluteTime(entry.createdAt)}
                            >
                              {relativeTime(entry.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.userEmail ? (
                              <span className="text-sm font-bold text-slate-900">{entry.userEmail}</span>
                            ) : (
                              <span
                                className="inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider"
                                style={{ background: '#fff', borderColor: '#d1d5db', color: '#6b7280' }}
                              >
                                System
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionBadge action={entry.action} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                            {entry.resourceType}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[200px] truncate">
                            {entry.resourceName ?? entry.resourceId ?? <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                            {entry.ipAddress ?? '—'}
                          </td>
                          <td className="px-6 py-4">
                            {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                              <button
                                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                className="flex items-center gap-1.5 text-sm font-bold transition-colors cursor-pointer text-[#5B47E0] hover:text-[#4a3ab3]"
                              >
                                {expandedId === entry.id ? (
                                  <><ChevronUp className="size-4" /> Hide</>
                                ) : (
                                  <><ChevronDown className="size-4" /> View</>
                                )}
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                        {expandedId === entry.id && entry.metadata && (
                          <tr style={{ background: '#fafafa', borderTop: 'none', borderBottom: '1px solid #ECECE6' }}>
                            <td colSpan={7} className="px-6 pb-6 pt-2">
                              <MetadataViewer data={entry.metadata} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 mt-auto bg-gray-50 border-t border-[#ECECE6]">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Showing{' '}
                  <span className="text-slate-900">{(page - 1) * 50 + 1}–{Math.min(page * 50, total)}</span>
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
                  
                  {pageNumbers(page, totalPages).map((n, i) =>
                    n === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-sm font-bold text-slate-500">…</span>
                    ) : (
                      <button
                        key={n}
                        className="size-8 rounded-none text-sm font-bold transition-all cursor-pointer"
                        style={n === page
                          ? { background: '#0f172a', color: '#fff', border: '1px solid #0f172a' }
                          : { background: '#fff', border: '1px solid #ECECE6', color: '#0f172a' }
                        }
                        onClick={() => setPage(n as number)}
                      >
                        {n}
                      </button>
                    )
                  )}

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
