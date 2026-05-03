import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Sparkles, Wrench, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { MarkdownMessage } from "@/components/ai/MarkdownMessage";
import type { AiMessage, SendMessageResponse, CreateConversationResponse } from "@/types/ai";

const MAX_CHARS = 2000;

export interface AiChatPanelProps {
  /** Title shown above the messages */
  title?: string;
  /** Subtitle / context blurb shown when there are no messages yet */
  emptyStateSubtitle?: string;
  /** Suggested first prompts shown when there are no messages */
  examplePrompts?: string[];
  /** Active conversation id (null = no conversation yet, will be created on first send) */
  conversationId: string | null;
  /** React-Query key prefix for caching messages */
  queryKey: unknown[];
  /** Loader for messages of an existing conversation */
  loadMessages: () => Promise<AiMessage[]>;
  /** Creator: sends the first user question, returns a new conversation + reply */
  createConversation: (question: string) => Promise<CreateConversationResponse>;
  /** Sender: sends a follow-up message into an existing conversation */
  sendMessage: (conversationId: string, content: string) => Promise<SendMessageResponse>;
  /** Called when a brand-new conversation is created (so caller can persist its id) */
  onConversationCreated?: (id: string) => void;
}

export function AiChatPanel(props: AiChatPanelProps) {
  const {
    title = "AI Assistant",
    emptyStateSubtitle,
    examplePrompts = [],
    conversationId,
    queryKey,
    loadMessages,
    createConversation,
    sendMessage,
    onConversationCreated,
  } = props;

  const [input, setInput] = useState("");
  const [pendingTools, setPendingTools] = useState<string[] | null>(null);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Load existing messages ─────────────────────────────────────────────────

  const { data: messages = [], isLoading } = useQuery<AiMessage[]>({
    queryKey: [...queryKey, conversationId],
    queryFn: loadMessages,
    enabled: !!conversationId,
    staleTime: 60_000,
  });

  // ─── Send message mutation (handles both create-new and reply) ───────────────

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) {
        const created = await createConversation(content);
        onConversationCreated?.(created.conversationId);
        return {
          newConversationId: created.conversationId,
          userContent: content,
          reply: created.reply,
        };
      }
      const reply = await sendMessage(conversationId, content);
      return {
        newConversationId: conversationId,
        userContent: content,
        reply,
      };
    },
    onMutate: (content) => {
      setPendingTools([]);
    },
    onSuccess: (result) => {
      setPendingTools(null);
      // Invalidate to refetch the canonical message list from the server
      void queryClient.invalidateQueries({ queryKey: [...queryKey, result.newConversationId] });
      // Surface tool usage as a subtle toast for transparency
      if (result.reply.toolCalls && result.reply.toolCalls.length > 0) {
        toast.success(
          `AI used: ${[...new Set(result.reply.toolCalls)].join(", ")}`,
          { duration: 2000 },
        );
      }
    },
    onError: (err) => {
      setPendingTools(null);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "AI request failed — please try again";
      toast.error(msg);
    },
  });

  // ─── Optimistic user message (shown while waiting) ──────────────────────────

  const optimisticUser =
    sendMutation.isPending && sendMutation.variables
      ? sendMutation.variables
      : null;

  // ─── Auto-scroll to bottom on new messages ──────────────────────────────────

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, optimisticUser, sendMutation.isPending]);

  // ─── Focus input on mount ────────────────────────────────────────────────────

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  }

  function pickExample(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const showEmptyState = !conversationId && messages.length === 0 && !optimisticUser;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading && conversationId ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin mr-2" />
            Loading conversation…
          </div>
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-violet to-pink-500 flex items-center justify-center mb-3 shadow-lg">
              <Sparkles className="size-6 text-white" />
            </div>
            <h3 className="font-semibold text-base text-foreground mb-1">{title}</h3>
            {emptyStateSubtitle && (
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-5">
                {emptyStateSubtitle}
              </p>
            )}
            {examplePrompts.length > 0 && (
              <div className="flex flex-col gap-1.5 w-full max-w-sm">
                {examplePrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => pickExample(p)}
                    className="text-xs px-3 py-2 text-left rounded-xl border border-border bg-card hover:border-violet/40 hover:bg-violet/5 transition-colors text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {/* Optimistic user message while server thinks */}
            {optimisticUser && (
              <MessageBubble role="user" content={optimisticUser} />
            )}
            {/* Thinking indicator */}
            {sendMutation.isPending && (
              <div className="flex gap-2.5">
                <div className="size-7 rounded-xl flex items-center justify-center shrink-0 bg-foreground">
                  <Bot className="size-3.5 text-white" />
                </div>
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-card border border-border max-w-[78%]">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {pendingTools && pendingTools.length > 0 ? (
                      <>
                        <Wrench className="size-3 animate-pulse" />
                        Running {pendingTools.join(", ")}…
                      </>
                    ) : (
                      <>
                        <span className="flex gap-1">
                          <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="size-1.5 rounded-full bg-violet animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                        Thinking…
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-violet/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything — or try 'generate Q4 report for Acme'"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none max-h-32 leading-relaxed"
            disabled={sendMutation.isPending}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || sendMutation.isPending}
            whileTap={{ scale: 0.95 }}
            className="size-8 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }}
            aria-label="Send"
          >
            {sendMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </motion.button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 px-1">
          <span>Enter to send · Shift+Enter for newline</span>
          <span>{input.length}/{MAX_CHARS}</span>
        </div>
      </form>
    </div>
  );
}

// ─── Message bubble ─────────────────────────────────────────────────────────────

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
          isUser
            ? "rounded-2xl rounded-tr-sm text-white"
            : "rounded-2xl rounded-tl-sm bg-card border border-border"
        }`}
        style={
          isUser
            ? { background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }
            : undefined
        }
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
