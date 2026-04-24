import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Share2, 
  Calendar, 
  Download, 
  MoreHorizontal, 
  Plus, 
  Layout, 
  Image as ImageIcon, 
  Type, 
  Code, 
  Target, 
  BarChart3, 
  Settings2, 
  Undo2, 
  Redo2, 
  Eye, 
  History, 
  HelpCircle, 
  X,
  Maximize2,
  Minus,
  ChevronDown,
  CheckCircle2,
  Search,
  Settings,
  FileText,
  Clock,
  Database,
  Layers,
  TrendingUp,
  CheckSquare,
  Bell,
  LogOut,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Palette,
  MousePointer2,
  Box,
  Globe,
  Flag,
  Trash2,
  Copy,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const audienceData = [
  { name: "1 Mar", value: 150 },
  { name: "5 Mar", value: 165 },
  { name: "10 Mar", value: 155 },
  { name: "15 Mar", value: 175 },
  { name: "20 Mar", value: 170 },
  { name: "25 Mar", value: 180 },
  { name: "30 Mar", value: 183 },
];

const engagementData = [
  { name: "2 Mar", series1: 30, series2: 40 },
  { name: "9 Mar", series1: 45, series2: 35 },
  { name: "16 Mar", series1: 35, series2: 50 },
  { name: "23 Mar", series1: 55, series2: 45 },
  { name: "30 Mar", series1: 40, series2: 55 },
];

const videoViewsData = [
  { name: "Paid", value: 40, color: "#F59E0B" },
  { name: "Non-Paid", value: 34, color: "#A3E635" },
];

const countryData = [
  { country: "Venezuela", flag: "🇻🇪", value: 1597, change: "+100%" },
  { country: "Chile", flag: "🇨🇱", value: 1582, change: "+100%" },
];

const cityData = [
  { city: "New Rosamond", value: 1598, change: "+100%" },
  { city: "South Vada", value: 1576, change: "+100%" },
];

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"design" | "activity">("design");
  const [dataSource, setDataSource] = useState<"live" | "sample">("live");
  const [zoom, setZoom] = useState(100);
  const [isPreview, setIsPreview] = useState(false);
  const [pages, setPages] = useState([{ id: "1", name: "Facebook Dashboard" }]);
  const [activePageId, setActivePageId] = useState("1");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleAction = (action: string) => {
    toast.info(`${action} clicked`);
  };

  const addPage = () => {
    const newPage = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Page ${pages.length + 1}`
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    toast.success("New page added");
  };

  const deletePage = (id: string) => {
    if (pages.length === 1) {
      toast.error("Cannot delete the last page");
      return;
    }
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activePageId === id) {
      setActivePageId(newPages[0].id);
    }
    toast.success("Page deleted");
  };

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
      {/* Top Header */}
      <AnimatePresence>
        {!isPreview && (
          <motion.header 
            initial={{ y: -56 }}
            animate={{ y: 0 }}
            exit={{ y: -56 }}
            className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-10"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/reports")}>
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold">Demo report</h1>
                <div className="flex items-center gap-2 bg-muted/50 px-2 py-0.5 rounded border border-border">
                  <div className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center">
                    <Layout className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Demo client</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[8px] uppercase font-bold bg-primary/10 text-primary border-none">Client</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex bg-muted p-0.5 rounded-md mr-4">
                <button 
                  onClick={() => setActiveTab("design")}
                  className={cn(
                    "px-4 py-1 text-xs font-bold rounded-sm transition-all",
                    activeTab === "design" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Design
                </button>
                <button 
                  onClick={() => setActiveTab("activity")}
                  className={cn(
                    "px-4 py-1 text-xs font-bold rounded-sm transition-all",
                    activeTab === "activity" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Activity
                </button>
              </div>

              <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogTrigger render={
                  <Button variant="outline" size="sm" className="h-8 gap-2 border-border">
                    <Clock className="w-3.5 h-3.5" />
                    Schedule
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Report</DialogTitle>
                    <DialogDescription>
                      Set up automated delivery for this report.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">Daily</Button>
                        <Button variant="default" size="sm" className="flex-1">Weekly</Button>
                        <Button variant="outline" size="sm" className="flex-1">Monthly</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Recipients</Label>
                      <Input placeholder="email@example.com" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      toast.success("Report scheduled successfully");
                      setIsScheduleOpen(false);
                    }}>Save Schedule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogTrigger render={
                  <Button variant="outline" size="sm" className="h-8 gap-2 border-border bg-primary/5 text-primary border-primary/20">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Report</DialogTitle>
                    <DialogDescription>
                      Generate a public link or invite team members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                      <Input readOnly value={`https://agencypulse.com/share/demo-report`} className="bg-muted" />
                      <Button size="sm" onClick={() => toast.success("Link copied")}>Copy</Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsShareOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <AnimatePresence>
        {!isPreview && (
          <motion.div 
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="h-10 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-10"
          >
            <div className="flex items-center gap-2">
              <div className="flex bg-muted p-0.5 rounded-md">
                <button 
                  onClick={() => setDataSource("live")}
                  className={cn(
                    "px-3 py-0.5 text-[10px] font-bold rounded-sm transition-all",
                    dataSource === "live" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Live Data
                </button>
                <button 
                  onClick={() => setDataSource("sample")}
                  className={cn(
                    "px-3 py-0.5 text-[10px] font-bold rounded-sm transition-all",
                    dataSource === "sample" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sample Data
                </button>
              </div>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Undo: No changes to undo")}>
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Redo: No changes to redo")}>
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={isPageSetupOpen} onOpenChange={setIsPageSetupOpen}>
                <DialogTrigger render={
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground">
                    <Layout className="w-3.5 h-3.5" />
                    Page Setup
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Page Setup</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Orientation</Label>
                      <Select defaultValue="portrait">
                        <SelectTrigger>
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select defaultValue="a4">
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsPageSetupOpen(false)}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isThemeOpen} onOpenChange={setIsThemeOpen}>
                <DialogTrigger render={
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground">
                    <Palette className="w-3.5 h-3.5" />
                    Theme
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Theme</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-4 py-4">
                    {["Default", "Modern", "Classic", "Dark", "Vibrant", "Minimal"].map((theme) => (
                      <button 
                        key={theme}
                        onClick={() => {
                          toast.success(`Theme changed to ${theme}`);
                          setIsThemeOpen(false);
                        }}
                        className="flex flex-col items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-full h-12 bg-muted rounded-sm" />
                        <span className="text-xs font-medium">{theme}</span>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger render={
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[10px] font-bold border-border">
                    <Calendar className="w-3.5 h-3.5" />
                    Last Month
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                } />
                <PopoverContent className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                    {["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Last Month", "Custom Range"].map((range) => (
                      <Button key={range} variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => toast.success(`Date range set to ${range}`)}>
                        {range}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Help Center: Documentation loading...")}>
                <HelpCircle className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Version History: Loading snapshots...")}>
                <History className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[10px] font-bold border-border" onClick={() => setIsPreview(true)}>
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Button>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium ml-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Auto saved
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden bg-muted/30 relative">
        {/* Left Sidebar - Pages */}
        <AnimatePresence>
          {!isPreview && (
            <motion.div 
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              className="w-64 border-r border-border bg-card flex flex-col shrink-0 z-10"
            >
              <div className="p-4 border-b border-border">
                <Button className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none h-9" onClick={addPage}>
                  <Plus className="w-4 h-4" />
                  Add page
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {pages.map((page) => (
                  <div 
                    key={page.id}
                    onClick={() => setActivePageId(page.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer border group transition-all",
                      activePageId === page.id ? "bg-muted text-foreground border-border shadow-sm" : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        activePageId === page.id ? "bg-card border-border" : "bg-muted border-transparent"
                      )}>
                        <Layout className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold truncate max-w-[140px]">{page.name}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(page.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto p-8 flex justify-center relative">
          {isPreview && (
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed top-4 right-4 z-50 gap-2 bg-card/80 backdrop-blur shadow-lg"
              onClick={() => setIsPreview(false)}
            >
              <EyeOff className="w-4 h-4" />
              Exit Preview
            </Button>
          )}
          
          <div 
            className={cn(
              "bg-white shadow-2xl rounded-sm origin-top transition-all duration-300 relative",
              device === "tablet" ? "w-[600px]" : device === "mobile" ? "w-[375px]" : "w-[800px]"
            )}
            style={{ 
              minHeight: device === "mobile" ? "667px" : "1131px", 
              transform: `scale(${zoom / 100})`,
              padding: device === "mobile" ? "20px" : "40px"
            }}
          >
            {/* Report Content */}
            <div className="flex justify-between items-start mb-12">
              <div className="w-12 h-12 bg-[#004236] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">KL</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Demo client</p>
                <p className="text-xs font-bold text-foreground">March 2026</p>
                <p className="text-[8px] text-muted-foreground">Previous: March 2025</p>
              </div>
            </div>

            <h2 className={cn(
              "font-bold text-center text-foreground mb-12",
              device === "mobile" ? "text-xl" : "text-3xl"
            )}>
              {pages.find(p => p.id === activePageId)?.name || "Facebook Dashboard"}
            </h2>

            <div className="bg-[#262626] text-white px-4 py-2 rounded-t-lg text-sm font-bold mb-6">
              Facebook
            </div>

            <div className={cn(
              "grid gap-4 mb-4",
              device === "mobile" ? "grid-cols-1" : "grid-cols-2"
            )}>
              {/* Audience Widget */}
              <div className="bg-[#7DA3E0] rounded-lg p-4 text-white relative overflow-hidden h-48">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold opacity-80">Facebook Audience (Follows)</span>
                  <Badge className="bg-emerald-400/20 text-emerald-100 border-none text-[8px] h-4">+ 2.81%</Badge>
                </div>
                <div className="flex flex-col items-center justify-center h-full -mt-4">
                  <span className={cn(
                    "font-bold",
                    device === "mobile" ? "text-4xl" : "text-6xl"
                  )}>183</span>
                  <div className="w-full h-16 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={audienceData}>
                        <Area type="monotone" dataKey="value" stroke="#fff" fill="rgba(255,255,255,0.1)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-rows-2 gap-4">
                {/* Country Table */}
                <div className="bg-white border border-border rounded-lg p-4">
                  <p className="text-[10px] font-bold text-muted-foreground mb-3">Facebook Follows by Country</p>
                  <div className="space-y-3">
                    {countryData.map((item) => (
                      <div key={item.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.flag}</span>
                          <span className="text-xs font-medium">{item.country}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{item.value.toLocaleString()}</p>
                          <p className="text-[8px] text-emerald-500 font-bold">▲ {item.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* City Table */}
                <div className="bg-white border border-border rounded-lg p-4">
                  <p className="text-[10px] font-bold text-muted-foreground mb-3">Facebook Follows by City</p>
                  <div className="space-y-3">
                    {cityData.map((item) => (
                      <div key={item.city} className="flex items-center justify-between">
                        <span className="text-xs font-medium">{item.city}</span>
                        <div className="text-right">
                          <p className="text-xs font-bold">{item.value.toLocaleString()}</p>
                          <p className="text-[8px] text-emerald-500 font-bold">▲ {item.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "grid gap-4 mb-8",
              device === "mobile" ? "grid-cols-1" : "grid-cols-2"
            )}>
              {/* Post Engagement Chart */}
              <div className="bg-white border border-border rounded-lg p-4 h-64">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground">Facebook Post Engagement</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">800</span>
                    <Badge variant="secondary" className="bg-rose-100 text-rose-600 border-none text-[8px] h-4">▼ 37%</Badge>
                    < MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="series1" stroke="#7DA3E0" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="series2" stroke="#A3E635" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Video Views Donut */}
              <div className="bg-white border border-border rounded-lg p-6 h-64 flex flex-col">
                <p className="text-[11px] font-bold text-[#666] mb-2">Facebook Video Views</p>
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="w-full h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={videoViewsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={10}
                          cornerRadius={10}
                          startAngle={180}
                          endAngle={-180}
                          dataKey="value"
                          stroke="none"
                        >
                          {videoViewsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend matching the image exactly */}
                  <div className="flex items-center justify-center gap-8 mt-2">
                    {videoViewsData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#777]">{item.name}</span>
                          <span className="text-[10px] font-bold text-[#111]">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center p-8 border border-dashed border-border rounded-lg bg-muted/10">
              <p className="text-sm text-muted-foreground mb-2">
                If you're monitoring more than Facebook, you can integrate all of your other marketing channels with AgencyAnalytics to make the perfect dashboard.
              </p>
              <p className="text-sm font-bold text-foreground">
                Just drag and drop new widgets on this template.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Tools */}
        <AnimatePresence>
          {!isPreview && (
            <motion.div 
              initial={{ x: 64 }}
              animate={{ x: 0 }}
              exit={{ x: 64 }}
              className="w-16 border-l border-border bg-card flex flex-col items-center py-4 gap-6 shrink-0 z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <ToolIcon icon={BarChart3} label="Integrations Metrics" onClick={() => openTool("Integrations Metrics")} active={activeTool === "Integrations Metrics"} />
                <ToolIcon icon={Type} label="Content Blocks" onClick={() => openTool("Content Blocks")} active={activeTool === "Content Blocks"} />
                <ToolIcon icon={ImageIcon} label="Images" onClick={() => openTool("Images")} active={activeTool === "Images"} />
                <ToolIcon icon={Code} label="Embeds" onClick={() => openTool("Embeds")} active={activeTool === "Embeds"} />
                <ToolIcon icon={Target} label="Custom Metrics" onClick={() => openTool("Custom Metrics")} active={activeTool === "Custom Metrics"} />
                <ToolIcon icon={TrendingUp} label="Benchmarks" onClick={() => openTool("Benchmarks")} active={activeTool === "Benchmarks"} />
                <ToolIcon icon={CheckSquare} label="Goals" onClick={() => openTool("Goals")} active={activeTool === "Goals"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                      onClick={() => toast.success(`${activeTool} widget added to report`)}
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

      {/* Bottom Bar - Zoom */}
      <AnimatePresence>
        {!isPreview && (
          <motion.div 
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            className="h-10 border-t border-border bg-card px-4 flex items-center justify-between shrink-0 z-10"
          >
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] font-bold w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Fullscreen mode activated")}>
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Monitor 
                  onClick={() => setDevice("desktop")}
                  className={cn(
                    "w-3.5 h-3.5 cursor-pointer transition-colors",
                    device === "desktop" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )} 
                />
                <Tablet 
                  onClick={() => setDevice("tablet")}
                  className={cn(
                    "w-3.5 h-3.5 cursor-pointer transition-colors",
                    device === "tablet" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )} 
                />
                <Smartphone 
                  onClick={() => setDevice("mobile")}
                  className={cn(
                    "w-3.5 h-3.5 cursor-pointer transition-colors",
                    device === "mobile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
