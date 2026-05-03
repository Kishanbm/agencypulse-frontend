import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, Bot, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API_BASE } from "@/lib/api";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";

const STORAGE_KEY = "ap.public-ai.history";
const MAX_HISTORY = 20;
const MAX_CHARS = 500;

interface PublicMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What is AgencyPulse?",
  "What integrations do you support?",
  "How much does it cost?",
  "How do I get started?",
];

const STARTER_GREETING: PublicMessage = {
  role: "assistant",
  content:
    "Hi! I can answer questions about **AgencyPulse** — features, integrations, pricing, signing up. What would you like to know?",
};

export function PublicAiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PublicMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist history to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  // Focus input when opening
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(content: string) {
    if (!content.trim() || sending) return;
    const userMsg: PublicMessage = { role: "user", content: content.trim() };
    const next = [...messages, userMsg].slice(-MAX_HISTORY);
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      // Don't send the initial greeting back as history (avoids confusing the LLM)
      const history = next.slice(0, -1).filter((m) => m !== STARTER_GREETING);
      const { data } = await axios.post<{ content: string }>(
        `${API_BASE}/ai/public/messages`,
        { message: userMsg.content, history },
        { timeout: 30_000 },
      );
      setMessages((prev) => [...prev, { role: "assistant" as const, content: data.content }].slice(-MAX_HISTORY));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        toast.error("Too many messages — please wait a moment");
      } else {
        toast.error("Assistant is temporarily unavailable");
      }
      // Roll back the user message on error so they can retry
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  // Show the starter greeting if there's no history
  const displayMessages = messages.length === 0 ? [STARTER_GREETING] : messages;
  const showSuggestions = messages.length === 0 && !sending;

  return (
    <>
      {/* Floating bubble — matches the in-app GlobalAiWidget */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 16 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 size-14 rounded-2xl flex items-center justify-center text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#5B47E0,#FF8FA9)",
              boxShadow: "0 12px 32px rgba(91,71,224,0.40), 0 4px 12px rgba(0,0,0,0.10)",
            }}
            aria-label="Ask AgencyPulse"
          >
            <Sparkles className="size-6" />
            <span
              className="absolute -top-1 -right-1 size-3 rounded-full bg-mint border-2 border-white"
              aria-hidden
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl overflow-hidden border bg-card"
            style={{
              width: "min(400px, calc(100vw - 32px))",
              height: "min(580px, calc(100vh - 80px))",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(91,71,224,0.10)",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }}
            >
              <div className="size-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white">Ask AgencyPulse</div>
                <div className="text-[10px] text-white/80 leading-tight">Product info · pricing · features</div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  title="New chat"
                  className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                title="Minimize"
                className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
              {displayMessages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}

              {sending && (
                <div className="flex gap-2.5">
                  <div className="size-7 rounded-xl flex items-center justify-center shrink-0 bg-foreground">
                    <Bot className="size-3.5 text-white" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-card border border-border max-w-[78%]">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="flex gap-1">
                        <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      Thinking…
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested prompts */}
              {showSuggestions && (
                <div className="pt-2 flex flex-col gap-1.5">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => void send(p)}
                      className="text-xs px-3 py-2 text-left rounded-xl border border-border bg-card hover:border-violet/40 hover:bg-violet/5 transition-colors text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={onSubmit} className="border-t border-border bg-card p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-violet/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about features, integrations, pricing…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none max-h-24 leading-relaxed"
                  disabled={sending}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || sending}
                  whileTap={{ scale: 0.95 }}
                  className="size-8 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }}
                  aria-label="Send"
                >
                  {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </motion.button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 px-1">
                <span>Only answers about AgencyPulse</span>
                <span>{input.length}/{MAX_CHARS}</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function loadHistory(): PublicMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is PublicMessage =>
          m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
      )
      .slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="size-7 rounded-xl flex items-center justify-center shrink-0 bg-foreground">
          <Bot className="size-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 ${
          isUser ? "rounded-2xl rounded-tr-sm text-white" : "rounded-2xl rounded-tl-sm bg-card border border-border"
        }`}
        style={isUser ? { background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" } : undefined}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <MarkdownMessage content={content} />
        )}
      </div>
    </motion.div>
  );
}
