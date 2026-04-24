import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiClient } from "@/src/lib/api";

interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
  _count: {
    widgets: number;
  };
}

export function DashboardsList() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const api = getApiClient();

  const {
    data: dashboards = [],
    isLoading,
    error,
  } = useQuery<Dashboard[]>({
    queryKey: ["dashboards", campaignId],
    queryFn: async () => {
      const response = await api.get(
        `/campaigns/${campaignId}/dashboards`
      );
      console.log('Dashboard API response:', response.data);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return data as Dashboard[];
    },
    enabled: !!campaignId,
  });

  const handleDashboardClick = (dashboardId: string) => {
    navigate(`/dashboard/clients/${campaignId}/dashboards/${dashboardId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-foreground">Dashboards</h3>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-foreground">Dashboards</h3>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm mb-4">
            Failed to load dashboards
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Dashboards</h3>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Create Dashboard
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No dashboards yet</p>
          <Button className="bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {dashboards.map((dashboard) => (
            <Card
              key={dashboard.id}
              className="border-border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleDashboardClick(dashboard.id)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{dashboard.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {dashboard._count.widgets} widgets
                  </p>
                </div>
                {dashboard.isDefault && <Badge>Default</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
