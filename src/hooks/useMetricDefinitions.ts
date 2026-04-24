import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api";
import type { IntegrationPlatform } from "@/src/types/dashboard";

interface MetricDefinition {
  key: string;
  label: string;
  unit: string;
  platform: string;
}

export function useMetricDefinitions(platform: IntegrationPlatform | undefined) {
  const api = getApiClient();

  const { data = [], isLoading } = useQuery<MetricDefinition[]>({
    queryKey: ["metricDefinitions", platform],
    queryFn: async () => {
      const response = await api.get<MetricDefinition[]>(`/metrics/definitions/${platform}`);
      return response.data;
    },
    enabled: !!platform,
    staleTime: 30 * 60 * 1000, // metric definitions rarely change — cache 30min
  });

  return { metrics: data, isLoading };
}
