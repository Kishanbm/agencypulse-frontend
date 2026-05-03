import { getApiClient } from "@/lib/api";
import type {
  AiConversation,
  AiMessage,
  CreateConversationResponse,
  SendMessageResponse,
} from "@/types/ai";

// ─── Global AI ──────────────────────────────────────────────────────────────────

const GLOBAL_BASE = "/ai/global";

export async function createGlobalConversation(question: string): Promise<CreateConversationResponse> {
  const api = getApiClient();
  const { data } = await api.post<CreateConversationResponse>(`${GLOBAL_BASE}/conversations`, { question });
  return data;
}

export async function listGlobalConversations(): Promise<AiConversation[]> {
  const api = getApiClient();
  const { data } = await api.get<AiConversation[]>(`${GLOBAL_BASE}/conversations`);
  return data;
}

export async function getGlobalMessages(conversationId: string): Promise<AiMessage[]> {
  const api = getApiClient();
  const { data } = await api.get<AiMessage[]>(`${GLOBAL_BASE}/conversations/${conversationId}/messages`);
  return data;
}

export async function sendGlobalMessage(
  conversationId: string,
  content: string,
): Promise<SendMessageResponse> {
  const api = getApiClient();
  const { data } = await api.post<SendMessageResponse>(
    `${GLOBAL_BASE}/conversations/${conversationId}/messages`,
    { content },
  );
  return data;
}

export async function deleteGlobalConversation(conversationId: string): Promise<void> {
  const api = getApiClient();
  await api.delete(`${GLOBAL_BASE}/conversations/${conversationId}`);
}

// ─── Per-campaign AI (tool-use enabled — uses non-streaming endpoint) ──────────

export function campaignBase(clientId: string, campaignId: string): string {
  return `/clients/${clientId}/campaigns/${campaignId}/ai`;
}

export async function createCampaignConversation(
  clientId: string,
  campaignId: string,
  question: string,
): Promise<CreateConversationResponse> {
  const api = getApiClient();
  const { data } = await api.post<CreateConversationResponse>(
    `${campaignBase(clientId, campaignId)}/conversations`,
    { question },
  );
  return data;
}

export async function sendCampaignMessage(
  clientId: string,
  campaignId: string,
  conversationId: string,
  content: string,
): Promise<SendMessageResponse> {
  const api = getApiClient();
  const { data } = await api.post<SendMessageResponse>(
    `${campaignBase(clientId, campaignId)}/conversations/${conversationId}/messages`,
    { content },
  );
  return data;
}
