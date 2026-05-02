import { useState, useMemo, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, PinOff, Edit2, Trash2, StickyNote, AlertCircle, ChevronRight, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import type { Note } from "@/types/notes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_CHARS = 5000;
const WARN_CHARS = 4500;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Input focus helpers ──────────────────────────────────────────────────────

function textareaFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#5B47E0';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)';
}
function textareaBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#ECECE6';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Note card ────────────────────────────────────────────────────────────────

function NoteCard({
  note, isEditing, editBody, editAreaRef, canEdit,
  onStartEdit, onCancelEdit, onSaveEdit, onEditBodyChange, onEditKeyDown,
  onTogglePin, onDelete, onToggleExpand, isExpanded, index,
}: {
  note: Note; isEditing: boolean; editBody: string; editAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  canEdit: boolean; onStartEdit: () => void; onCancelEdit: () => void;
  onSaveEdit: () => void; onEditBodyChange: (v: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void; onTogglePin: () => void;
  onDelete: () => void; onToggleExpand: () => void; isExpanded: boolean; index: number;
}) {
  const isLong = note.body.length > 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" as const }}
      className="bg-white rounded-2xl overflow-hidden group"
      style={{
        border: note.isPinned ? '1px solid rgba(91,71,224,0.25)' : '1px solid #ECECE6',
        boxShadow: note.isPinned ? '0 0 0 3px rgba(91,71,224,0.06)' : undefined,
      }}
    >
      {/* Top strip */}
      <div
        className="h-0.5 w-full"
        style={{ background: note.isPinned ? '#5B47E0' : 'rgba(0,0,0,0.06)' }}
      />

      <div className="px-4 py-3.5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          {note.isPinned && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(91,71,224,0.10)', color: '#5B47E0' }}
            >
              Pinned
            </span>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-muted-foreground/70">{timeAgo(note.createdAt)}</span>
            {note.createdBy && (
              <span className="text-xs text-muted-foreground/70">
                · {note.createdBy.firstName} {note.createdBy.lastName}
              </span>
            )}
            {canEdit && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onTogglePin}
                  className="size-6 rounded-lg flex items-center justify-center transition-colors"
                  title={note.isPinned ? "Unpin" : "Pin"}
                  style={{ color: note.isPinned ? '#5B47E0' : 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(91,71,224,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {note.isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                </button>
                <button
                  onClick={onStartEdit}
                  className="size-6 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
                  title="Edit"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Edit2 className="size-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="size-6 rounded-lg flex items-center justify-center text-muted-foreground transition-colors"
                  title="Delete"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={editAreaRef}
              value={editBody}
              onChange={(e) => onEditBodyChange(e.target.value)}
              onKeyDown={onEditKeyDown}
              rows={4}
              maxLength={MAX_CHARS}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={textareaFocus}
              onBlur={textareaBlur}
            />
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{ color: editBody.length > WARN_CHARS ? '#f43f5e' : 'var(--muted-foreground)' }}
              >
                {editBody.length}/{MAX_CHARS} · Esc cancel · ⌘↵ save
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onCancelEdit}
                  className="h-7 px-3 text-xs font-semibold rounded-xl transition-colors"
                  style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveEdit}
                  disabled={!editBody.trim() || editBody.length > MAX_CHARS}
                  className="h-7 px-3 text-xs font-semibold rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p
              className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
              style={{ WebkitLineClamp: !isExpanded && isLong ? 4 : undefined, display: !isExpanded && isLong ? '-webkit-box' : undefined, WebkitBoxOrient: !isExpanded && isLong ? 'vertical' : undefined, overflow: !isExpanded && isLong ? 'hidden' : undefined } as React.CSSProperties}
            >
              {note.body}
            </p>
            {isLong && (
              <button
                onClick={onToggleExpand}
                className="text-xs font-semibold mt-1.5 hover:underline"
                style={{ color: '#5B47E0' }}
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NotesPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const qc = useQueryClient();
  const role = useRole();
  const canEdit = hasRole(role, "AGENCY_ADMIN") || hasRole(role, "AGENCY_STAFF");

  const [createBody, setCreateBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const editAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const queryKey = ["notes", clientId, campaignId];

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get<Note[]>(`/clients/${clientId}/campaigns/${campaignId}/notes`);
      return res.data;
    },
    enabled: !!clientId && !!campaignId,
  });

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [notes],
  );

  const handleCreate = useCallback(async () => {
    const body = createBody.trim();
    if (!body || creating) return;
    const tempId = `temp-${Date.now()}`;
    const tempNote: Note = { id: tempId, body, isPinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCreating(true);
    setCreateBody("");
    qc.setQueryData<Note[]>(queryKey, (old) => [tempNote, ...(old ?? [])]);
    try {
      const res = await api.post<Note>(`/clients/${clientId}/campaigns/${campaignId}/notes`, { body });
      qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).map((n) => (n.id === tempId ? res.data : n)));
    } catch (e: any) {
      qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).filter((n) => n.id !== tempId));
      setCreateBody(body);
      toast.error(e?.response?.data?.message ?? "Failed to create note");
    } finally {
      setCreating(false);
    }
  }, [createBody, creating, clientId, campaignId, qc, queryKey, api]);

  const handleTogglePin = useCallback(async (note: Note) => {
    const newPinned = !note.isPinned;
    qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).map((n) => n.id === note.id ? { ...n, isPinned: newPinned } : n));
    try {
      await api.patch(`/clients/${clientId}/campaigns/${campaignId}/notes/${note.id}`, { isPinned: newPinned });
    } catch (e: any) {
      qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).map((n) => n.id === note.id ? { ...n, isPinned: note.isPinned } : n));
      toast.error(e?.response?.data?.message ?? "Failed to update note");
    }
  }, [clientId, campaignId, qc, queryKey, api]);

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditBody(note.body);
    setTimeout(() => editAreaRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditBody(""); };

  const handleSaveEdit = useCallback(async (noteId: string) => {
    const body = editBody.trim();
    if (!body) return;
    const prev = notes.find((n) => n.id === noteId);
    qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).map((n) => n.id === noteId ? { ...n, body, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
    setEditBody("");
    try {
      await api.patch(`/clients/${clientId}/campaigns/${campaignId}/notes/${noteId}`, { body });
    } catch (e: any) {
      if (prev) qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).map((n) => n.id === noteId ? prev : n));
      toast.error(e?.response?.data?.message ?? "Failed to update note");
    }
  }, [editBody, notes, clientId, campaignId, qc, queryKey, api]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    qc.setQueryData<Note[]>(queryKey, (old) => (old ?? []).filter((n) => n.id !== target.id));
    try {
      await api.delete(`/clients/${clientId}/campaigns/${campaignId}/notes/${target.id}`);
      toast.success("Note deleted");
    } catch (e: any) {
      qc.invalidateQueries({ queryKey });
      toast.error(e?.response?.data?.message ?? "Failed to delete note");
    }
  }, [deleteTarget, clientId, campaignId, qc, queryKey, api]);

  const pinnedCount = sortedNotes.filter((n) => n.isPinned).length;

  return (
    <div className="p-4 sm:p-5 lg:p-7 space-y-6 pb-12 max-w-[860px] mx-auto">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors font-medium">Client</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}/campaigns/${campaignId}`} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">Notes</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,165,36,0.12)' }}>
            <StickyNote className="size-5" style={{ color: '#F5A524' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-foreground">
              Notes
              {notes.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({notes.length})</span>}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pinnedCount > 0 ? `${pinnedCount} pinned` : "Capture context and insights"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Create note card */}
      {canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" as const }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#5B47E0,#FF7A59,#10D9A0)' }} />
          <div className="p-4 space-y-3">
            <textarea
              value={createBody}
              onChange={(e) => setCreateBody(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleCreate(); }}
              placeholder="Write a note… (⌘↵ to save)"
              rows={3}
              maxLength={MAX_CHARS}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none bg-white"
              style={{ border: '1px solid #ECECE6' }}
              onFocus={textareaFocus}
              onBlur={textareaBlur}
            />
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{ color: createBody.length > WARN_CHARS ? '#f43f5e' : 'var(--muted-foreground)' }}
              >
                {createBody.length}/{MAX_CHARS}
              </span>
              <button
                onClick={handleCreate}
                disabled={!createBody.trim() || creating || createBody.length > MAX_CHARS}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                <Plus className="size-3" />
                {creating ? "Saving…" : "Add Note"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '1px solid #ECECE6' }}
        >
          <div className="mb-4 size-14 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(245,165,36,0.10)' }}>
            <StickyNote className="size-7" style={{ color: '#F5A524' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No notes yet</p>
          <p className="text-xs text-muted-foreground">
            {canEdit ? "Add a note to capture context about this campaign." : "No notes have been added yet."}
          </p>
        </motion.div>
      )}

      {/* Notes list */}
      {!isLoading && sortedNotes.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                editBody={editBody}
                editAreaRef={editAreaRef}
                canEdit={canEdit}
                isExpanded={expanded.has(note.id)}
                onStartEdit={() => startEdit(note)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(note.id)}
                onEditBodyChange={setEditBody}
                onEditKeyDown={(e) => {
                  if (e.key === "Escape") { e.preventDefault(); cancelEdit(); return; }
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSaveEdit(note.id); }
                }}
                onTogglePin={() => handleTogglePin(note)}
                onDelete={() => setDeleteTarget(note)}
                onToggleExpand={() => setExpanded((prev) => {
                  const s = new Set(prev);
                  if (s.has(note.id)) s.delete(note.id); else s.add(note.id);
                  return s;
                })}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid #ECECE6' }}
            >
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#fb7185)' }} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.10)' }}>
                    <AlertCircle className="size-5" style={{ color: '#f43f5e' }} />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground">Delete Note?</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone</p>
                  </div>
                  <button onClick={() => setDeleteTarget(null)} className="ml-auto size-7 rounded-lg flex items-center justify-center text-muted-foreground" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  "{deleteTarget.body.slice(0, 80)}{deleteTarget.body.length > 80 ? "…" : ""}"
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-xl text-sm font-semibold" style={{ border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}>Cancel</button>
                  <button
                    onClick={handleDelete}
                    className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
