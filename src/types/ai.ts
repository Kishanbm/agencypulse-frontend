export interface AiConversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

export interface AiInsight {
  platform: string;
  metricKey: string;
  currentValue: number;
  priorValue: number;
  changePct: number;
  direction: "UP" | "DOWN";
  sentiment: "POSITIVE" | "NEGATIVE";
  headline: string;
}

export interface AiInsightsResponse {
  insights: AiInsight[];
  period: { from: string; to: string };
}

export interface AiSummaryResponse {
  summary: string;
  model: string;
  generatedAt: string;
  cached: boolean;
}

export interface CreateConversationResponse {
  conversationId: string;
  title: string;
  reply: {
    content: string;
    tokenCount: number;
  };
}
