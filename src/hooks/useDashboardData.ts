import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api";

interface WidgetDataResult {
  widgetId: string;
  widgetType: string;
  data: unknown;
}

interface DashboardDataResponse {
  results: WidgetDataResult[];
}

interface UseDashboardDataProps {
  campaignId?: string;
  dashboardId?: string;
  widgetIds: string[];
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export function useDashboardData({
  campaignId,
  dashboardId,
  widgetIds,
  from,
  to,
}: UseDashboardDataProps) {
  const api = getApiClient();

  // TanStack Query with proper cache key including campaignId
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboardData", campaignId, dashboardId, from, to],
    queryFn: async () => {
      const response = await api.post<DashboardDataResponse>(
        `/campaigns/${campaignId}/dashboards/${dashboardId}/widgets/data`,
        {
          widgetIds,
          from,
          to,
        }
      );
      return response.data;
    },
    // Only run query when all required params are present and date range is valid
    enabled: !!campaignId && !!dashboardId && from <= to && widgetIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Normalize response once via useMemo
  const widgetDataMap = useMemo(
    () => {
      if (!data?.results) return {};
      return data.results.reduce(
        (acc, item) => {
          acc[item.widgetId] = item;
          return acc;
        },
        {} as Record<string, WidgetDataResult>
      );
    },
    [data]
  );

  // Format error message
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Failed to load dashboard data"
    : null;

  return {
    data,
    widgetDataMap,
    isLoading,
    error: errorMessage,
    refetch,
  };
}
