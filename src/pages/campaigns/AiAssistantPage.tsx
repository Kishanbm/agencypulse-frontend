import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ChevronRight, MessageSquarePlus, Trash2, MessageSquare, Sparkles, Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getApiClient } from "@/lib/api";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import {
  createCampaignConversation,
  sendCampaignMessage,
} from "@/lib/ai-service";
import type { AiConversation, AiMessage } from "@/types/ai";

const EXAMPLE_PROMPTS = [
  "Why did conversions drop last week?",
  "Compare GA4 vs Google Ads for the last 30 days",
  "Generate the latest report PDF for me",
  "Which goals are we behind on?",
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function AiAssistantPage() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const api = getApiClient();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const conversationsQueryKey = ["ai", "campaign", "conversations", clientId, campaignId];

  // ─── Load conversation list ─────────────────────────────────────────────────

  const { data: conversations = [] } = useQuery<AiConversation[]>({
    queryKey: conversationsQueryKey,
    queryFn: async () => {
      const { data } = await api.get<AiConversation[]>(
        `/clients/${clientId}/campaigns/${campaignId}/ai/conversations`,
      );
      return data;
    },
  });

  // ─── Delete conversation ────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${clientId}/campaigns/${campaignId}/ai/conversations/${id}`);
    },
    onSuccess: (_d, deletedId) => {
      void qc.invalidateQueries({ queryKey: conversationsQueryKey });
      if (deletedId === activeConvId) setActiveConvId(null);
      toast.success("Conversation deleted");
    },
    onError: () => toast.error("Could not delete"),
  });

  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  return (
    <div className="p-4 sm:p-5 lg:p-7 pb-0 space-y-4 flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap shrink-0"
      >
        <Link to="/clients" className="hover:text-foreground font-medium">Clients</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={`/clients/${clientId}`} className="hover:text-foreground font-medium">Client</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link to={base} className="hover:text-foreground font-medium">Campaign</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-foreground font-semibold">AI Assistant</span>
      </motion.nav>

      {/* Chat shell */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 flex overflow-hidden rounded-2xl min-h-0 border border-border bg-card"
      >
        {/* ── Sidebar: conversation list ── */}
        <div className="w-60 shrink-0 flex flex-col border-r border-border bg-muted/20">
          <button
            onClick={() => setActiveConvId(null)}
            className="m-3 inline-flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg,#5B47E0,#FF8FA9)" }}
          >
            <MessageSquarePlus className="size-3.5" />
            New conversation
          </button>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6 px-2 leading-relaxed">
                Your conversations will appear here.
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`group flex items-start gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                    activeConvId === c.id
                      ? "bg-violet/10 text-violet"
                      : "hover:bg-card text-foreground"
                  }`}
                >
                  <MessageSquare className="size-3.5 shrink-0 mt-0.5 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {c.messageCount} msg · {timeAgo(c.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(c.id);
                    }}
                    className="size-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Sparkles className="size-3" />
              Tool-use enabled · live data
            </div>
          </div>
        </div>

        {/* ── Right: chat panel ── */}
        <div className="flex-1 min-w-0">
          <AiChatPanel
            title="Ask about this campaign"
            emptyStateSubtitle="I can pull live metrics, check goals, see alerts, and generate report PDFs for this campaign."
            examplePrompts={EXAMPLE_PROMPTS}
            conversationId={activeConvId}
            queryKey={["ai", "campaign", "messages", clientId, campaignId]}
            loadMessages={async () => {
              const { data } = await api.get<AiMessage[]>(
                `/clients/${clientId}/campaigns/${campaignId}/ai/conversations/${activeConvId}/messages`,
              );
              return data;
            }}
            createConversation={(question) => createCampaignConversation(clientId!, campaignId!, question)}
            sendMessage={(convId, content) => sendCampaignMessage(clientId!, campaignId!, convId, content)}
            onConversationCreated={(id) => {
              setActiveConvId(id);
              void qc.invalidateQueries({ queryKey: conversationsQueryKey });
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
