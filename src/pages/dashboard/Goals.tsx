import { useState } from "react";
import { 
  Plus, 
  Target, 
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type GoalViewState = "empty" | "dashboard";
type CreationStep = "choice" | "details" | "metrics" | "advanced";

interface Goal {
  id: string;
  name: string;
  client: string;
  status: "ON TRACK" | "OFF TRACK" | "COMPLETE" | "INITIALIZING";
  current: number | string;
  target: number;
  progress: number;
  interval: string;
}

const initialGoals: Goal[] = [
  {
    id: "1",
    name: "increase revenue",
    client: "Klantroef Studios",
    status: "INITIALIZING",
    current: "—",
    target: 1000000,
    progress: 0,
    interval: "Monthly"
  }
];

const metrics = [
  { name: "Adform", icon: Globe },
  { name: "Adroll", icon: Globe },
  { name: "AgencyAnalytics Custom Metrics", icon: Globe },
  { name: "Amazon Ads", icon: Globe },
  { name: "Avanser", icon: Globe },
  { name: "Big Commerce", icon: Globe },
  { name: "Microsoft Ads", icon: Globe },
  { name: "Bing Webmaster Tools", icon: Globe },
  { name: "Bright Local", icon: Globe },
  { name: "Call Source", icon: Globe },
  { name: "Call Tracking Metrics", icon: Globe },
  { name: "Callrail", icon: Globe },
];

export default function Goals() {
  const [view, setView] = useState<GoalViewState>("empty");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>("choice");
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleCreateGoal = () => {
    setIsCreateModalOpen(true);
    setCreationStep("choice");
  };

  const handleFinishCreation = () => {
    setIsCreateModalOpen(false);
    setView("dashboard");
    toast.success("Goal created successfully");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold">Goals</h1>
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
              <Button size="sm" className="h-9 font-bold" onClick={handleCreateGoal}>
                Create Goal
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {view === "empty" ? (
          <EmptyState onCreate={handleCreateGoal} />
        ) : (
          <DashboardView goals={goals} />
        )}
      </div>

      {/* Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className={cn(
          "p-0 overflow-hidden transition-all duration-300",
          creationStep === "metrics" ? "max-w-md" : "max-w-lg"
        )}>
          <AnimatePresence mode="wait">
            {creationStep === "choice" && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">How do you want to create your goal?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <button 
                    onClick={() => setCreationStep("details")}
                    className="w-full flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-muted group-hover:border-primary mt-1 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">New Goal</p>
                      <p className="text-sm text-muted-foreground">Start from scratch</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setCreationStep("details")}
                    className="w-full flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-muted group-hover:border-primary mt-1 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">Clone Goal</p>
                      <p className="text-sm text-muted-foreground">Use an existing goal as a template</p>
                    </div>
                  </button>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button disabled>Continue</Button>
                </DialogFooter>
              </motion.div>
            )}

            {creationStep === "details" && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <DialogHeader className="flex-row items-center gap-4 space-y-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreationStep("choice")}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle className="text-xl font-bold">Set Goal Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Client</Label>
                    <Select defaultValue="klantroef">
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="klantroef">Klantroef Studios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Goal Name</Label>
                    <Input placeholder="E.g. Increase Revenue" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Metric</Label>
                    <div 
                      onClick={() => setCreationStep("metrics")}
                      className="h-11 w-full border border-border rounded-md px-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">{selectedMetric || "Select a metric you want to track"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Type</Label>
                    <RadioGroup defaultValue="one-time" className="flex gap-4">
                      <div className="flex-1 flex items-center space-x-2 border border-border rounded-md p-3">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time" className="font-medium">One-time</Label>
                      </div>
                      <div className="flex-1 flex items-center space-x-2 border border-border rounded-md p-3">
                        <RadioGroupItem value="recurring" id="recurring" />
                        <Label htmlFor="recurring" className="font-medium">Recurring</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => setCreationStep("advanced")}>Continue</Button>
                </DialogFooter>
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
                  <h3 className="font-bold">Metric</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreationStep("details")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {metrics.map((m) => (
                    <button 
                      key={m.name}
                      onClick={() => {
                        setSelectedMetric(m.name);
                        setCreationStep("details");
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <m.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {creationStep === "advanced" && (
              <motion.div 
                key="advanced"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <DialogHeader className="flex-row items-center gap-4 space-y-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreationStep("details")}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle className="text-xl font-bold">Set Goal Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground">Condition</Label>
                      <Select defaultValue="greater">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greater">Greater than or equal to</SelectItem>
                          <SelectItem value="less">Less than or equal to</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground">Target Value</Label>
                      <div className="relative">
                        <Input placeholder="Enter value" className="h-11 pr-8" />
                        <span className="absolute right-3 top-3 text-muted-foreground">$</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Start Date <Info className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <div className="relative">
                      <Input value="Apr 7, 2026" readOnly className="h-11 pl-3" />
                      <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Due Date (Optional)</Label>
                    <div className="relative">
                      <Input placeholder="Select Date" readOnly className="h-11 pl-3" />
                      <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Description (Optional)</Label>
                    <textarea 
                      placeholder="Add additional details or context" 
                      className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleFinishCreation}>Create</Button>
                </DialogFooter>
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
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Goals</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Give clients clear confirmation you're helping them achieve their performance targets.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Set budgets, targets, and milestones",
              "Track progress and keep clients informed",
              "Boost results with team accountability"
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
            <Button size="lg" className="px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={onCreate}>
              Create Goal
            </Button>
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
          <img 
            src="https://picsum.photos/seed/goals/800/600" 
            alt="Goals Preview" 
            className="relative rounded-xl shadow-2xl border border-border/50 w-full"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardView({ goals }: { goals: Goal[] }) {
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="On Track" value={0} color="#10B981" />
        <SummaryCard title="Off Track" value={0} color="#EF4444" />
        <SummaryCard title="Complete" value={0} color="#3B82F6" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Showing {goals.length} of {goals.length} Rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="p-4 w-12"><div className="w-4 h-4 border border-border rounded" /></th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1">Status <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Period</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <td className="p-4"><div className="w-4 h-4 border border-border rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary hover:underline cursor-pointer">{goal.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium text-primary hover:underline cursor-pointer">{goal.client}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-bold h-5 px-2">
                      {goal.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs font-medium text-muted-foreground">{goal.current}</td>
                  <td className="p-4 text-xs font-bold">{goal.target.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/20" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{goal.progress.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium text-muted-foreground">{goal.interval}</td>
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

function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center space-y-4">
      <div className="w-full text-left">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={364.4}
            strokeDashoffset={364.4}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-4xl font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}
