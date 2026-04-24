import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ExternalLink, CheckCircle2, AlertCircle, Shield, Zap, Info, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const integrations = [
  { 
    name: "Google Ads", 
    category: "Advertising", 
    icon: "https://www.gstatic.com/images/branding/product/1x/google_ads_48dp.png", 
    connected: 12, 
    status: "Healthy",
    isConnected: true,
    description: "Connect your Google Ads account to track campaign performance, conversion rates, and ROI directly in your dashboard."
  },
  { 
    name: "Facebook Ads", 
    category: "Advertising", 
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png", 
    connected: 8, 
    status: "Healthy",
    isConnected: true,
    description: "Sync your Facebook Ads data to monitor ad spend, reach, and engagement across all your social campaigns."
  },
  { 
    name: "Google Analytics 4", 
    category: "Analytics", 
    icon: "https://www.gstatic.com/images/branding/product/1x/google_analytics_48dp.png", 
    connected: 15, 
    status: "Warning",
    isConnected: true,
    description: "Get deep insights into user behavior, traffic sources, and website performance with GA4 integration."
  },
  { 
    name: "Instagram", 
    category: "Social", 
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png", 
    connected: 0, 
    status: "Not Connected",
    isConnected: false,
    description: "Connect your Instagram Business account to track follower growth, post engagement, and story performance."
  },
  { 
    name: "LinkedIn Ads", 
    category: "Advertising", 
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png", 
    connected: 0, 
    status: "Not Connected",
    isConnected: false,
    description: "Monitor your B2B advertising performance on LinkedIn, including lead generation and sponsored content metrics."
  },
  { 
    name: "YouTube", 
    category: "Social", 
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png", 
    connected: 4, 
    status: "Healthy",
    isConnected: true,
    description: "Track video views, watch time, and subscriber growth by connecting your YouTube channel."
  },
  { 
    name: "Search Console", 
    category: "SEO", 
    icon: "https://www.gstatic.com/images/branding/product/1x/search_console_48dp.png", 
    connected: 10, 
    status: "Healthy",
    isConnected: true,
    description: "Monitor your site's presence in Google Search results, including impressions, clicks, and average position."
  },
  { 
    name: "Mailchimp", 
    category: "Email", 
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Mailchimp_Logo.svg/1200px-Mailchimp_Logo.svg.png", 
    connected: 0, 
    status: "Not Connected",
    isConnected: false,
    description: "Sync your email marketing data to track open rates, click-through rates, and campaign performance."
  },
];

export default function DataSources() {
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrations[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your agency's integrations and connections.</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={() => toast.info("Select a source to connect")}>
          <Plus className="w-4 h-4" />
          Connect New Source
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search integrations..." className="pl-10 bg-card border-border" />
        </div>
        <div className="flex gap-2">
          {["All", "Advertising", "Analytics", "SEO", "Social", "Email"].map((cat) => (
            <Button key={cat} variant="outline" size="sm" className="text-xs border-border">
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {integrations.map((integration) => (
          <Card 
            key={integration.name} 
            className="group hover:shadow-md transition-all border-border bg-card cursor-pointer"
            onClick={() => setSelectedIntegration(integration)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="w-10 h-10 rounded-lg bg-muted p-2 flex items-center justify-center">
                <img src={integration.icon} alt={integration.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-border">
                {integration.category}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">{integration.name}</h3>
                <div className="flex items-center gap-1">
                  {integration.status === "Healthy" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : integration.status === "Warning" ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    integration.status === "Healthy" ? "text-emerald-600" : 
                    integration.status === "Warning" ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {integration.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                <span>Connected Clients</span>
                <span className="font-bold text-foreground">{integration.connected}</span>
              </div>

              <div className="flex gap-2">
                {integration.isConnected ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 text-xs border-border gap-1" onClick={(e) => { e.stopPropagation(); /* Handle manage */ }}>
                      Manage
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs border-border" onClick={(e) => { e.stopPropagation(); /* Handle add */ }}>
                      Add Connection
                    </Button>
                  </>
                ) : (
                  <Button className="w-full text-xs bg-primary text-primary-foreground" onClick={(e) => { e.stopPropagation(); setSelectedIntegration(integration); }}>
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedIntegration} onOpenChange={(open) => !open && setSelectedIntegration(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-muted p-2.5 flex items-center justify-center">
                <img src={selectedIntegration?.icon} alt={selectedIntegration?.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">{selectedIntegration?.name}</DialogTitle>
                <Badge variant="outline" className="mt-1 text-[10px] font-bold uppercase border-border">
                  {selectedIntegration?.category}
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground pt-2">
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Current Status</span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedIntegration?.status === "Healthy" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : selectedIntegration?.status === "Warning" ? (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={cn(
                  "text-sm font-bold",
                  selectedIntegration?.status === "Healthy" ? "text-emerald-600" : 
                  selectedIntegration?.status === "Warning" ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {selectedIntegration?.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Connected</p>
                <p className="text-xl font-bold text-foreground">{selectedIntegration?.connected}</p>
                <p className="text-[10px] text-muted-foreground">Active Clients</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Security</p>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Shield className="w-3 h-3" />
                  <p className="text-xs font-bold">Encrypted</p>
                </div>
                <p className="text-[10px] text-muted-foreground">OAuth 2.0</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Features</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" />
                  Real-time data synchronization
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" />
                  Automated reporting & dashboards
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" className="flex-1 border-border" onClick={() => setSelectedIntegration(null)}>
              Cancel
            </Button>
            {selectedIntegration?.isConnected ? (
              <Button className="flex-1 bg-primary text-primary-foreground gap-2">
                Manage Connection
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="flex-1 bg-primary text-primary-foreground gap-2">
                Connect {selectedIntegration?.name}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
