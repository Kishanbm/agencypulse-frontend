import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";
import type { IntegrationPlatform } from "@/types/dashboard";

interface Integration {
  platform: IntegrationPlatform;
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "ERROR";
}

export function useConnectedPlatforms(
  clientId: string | undefined,
  campaignId: string | undefined,
) {
  const api = getApiClient();

  const { data = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["connectedPlatforms", clientId, campaignId],
    queryFn: async () => {
      const response = await api.get<Integration[]>(
        `/clients/${clientId}/campaigns/${campaignId}/integrations`,
      );
      return response.data;
    },
    enabled: !!clientId && !!campaignId,
    staleTime: 2 * 60 * 1000,
  });

  const connectedPlatforms = data
    .filter((i) => i.status === "CONNECTED")
    .map((i) => i.platform);

  return { connectedPlatforms, isLoading };
}
