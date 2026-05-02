import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";
import type { IntegrationPlatform } from "@/types/dashboard";

interface MetricDefinition {
  metricKey: string;
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
