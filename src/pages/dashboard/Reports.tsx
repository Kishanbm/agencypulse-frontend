import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Filter as FilterIcon, 
  Share2, 
  Settings2,
  Calendar,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  X,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

const initialReports = [
  { 
    id: "demo-report", 
    name: "Demo report", 
    client: "Demo client", 
    type: "Client",
    created: "Apr 4, 2026",
    schedule: "-",
    scheduleStatus: "-",
    clientGroup: "-",
    lastSent: "-",
    nextSendDate: "-",
    awaitingApproval: "-",
    lastSentStatus: "-"
  }
];

export default function Reports() {
  const [reportsList, setReportsList] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({ name: "", client: "Demo client" });
  const [copied, setCopied] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "scheduled" | "not-scheduled">("all");

  const filteredReports = useMemo(() => {
    let result = reportsList.filter(report => 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === "scheduled") {
      result = result.filter(r => r.schedule !== "-");
    } else if (activeTab === "not-scheduled") {
      result = result.filter(r => r.schedule === "-");
    }

    return result;
  }, [reportsList, searchQuery, activeTab]);

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.name) {
      toast.error("Please enter a report name");
      return;
    }

    const reportToAdd = {
      id: `report-${Date.now()}`,
      name: newReport.name,
      client: newReport.client,
      type: "Client",
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      schedule: "-",
      scheduleStatus: "-",
      clientGroup: "-",
      lastSent: "-",
      nextSendDate: "-",
      awaitingApproval: "-",
      lastSentStatus: "-"
    };

    setReportsList([reportToAdd, ...reportsList]);
    setNewReport({ name: "", client: "Demo client" });
    setIsCreateDialogOpen(false);
    toast.success("Report created successfully");
  };

  const handleDeleteReport = (id: string) => {
    setReportsList(reportsList.filter(r => r.id !== id));
    toast.success("Report deleted");
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(r => r.id));
    }
  };

  const toggleSelectReport = (id: string) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(i => i !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 border-border" onClick={() => toast.info("Settings opened")}>
            <Settings2 className="w-4 h-4" />
          </Button>

          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2 h-9 border-border">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Reports Dashboard</DialogTitle>
                <DialogDescription>
                  Anyone with the link will be able to view this dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-4">
                <Input readOnly value={window.location.href} className="flex-1 bg-muted" />
                <Button size="icon" onClick={copyShareLink}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger render={
              <Button className="h-9 bg-primary text-primary-foreground">
                Create Report
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Enter the details for your new report.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateReport} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input 
                    id="report-name" 
                    placeholder="e.g. Monthly SEO Report" 
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-select">Client</Label>
                  <Input 
                    id="client-select" 
                    value={newReport.client}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Report</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-md text-sm border border-border">
          <span className="text-muted-foreground">Client is</span>
          <span className="font-bold">Any</span>
          <X className="w-3 h-3 ml-1 cursor-pointer text-muted-foreground hover:text-foreground" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1 border-dashed">
          <Plus className="w-3 h-3" />
          Add Filter
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground" onClick={() => toast.info("Filters cleared")}>
          Clear All
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">Showing {filteredReports.length} of {reportsList.length} Rows</span>
            <div className="flex items-center bg-muted rounded-md p-0.5 border border-border">
              <button 
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-sm transition-all",
                  activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All <span className="ml-1 opacity-50">{reportsList.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab("scheduled")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-sm transition-all",
                  activeTab === "scheduled" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Scheduled <span className="ml-1 opacity-50">{reportsList.filter(r => r.schedule !== "-").length}</span>
              </button>
              <button 
                onClick={() => setActiveTab("not-scheduled")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-sm transition-all",
                  activeTab === "not-scheduled" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Not Scheduled <span className="ml-1 opacity-50">{reportsList.filter(r => r.schedule === "-").length}</span>
              </button>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search" 
              className="pl-10 h-8 bg-card border-border text-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-card">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Name</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Client</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Type</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Created</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Schedule</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Schedule Status</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Client Group</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Last Sent</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Next Send Date</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Awaiting Approval</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Last Sent Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Checkbox 
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => toggleSelectReport(report.id)}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer whitespace-nowrap">
                    <Link to={`/dashboard/reports/${report.id}`}>
                      {report.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.client}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[10px] font-bold uppercase">
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.created}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.schedule}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.scheduleStatus}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.clientGroup}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.lastSent}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.nextSendDate}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.awaitingApproval}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {report.lastSentStatus}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${report.name}`)}>
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`Editing ${report.name}`)}>Edit Report</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => handleDeleteReport(report.id)}>
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                    No reports found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
