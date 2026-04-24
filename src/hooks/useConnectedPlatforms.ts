import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api";
import type { IntegrationPlatform } from "@/src/types/dashboard";

interface Integration {
  platform: IntegrationPlatform;
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "ERROR";
}

export function useConnectedPlatforms(campaignId: string | undefined) {
  const api = getApiClient();

  const { data = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["connectedPlatforms", campaignId],
    queryFn: async () => {
      // Frontend currently uses one ID for both client and campaign (AI Studio clone limitation).
      // When URL routing is updated to include separate clientId + campaignId, update this call.
      const response = await api.get<Integration[]>(
        `/clients/${campaignId}/campaigns/${campaignId}/integrations`
      );
      return response.data;
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });

  const connectedPlatforms = data
    .filter((i) => i.status === "CONNECTED")
    .map((i) => i.platform);

  return { connectedPlatforms, isLoading };
}
