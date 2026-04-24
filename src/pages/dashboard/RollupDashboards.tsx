import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  LayoutDashboard, 
  ChevronRight, 
  HelpCircle, 
  Layout, 
  Search, 
  Bell, 
  Clock, 
  Share2, 
  Undo2, 
  Redo2, 
  Eye, 
  History, 
  X, 
  Maximize2, 
  Minus, 
  ChevronDown, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Palette, 
  BarChart3, 
  Type, 
  Image as ImageIcon, 
  Code, 
  Target, 
  TrendingUp, 
  CheckSquare,
  Copy,
  Layers,
  MoreHorizontal,
  Info,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type ViewState = "empty" | "wizard" | "success" | "editor";

export default function RollupDashboards() {
  const [view, setView] = useState<ViewState>("empty");
  const [wizardStep, setWizardStep] = useState(1);
  const [dashboards, setDashboards] = useState<{ id: string; name: string }[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isPreview, setIsPreview] = useState(false);

  const handleCreateDashboard = () => {
    setView("wizard");
    setWizardStep(1);
  };

  const handleFinishWizard = () => {
    setView("success");
    setTimeout(() => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newDashboard = { id: newId, name: "Untitled Dashboard" };
      setDashboards([...dashboards, newDashboard]);
      setActiveDashboardId(newId);
      setView("editor");
    }, 1500);
  };

  if (view === "empty") {
    return <EmptyState onCreate={handleCreateDashboard} />;
  }

  if (view === "wizard") {
    return <Wizard step={wizardStep} onNext={() => setWizardStep(wizardStep + 1)} onFinish={handleFinishWizard} onCancel={() => setView("empty")} />;
  }

  if (view === "success") {
    return <SuccessState />;
  }

  return (
    <DashboardEditor 
      dashboards={dashboards} 
      activeId={activeDashboardId} 
      onAdd={() => handleCreateDashboard()} 
      zoom={zoom}
      setZoom={setZoom}
      isPreview={isPreview}
      setIsPreview={setIsPreview}
    />
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full bg-muted/30">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Button className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none h-9" onClick={onCreate}>
            <Plus className="w-4 h-4" />
            Add Dashboard
          </Button>
        </div>
        <div className="flex-1 p-2">
          <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            My First Dashboard
          </div>
          <div className="px-3 py-2 rounded-lg bg-muted text-foreground font-medium text-xs">
            Roll-up Dashboards
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-medium">Untitled Dashboard</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Roll-up Dashboards</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Deliver the big-picture view your clients and agency need.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  "Aggregate key metrics across multiple clients",
                  "Unlock agency-wide insights",
                  "Compare the performance of multiple clients side by side"
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
                  Create Dashboard
                </Button>
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-4 h-4" />
                  Help
                </Button>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                Looking to send aggregated performance results to clients? <button className="text-primary hover:underline font-medium">Try Roll-up Reports</button>
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <img 
                src="https://picsum.photos/seed/dashboard/800/600" 
                alt="Dashboard Preview" 
                className="relative rounded-xl shadow-2xl border border-border/50 w-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Wizard({ step, onNext, onFinish, onCancel }: { step: number; onNext: () => void; onFinish: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
          <span className="font-bold text-lg">Create Roll-up Dashboard</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center pt-12 px-4">
        {/* Stepper */}
        <div className="w-full max-w-4xl flex items-center mb-16 px-8">
          {[
            { num: 1, label: "Choose Source" },
            { num: 2, label: "Pick a Name" },
            { num: 3, label: "Start Design" }
          ].map((s, i) => (
            <div key={s.num} className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {s.num}
                </div>
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  step >= s.num ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className="flex-1 mx-4 h-px bg-border relative">
                  <div className={cn(
                    "absolute inset-0 bg-primary transition-all duration-500",
                    step > s.num ? "w-full" : "w-0"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="w-full max-w-5xl bg-card border border-border rounded-xl shadow-sm p-12">
          {step === 1 && (
            <div className="space-y-12 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Choose a Starting Point</h2>
                <p className="text-muted-foreground">
                  Choose to start fresh with a blank dashboard, use one of your own templates or one of ours
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Plus, title: "Blank Dashboard", desc: "Start fresh with a clean slate" },
                  { icon: Layout, title: "Template", desc: "Use a premade template or one of yours" },
                  { icon: Copy, title: "Clone Existing Dashboard", desc: "Copy a dashboard from another dashboard" }
                ].map((item) => (
                  <button 
                    key={item.title}
                    onClick={onNext}
                    className="flex flex-col items-center gap-6 p-8 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-center"
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto space-y-8 py-12">
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Pick a Name</h2>
                <p className="text-muted-foreground">Give your dashboard a descriptive name</p>
              </div>
              <div className="space-y-4">
                <Input placeholder="Untitled Dashboard" className="h-12 text-lg px-4" autoFocus />
                <Button className="w-full h-12 text-lg font-bold" onClick={onNext}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md mx-auto space-y-8 py-12 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Ready to Design?</h2>
                <p className="text-muted-foreground">Your dashboard is ready for customization</p>
              </div>
              <div className="p-8 bg-muted/50 rounded-xl border border-border">
                <LayoutDashboard className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="font-bold text-xl">Untitled Dashboard</p>
              </div>
              <Button className="w-full h-12 text-lg font-bold" onClick={onFinish}>Create Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
        <h2 className="text-3xl font-bold text-muted-foreground">Dashboard Created</h2>
      </motion.div>
    </div>
  );
}

function DashboardEditor({ 
  dashboards, 
  activeId, 
  onAdd, 
  zoom, 
  setZoom, 
  isPreview, 
  setIsPreview 
}: { 
  dashboards: { id: string; name: string }[]; 
  activeId: string | null; 
  onAdd: () => void;
  zoom: number;
  setZoom: (z: number) => void;
  isPreview: boolean;
  setIsPreview: (p: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<"live" | "sample">("live");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const openTool = (tool: string) => {
    if (activeTool === tool && isToolPanelOpen) {
      setIsToolPanelOpen(false);
      setActiveTool(null);
    } else {
      setActiveTool(tool);
      setIsToolPanelOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 bg-muted/50 px-2 py-0.5 rounded border border-border">
              <span className="text-[10px] font-medium text-muted-foreground">Roll-up</span>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-0.5 rounded-md mr-4">
            <button 
              onClick={() => setActiveTab("live")}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-sm transition-all",
                activeTab === "live" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Live Data
            </button>
            <button 
              onClick={() => setActiveTab("sample")}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-sm transition-all",
                activeTab === "sample" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sample Data
            </button>
          </div>
          <div className="flex items-center gap-1 mr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 className="w-4 h-4" /></Button>
          </div>
          <div className="flex bg-muted p-0.5 rounded-md mr-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7", device === "desktop" ? "bg-card shadow-sm" : "")}
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7", device === "mobile" ? "bg-card shadow-sm" : "")}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-bold text-muted-foreground">
              <Layout className="w-4 h-4" /> Page Setup
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-bold text-muted-foreground">
              <Palette className="w-4 h-4" /> Theme
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold border-border">
              <Calendar className="w-4 h-4" /> Last Month <ChevronDown className="w-3 h-3" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><History className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold border-border" onClick={() => setIsPreview(!isPreview)}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium ml-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Auto saved
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-muted/30 relative">
        {/* Sidebar */}
        {!isPreview && (
          <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <Button className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none h-9" onClick={onAdd}>
                <Plus className="w-4 h-4" />
                Add dashboard
              </Button>
            </div>
            <div className="flex-1 p-2 space-y-1">
              {dashboards.map((d) => (
                <div 
                  key={d.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg cursor-pointer group",
                    activeId === d.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-xs font-bold">{d.name}</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-12 flex flex-col items-center relative">
          <div 
            className={cn(
              "bg-white shadow-2xl rounded-sm transition-all duration-300 flex flex-col items-center justify-center p-12 text-center",
              device === "mobile" ? "w-[375px] min-h-[667px]" : "w-full max-w-7xl min-h-[800px]"
            )}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div className="max-w-md space-y-6">
              <div className="relative w-48 h-32 mx-auto">
                <div className="absolute inset-0 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <div className="w-24 h-4 bg-muted-foreground/20 rounded-full" />
                </div>
                <MousePointer2 className="absolute bottom-0 right-4 w-12 h-12 text-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">This page is empty</h3>
                <p className="text-muted-foreground">Start building this page by dragging widgets here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tools */}
        {!isPreview && (
          <div className="w-16 border-l border-border bg-card flex flex-col items-center py-6 gap-6 shrink-0">
            <ToolIcon icon={Plus} label="Build with AI" onClick={() => openTool("Build with AI")} />
            <ToolIcon icon={BarChart3} label="Integrations Metrics" onClick={() => openTool("Integrations Metrics")} />
            <ToolIcon icon={Type} label="Content Blocks" onClick={() => openTool("Content Blocks")} />
            <ToolIcon icon={ImageIcon} label="Images" onClick={() => openTool("Images")} />
            <ToolIcon icon={Code} label="Embeds" onClick={() => openTool("Embeds")} />
            <ToolIcon icon={Target} label="Custom Metrics" onClick={() => openTool("Custom Metrics")} />
            <ToolIcon icon={TrendingUp} label="Benchmarks" onClick={() => openTool("Benchmarks")} />
            <ToolIcon icon={CheckSquare} label="Goals" onClick={() => openTool("Goals")} />
          </div>
        )}

        {/* Tool Side Panel */}
        <AnimatePresence>
          {isToolPanelOpen && (
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="absolute top-0 right-16 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-20 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold">{activeTool}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsToolPanelOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={`Search ${activeTool}...`} className="pl-9 h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      onClick={() => toast.success(`${activeTool} widget added to dashboard`)}
                      className="aspect-video bg-muted rounded-lg border border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors group"
                    >
                      <div className="w-8 h-8 bg-card rounded flex items-center justify-center group-hover:text-primary">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Widget {i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!isPreview && (
        <footer className="h-10 border-t border-border bg-card px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(50, zoom - 10))}><Minus className="w-4 h-4" /></Button>
            <span className="text-[10px] font-bold w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 10))}><Plus className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Maximize2 className="w-4 h-4" /></Button>
          </div>
        </footer>
      )}
    </div>
  );
}

function ToolIcon({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[8px] font-bold text-muted-foreground text-center px-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

function MousePointer2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="m13 13 6 6" />
    </svg>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
