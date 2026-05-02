import {
  useState, useRef, useEffect, useCallback, useLayoutEffect,
} from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot, Plus, Trash2, Send, MessageSquare, AlertCircle, Loader2, Sparkles, X, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient, API_BASE } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { AiConversation, AiMessage, CreateConversationResponse } from "@/types/ai";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000;

const EXAMPLE_PROMPTS = [
  "Why did conversions drop last week?",
  "Compare GA4 vs Google Ads performance",
  "What's our best performing campaign this month?",
  "Show me cost trends for the last 30 days",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isStreaming = false }: { message: AiMessage; isStreaming?: boolean }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5`}
    >
      {!isUser && (
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
          style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
        >
          <Bot className="size-4 text-white" />
        </div>
      )}
      <div className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
        <div
          className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg,#111827,#1f2937)',
                  color: '#fff',
                  borderRadius: '18px 18px 4px 18px',
                  boxShadow: '0 2px 12px rgba(91,71,224,0.25)',
                }
              : {
                  background: '#fff',
                  color: 'var(--foreground)',
                  borderRadius: '18px 18px 18px 4px',
                  border: '1px solid #ECECE6',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }
          }
        >
          {message.content}
          {isStreaming && (
            <span
              className="inline-block w-1.5 h-3.5 ml-0.5 align-middle animate-pulse rounded-sm"
              style={{ background: '#5B47E0' }}
            />
          )}
        </div>
        {!isUser && message.tokenCount != null && !isStreaming && (
          <span className="text-[10px] px-1" style={{ color: 'rgba(0,0,0,0.25)' }}>
            {message.tokenCount} tokens
          </span>
        )}
      </div>
      {isUser && (
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg,#FF7A59,#f43f5e)' }}
        >
          You
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<AiConversation[]>({
    queryKey: ["aiConversations", clientId, campaignId],
    queryFn: async () => {
      const res = await api.get<AiConversation[]>(`/clients/${clientId}/campaigns/${campaignId}/ai/conversations`);
      return res.data;
    },
    enabled: !!clientId && !!campaignId,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<AiMessage[]>({
    queryKey: ["aiMessages", clientId, campaignId, activeConvId],
    queryFn: async () => {
      const res = await api.get<AiMessage[]>(`/clients/${clientId}/campaigns/${campaignId}/ai/conversations/${activeConvId}/messages`);
      return res.data;
    },
    enabled: !!activeConvId && !!clientId && !!campaignId,
  });

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const closeStream = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
  }, []);

  useEffect(() => () => closeStream(), [closeStream]);

  const switchConversation = useCallback((convId: string | null) => {
    closeStream();
    setStreamingContent(null);
    setIsSending(false);
    setActiveConvId(convId);
  }, [closeStream]);

  const sendViaStream = useCallback((convId: string, content: string) => {
    closeStream();
    setStreamingContent("");
    setIsSending(true);

    const userMsg: AiMessage = {
      id: `temp-user-${Date.now()}`, conversationId: convId, role: "user",
      content, tokenCount: null, createdAt: new Date().toISOString(),
    };
    qc.setQueryData<AiMessage[]>(["aiMessages", clientId, campaignId, convId], (old) => [...(old ?? []), userMsg]);

    const token = useAuthStore.getState().token;
    const url = `${API_BASE}/clients/${clientId}/campaigns/${campaignId}/ai/conversations/${convId}/stream?content=${encodeURIComponent(content.trim())}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (evt) => {
      if (activeConvIdRef.current !== convId) { es.close(); return; }
      try {
        const payload = JSON.parse(evt.data) as { type: "delta" | "done" | "error"; content?: string; tokenCount?: number; error?: string };
        if (payload.type === "delta" && payload.content) {
          setStreamingContent((prev) => (prev ?? "") + payload.content);
        } else if (payload.type === "done") {
          es.close(); esRef.current = null;
          setStreamingContent(null); setIsSending(false);
          qc.invalidateQueries({ queryKey: ["aiMessages", clientId, campaignId, convId] });
          qc.invalidateQueries({ queryKey: ["aiConversations", clientId, campaignId] });
        } else if (payload.type === "error") {
          es.close(); esRef.current = null;
          setStreamingContent(null); setIsSending(false);
          toast.error(payload.error ?? "AI assistant encountered an error");
        }
      } catch { /* heartbeat */ }
    };

    es.onerror = () => {
      if (activeConvIdRef.current !== convId) return;
      es.close(); esRef.current = null;
      setStreamingContent(null); setIsSending(false);
      toast.error("Connection to AI assistant lost. Please try again.");
    };
  }, [clientId, campaignId, qc, closeStream]);

  const handleSend = useCallback(async () => {
    const content = composer.trim();
    if (!content || isSending) return;
    if (content.length > MAX_CHARS) { toast.error(`Message too long (max ${MAX_CHARS} chars)`); return; }
    setComposer("");

    if (activeConvId) {
      sendViaStream(activeConvId, content);
    } else {
      setIsSending(true);
      try {
        const res = await api.post<CreateConversationResponse>(
          `/clients/${clientId}/campaigns/${campaignId}/ai/conversations`,
          { question: content },
        );
        const { conversationId, title, reply } = res.data;
        const newConv: AiConversation = { id: conversationId, title, messageCount: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        qc.setQueryData<AiConversation[]>(["aiConversations", clientId, campaignId], (old) => [newConv, ...(old ?? [])]);
        qc.setQueryData<AiMessage[]>(["aiMessages", clientId, campaignId, conversationId], [
          { id: `init-user-${Date.now()}`, conversationId, role: "user", content, tokenCount: null, createdAt: new Date().toISOString() },
          { id: `init-asst-${Date.now()}`, conversationId, role: "assistant", content: reply.content, tokenCount: reply.tokenCount, createdAt: new Date().toISOString() },
        ]);
        setActiveConvId(conversationId);
        activeConvIdRef.current = conversationId;
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Failed to start conversation");
      } finally {
        setIsSending(false);
      }
    }
  }, [composer, isSending, activeConvId, clientId, campaignId, api, qc, sendViaStream]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    if (activeConvId === target.id) switchConversation(null);
    qc.setQueryData<AiConversation[]>(["aiConversations", clientId, campaignId], (old) => (old ?? []).filter((c) => c.id !== target.id));
    try {
      await api.delete(`/clients/${clientId}/campaigns/${campaignId}/ai/conversations/${target.id}`);
    } catch (e: any) {
      qc.invalidateQueries({ queryKey: ["aiConversations", clientId, campaignId] });
      toast.error(e?.response?.data?.message ?? "Failed to delete conversation");
    }
  }, [deleteTarget, activeConvId, clientId, campaignId, api, qc, switchConversation]);

  const overLimit = composer.length > MAX_CHARS;
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  return (
    <div className="p-4 sm:p-5 lg:p-7 pb-0 space-y-4 flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap shrink-0"
      >
        <Link to="/clients" className="hover:text-foreground transition-colors font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors font-medium">Client</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={base} className="hover:text-foreground transition-colors font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">AI Assistant</span>
      </motion.nav>

      {/* Chat shell */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
        className="flex-1 flex overflow-hidden rounded-2xl min-h-0"
        style={{ border: '1px solid #ECECE6', background: '#fff' }}
      >
        {/* ── Left: conversation list ── */}
        <div
          className="w-60 shrink-0 flex flex-col"
          style={{ borderRight: '1px solid #F0F0EC', background: '#FAFAF7' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid #F0F0EC' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                <Bot className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            </div>
            <button
              onClick={() => switchConversation(null)}
              className="size-7 rounded-lg flex items-center justify-center transition-colors"
              title="New chat"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(91,71,224,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {convsLoading ? (
              <div className="space-y-1.5 pt-1 px-1">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                <div className="size-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'rgba(91,71,224,0.08)' }}>
                  <MessageSquare className="size-5" style={{ color: '#5B47E0' }} />
                </div>
                <p className="text-xs font-medium text-foreground">No chats yet</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Start a new conversation</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConvId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className="group flex items-start justify-between gap-1 px-2.5 py-2 rounded-xl cursor-pointer transition-all"
                    style={isActive
                      ? { background: 'rgba(91,71,224,0.10)', border: '1px solid rgba(91,71,224,0.20)' }
                      : { background: 'transparent', border: '1px solid transparent' }
                    }
                    onClick={() => switchConversation(conv.id)}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: isActive ? '#5B47E0' : 'var(--foreground)' }}>
                        {conv.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {conv.messageCount} msgs · {timeAgo(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); }}
                      className="size-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-muted-foreground shrink-0"
                      title="Delete"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.10)'; (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!activeConvId ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div
                  className="size-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
                >
                  <Sparkles className="size-8 text-white" />
                </div>
                <h2 className="font-heading font-bold text-lg text-foreground mb-1.5">Ask anything about your campaign</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  The AI assistant has access to your metrics, goals, alerts, and integration data.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mx-auto">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setComposer(prompt); composerRef.current?.focus(); }}
                      className="text-left px-3.5 py-2.5 text-xs rounded-xl transition-all leading-snug text-muted-foreground"
                      style={{ border: '1px solid #ECECE6', background: '#FAFAF7' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(91,71,224,0.30)'; e.currentTarget.style.background = 'rgba(91,71,224,0.04)'; e.currentTarget.style.color = '#5B47E0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.background = '#FAFAF7'; e.currentTarget.style.color = ''; }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : msgsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="h-12 w-52 rounded-2xl bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                {streamingContent !== null && (
                  <MessageBubble
                    message={{
                      id: "streaming", conversationId: activeConvId ?? "",
                      role: "assistant", content: streamingContent || "…",
                      tokenCount: null, createdAt: new Date().toISOString(),
                    }}
                    isStreaming
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div
            className="px-4 py-3.5 space-y-2 shrink-0"
            style={{ borderTop: '1px solid #F0F0EC', background: '#FAFAF7' }}
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={composerRef}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about your campaign data… (⌘↵ to send)"
                rows={2}
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all resize-none disabled:opacity-50"
                style={{ border: '1px solid #ECECE6', background: '#fff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#5B47E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.10)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#ECECE6'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button
                onClick={handleSend}
                disabled={!composer.trim() || isSending || overLimit}
                className="size-10 rounded-xl flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)', boxShadow: '0 2px 8px rgba(91,71,224,0.30)' }}
                title="Send (⌘↵)"
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] text-muted-foreground/60">AI responses may be approximate</span>
              <span className="text-[10px]" style={{ color: overLimit ? '#f43f5e' : 'rgba(0,0,0,0.30)' }}>
                {composer.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

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
                  <div className="flex-1">
                    <h2 className="font-heading font-bold text-base text-foreground">Delete Conversation?</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone</p>
                  </div>
                  <button onClick={() => setDeleteTarget(null)} className="size-7 rounded-lg flex items-center justify-center text-muted-foreground" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">"{deleteTarget.title}"</span> will be permanently deleted.
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
