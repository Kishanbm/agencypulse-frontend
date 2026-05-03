import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, MessageSquarePlus, ChevronDown, History, Trash2 } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import {
  createGlobalConversation,
  sendGlobalMessage,
  getGlobalMessages,
  listGlobalConversations,
  deleteGlobalConversation,
} from "@/lib/ai-service";
import type { AiConversation } from "@/types/ai";

const STORAGE_KEY = "ap.global-ai.conversation-id";

const EXAMPLE_PROMPTS = [
  "What clients have alerts firing this week?",
  "Generate the latest report for my biggest client",
  "Which campaigns are behind on their goals?",
  "Show me integrations that need reconnecting",
];

export function GlobalAiWidget() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  // ─── Persist conversation id ──────────────────────────────────────────────────

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEY, conversationId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [conversationId]);

  // ─── History ─────────────────────────────────────────────────────────────────

  const { data: history = [] } = useQuery<AiConversation[]>({
    queryKey: ["ai", "global", "list"],
    queryFn: listGlobalConversations,
    enabled: open && showHistory,
    staleTime: 30_000,
  });

  const deleteConvMutation = useMutation({
    mutationFn: deleteGlobalConversation,
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ["ai", "global", "list"] });
      if (deletedId === conversationId) {
        setConversationId(null);
      }
      toast.success("Conversation deleted");
    },
    onError: () => toast.error("Could not delete conversation"),
  });

  // ─── Close on Escape ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating bubble */}
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
            aria-label="Open AI Assistant"
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
            ref={panelRef}
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-5 right-5 z-50 flex flex-col bg-card rounded-2xl overflow-hidden border border-border"
            style={{
              width: "min(420px, calc(100vw - 32px))",
              height: "min(640px, calc(100vh - 80px))",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(91,71,224,0.10)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b border-border"
              style={{ background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }}
            >
              <div className="size-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white">AgencyPulse Assistant</div>
                <div className="text-[10px] text-white/80 leading-tight">Ask anything · agency-wide</div>
              </div>
              <button
                onClick={() => {
                  setConversationId(null);
                  setShowHistory(false);
                }}
                title="New conversation"
                className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
              >
                <MessageSquarePlus className="size-3.5" />
              </button>
              <button
                onClick={() => setShowHistory((s) => !s)}
                title="Conversation history"
                className={`size-7 rounded-lg flex items-center justify-center transition-colors ${
                  showHistory ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/15"
                }`}
              >
                <History className="size-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Minimize"
                className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={() => {
                  setConversationId(null);
                  setOpen(false);
                  setShowHistory(false);
                }}
                title="Close"
                className="size-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* History drawer */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-b border-border"
                >
                  <div className="max-h-48 overflow-y-auto px-2 py-2 space-y-1 bg-muted/20">
                    {history.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No previous conversations
                      </div>
                    ) : (
                      history.map((c) => (
                        <div
                          key={c.id}
                          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            conversationId === c.id
                              ? "bg-violet/10 text-violet"
                              : "hover:bg-muted text-foreground"
                          }`}
                          onClick={() => {
                            setConversationId(c.id);
                            setShowHistory(false);
                          }}
                        >
                          <span className="flex-1 text-xs font-medium truncate">{c.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {c.messageCount} msg
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConvMutation.mutate(c.id);
                            }}
                            className="size-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-opacity"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat */}
            <div className="flex-1 min-h-0">
              <AiChatPanel
                title="What can I help you find?"
                emptyStateSubtitle="I have access to all your clients, campaigns, integrations, alerts, goals and reports. I can also generate report PDFs for you to download."
                examplePrompts={EXAMPLE_PROMPTS}
                conversationId={conversationId}
                queryKey={["ai", "global", "messages"]}
                loadMessages={() => getGlobalMessages(conversationId!)}
                createConversation={createGlobalConversation}
                sendMessage={sendGlobalMessage}
                onConversationCreated={(id) => {
                  setConversationId(id);
                  void queryClient.invalidateQueries({ queryKey: ["ai", "global", "list"] });
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
