import { useState } from "react";
import { 
  Plus, 
  Bell, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreHorizontal, 
  Calendar, 
  ArrowLeft,
  X,
  ChevronDown,
  Globe,
  Info,
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type AlertViewState = "empty" | "dashboard";
type CreationStep = "client" | "choice" | "details" | "metrics";

interface Alert {
  id: string;
  metric: string;
  client: string;
  currentValue: number | string;
  triggerValue: number;
  interval: string;
  lastTriggered: string | null;
  status: "active" | "triggered" | "paused";
}

const initialAlerts: Alert[] = [
  {
    id: "1",
    metric: "Bing Webmaster Tools Clicks",
    client: "Klantroef Studios",
    currentValue: "—",
    triggerValue: 1000000,
    interval: "DAY",
    lastTriggered: null,
    status: "active"
  }
];

const integrations = [
  { name: "Microsoft Ads", icon: Globe },
  { name: "Bing Webmaster Tools", icon: Globe },
  { name: "Bright Local", icon: Globe },
  { name: "Call Source", icon: Globe },
  { name: "Call Tracking Metrics", icon: Globe },
  { name: "Callrail", icon: Globe },
  { name: "Centro", icon: Globe },
  { name: "Centro Basis", icon: Globe },
];

const metrics = [
  { name: "Blocked By RobotsTxt", id: "bing-webmaster-tools.crawl-issue-analytics.blocked-by-robots-txt" },
  { name: "Clicks", id: "bing-webmaster-tools.search-analytics.clicks" },
  { name: "Code 4xx", id: "bing-webmaster-tools.crawl-issue-analytics.code-4xx" },
  { name: "Code 5xx", id: "bing-webmaster-tools.crawl-issue-analytics.code-5xx" },
  { name: "Connection Timeout", id: "bing-webmaster-tools.crawl-issue-analytics.connection-timeout" },
  { name: "DNS Failures", id: "bing-webmaster-tools.crawl-issue-analytics.dns-failures" },
  { name: "Impressions", id: "bing-webmaster-tools.search-analytics.impressions" },
];

export default function Alerts() {
  const [view, setView] = useState<AlertViewState>("empty");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>("client");
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const handleCreateAlert = () => {
    setIsCreateModalOpen(true);
    setCreationStep("client");
  };

  const handleFinishCreation = () => {
    setIsCreateModalOpen(false);
    setView("dashboard");
    toast.success("Alert created successfully");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold">Alerts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold text-muted-foreground">
            <Plus className="w-4 h-4" /> Ask AI
          </Button>
          {view === "dashboard" && (
            <>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <Filter className="w-4 h-4" />
              </Button>
              <Button size="sm" className="h-9 font-bold" onClick={handleCreateAlert}>
                Create Alert
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {view === "empty" ? (
          <EmptyState onCreate={handleCreateAlert} />
        ) : (
          <DashboardView alerts={alerts} />
        )}
      </div>

      {/* Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className={cn(
          "p-0 overflow-hidden transition-all duration-300",
          creationStep === "metrics" ? "max-w-md" : "max-w-4xl"
        )}>
          <AnimatePresence mode="wait">
            {creationStep === "client" && (
              <motion.div 
                key="client"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 space-y-16"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-6 w-full max-w-2xl mx-auto">
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">1</div>
                      <span className="text-sm font-bold text-primary">Choose Client</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-3 opacity-30">
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <span className="text-sm font-bold">Choose Source</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-3 opacity-30">
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                      <span className="text-sm font-bold">Alert Details</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>

                <div className="space-y-10 text-center max-w-xl mx-auto">
                  <h2 className="text-3xl font-bold tracking-tight">Select a Client for your Alert</h2>
                  <div className="space-y-6">
                    <Select defaultValue="klantroef">
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="klantroef">Klantroef Studios</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-start">
                      <Button onClick={() => setCreationStep("choice")} size="lg" className="px-12 h-14 text-lg bg-primary/80 hover:bg-primary/90 shadow-xl shadow-primary/10">Continue</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {creationStep === "choice" && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 space-y-16"
              >
                <div className="flex items-center gap-6 w-full max-w-2xl mx-auto">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-primary/60" />
                    <span className="text-sm font-bold text-primary/60">Choose Client</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">2</div>
                    <span className="text-sm font-bold text-primary">Choose Source</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3 opacity-30">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-sm font-bold">Alert Details</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-12 text-center">
                  <h2 className="text-3xl font-bold tracking-tight">How do you want to create your Alert?</h2>
                  <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
                    <button 
                      onClick={() => setCreationStep("details")}
                      className="flex flex-col items-center gap-6 p-12 border-2 border-primary rounded-2xl bg-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98] group shadow-xl shadow-primary/5"
                    >
                      <div className="w-16 h-12 border border-primary/30 rounded-lg flex items-center justify-center bg-card shadow-sm">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-primary">New Alert</p>
                        <p className="text-sm text-primary/60">Start from scratch</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setCreationStep("details")}
                      className="flex flex-col items-center gap-6 p-12 border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <div className="flex gap-1">
                        <div className="w-12 h-10 border border-border rounded-lg bg-card flex flex-col p-1.5 gap-1.5 shadow-sm">
                          <div className="h-1.5 w-full bg-muted rounded-full" />
                          <div className="flex-1 flex gap-1.5">
                            <div className="w-1/2 bg-muted/50 rounded" />
                            <div className="w-1/2 bg-muted/50 rounded" />
                          </div>
                        </div>
                        <div className="w-12 h-10 border border-border rounded-lg bg-card flex flex-col p-1.5 gap-1.5 -ml-6 mt-3 shadow-md">
                          <div className="h-1.5 w-full bg-muted rounded-full" />
                          <div className="flex-1 flex gap-1.5">
                            <div className="w-1/2 bg-muted/50 rounded" />
                            <div className="w-1/2 bg-muted/50 rounded" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold">Clone existing Alert</p>
                        <p className="text-sm text-muted-foreground">Use a template</p>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {creationStep === "details" && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 space-y-16"
              >
                <div className="flex items-center gap-6 w-full max-w-2xl mx-auto">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-primary/60" />
                    <span className="text-sm font-bold text-primary/60">Choose Client</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-primary/60" />
                    <span className="text-sm font-bold text-primary/60">Choose Source</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">3</div>
                    <span className="text-sm font-bold text-primary">Alert Details</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-12 max-w-3xl mx-auto w-full">
                  <h2 className="text-3xl font-bold tracking-tight text-center">Alert Details</h2>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground">Metric</Label>
                      <div 
                        onClick={() => setCreationStep("metrics")}
                        className="h-14 w-full border border-border rounded-lg px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-all hover:border-primary/50"
                      >
                        <span className="text-sm text-muted-foreground truncate">{selectedMetric || "Search or select a metric"}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground">Condition</Label>
                      <Select defaultValue="greater">
                        <SelectTrigger className="h-14 text-sm">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greater">Greater than or equal to</SelectItem>
                          <SelectItem value="less">Less than or equal to</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground">Trigger Value</Label>
                      <Input placeholder="Enter trigger value" className="h-14 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground">Interval</Label>
                      <Select defaultValue="month">
                        <SelectTrigger className="h-14 text-sm">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-foreground">Description (Optional)</Label>
                      <Input placeholder="Add additional details or context" className="h-14 text-sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-8">
                    <Button onClick={handleFinishCreation} size="lg" className="px-12 h-14 text-lg bg-primary/40 hover:bg-primary/50 text-primary-foreground shadow-lg shadow-primary/5">Create Alert</Button>
                    <Button variant="outline" onClick={() => setCreationStep("choice")} size="lg" className="h-14 px-12 text-lg">Back</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {creationStep === "metrics" && (
              <motion.div 
                key="metrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-[600px]"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIntegration && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIntegration(null)}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    <h3 className="font-bold">{selectedIntegration || "Metric"}</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreationStep("details")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {!selectedIntegration ? (
                    integrations.map((m) => (
                      <button 
                        key={m.name}
                        onClick={() => setSelectedIntegration(m.name)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                            <m.icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{m.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))
                  ) : (
                    metrics.map((m) => (
                      <button 
                        key={m.id}
                        onClick={() => {
                          setSelectedMetric(m.name);
                          setCreationStep("details");
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border/50"
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                              <Globe className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{m.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground pl-7">{m.id}</span>
                        </div>
                        <div className="w-6 h-6 rounded border border-border flex items-center justify-center">
                          <span className="text-[10px] font-bold text-muted-foreground">#</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">React Timely with Alerts</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Be the first to know and react when key client metrics hit critical thresholds.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Set custom target or percentage thresholds",
              "Get alerts as soon as thresholds are met",
              "Stay informed and ready to take action"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-6 pt-4">
            <Button size="lg" className="px-8 h-12 bg-primary/60 text-primary-foreground hover:bg-primary/70 shadow-lg shadow-primary/20" onClick={onCreate}>
              Create Alert
            </Button>
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl p-8 space-y-8">
            <div className="flex gap-4">
              <div className="flex-1 bg-background border border-border rounded-lg p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold leading-tight">
                    Google Analytics Bounce Rate <span className="font-normal text-muted-foreground">has increased by 10%.</span>
                  </p>
                </div>
              </div>
              <div className="flex-1 bg-background border border-border rounded-lg p-4 shadow-sm space-y-3 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-500 flex items-center justify-center">
                    <Globe className="w-2.5 h-2.5 text-white" />
                  </div>
                  <p className="text-xs font-bold leading-tight">
                    Instagram Followers <span className="font-normal text-muted-foreground">has decreased by 1,000.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Metric</span>
                <span>Condition</span>
                <span>Interval</span>
              </div>
              {[
                { name: "Google Ads Spend", condition: "> 2,000", interval: "MONTH", icon: Globe, iconColor: "text-blue-500" },
                { name: "Google Analytics Bounce Rate", condition: "+ 10", interval: "WEEK", icon: Activity, iconColor: "text-amber-500" },
                { name: "Instagram Followers", condition: "< 1,000", interval: "MONTH", icon: Globe, iconColor: "text-pink-500" },
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-4">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("w-3 h-3", item.iconColor)} />
                    <span className="text-[9px] font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[8px] font-bold">{item.condition}</div>
                  </div>
                  <div>
                    <Badge className="text-[8px] font-bold h-4 px-1.5 bg-blue-400">{item.interval}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="p-6 space-y-8">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="h-8 px-3 gap-2 bg-muted/50 border-border text-xs font-medium">
          Client is <span className="font-bold">Any</span>
          <X className="w-3 h-3 cursor-pointer" />
        </Badge>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-border text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Add Filter
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-muted-foreground">
          Clear All
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Showing {alerts.length} of {alerts.length} Rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="p-4 w-12"><div className="w-4 h-4 border border-border rounded" /></th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metric</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Client</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Current Value</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Trigger Value</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Interval</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-1">Last Triggered <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <td className="p-4"><div className="w-4 h-4 border border-border rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                        <Globe className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary hover:underline cursor-pointer">{alert.metric}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-xs font-medium text-primary hover:underline cursor-pointer">{alert.client}</td>
                  <td className="p-4 text-center text-xs font-medium text-muted-foreground">{alert.currentValue}</td>
                  <td className="p-4 text-center text-xs font-bold">{alert.triggerValue.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <Badge className="bg-blue-400 text-white text-[8px] font-bold h-5 px-2">
                      {alert.interval}
                    </Badge>
                  </td>
                  <td className="p-4 text-center text-xs font-medium text-muted-foreground">{alert.lastTriggered || "—"}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
