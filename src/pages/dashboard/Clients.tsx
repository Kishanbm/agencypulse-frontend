import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  Filter as FilterIcon,
  Share2,
  Settings2,
  LayoutGrid,
  List,
  ChevronDown,
  Calendar,
  TrendingUp,
  Copy,
  Check,
  Trash2,
  ExternalLink
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const initialClients = [
  {
    id: "demo-client",
    name: "Demo client",
    website: "agencyanalytics.com",
    dateCreated: "Apr 4, 2026",
    logo: "https://picsum.photos/seed/demo/40/40"
  },
  {
    id: "klantroef-studios",
    name: "Klantroef Studios",
    website: "klantroef.com",
    dateCreated: "Apr 4, 2026",
    logo: "https://picsum.photos/seed/klantroef/40/40"
  }
];

export default function Clients() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [clientsList, setClientsList] = useState(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<typeof initialClients[0] | null>(null);
  const [newClient, setNewClient] = useState({ name: "", website: "" });
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "recent">("all");
  const [dateFilter, setDateFilter] = useState("Last Month");

  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const toggleSelectClient = (id: string) => {
    if (selectedClients.includes(id)) {
      setSelectedClients(selectedClients.filter(i => i !== id));
    } else {
      setSelectedClients([...selectedClients, id]);
    }
  };

  const filteredClients = useMemo(() => {
    let result = clientsList.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.website.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType === "recent") {
      // Just a mock filter for "recent"
      result = result.slice(0, 1);
    }

    return result;
  }, [clientsList, searchQuery, filterType]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.website) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingClient) {
      setClientsList(clientsList.map(c => c.id === editingClient.id ? { ...c, name: newClient.name, website: newClient.website } : c));
      toast.success("Client updated successfully");
      setEditingClient(null);
    } else {
      const id = newClient.name.toLowerCase().replace(/\s+/g, '-');
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const clientToAdd = {
        id,
        name: newClient.name,
        website: newClient.website,
        dateCreated: date,
        logo: `https://picsum.photos/seed/${id}/40/40`
      };

      setClientsList([clientToAdd, ...clientsList]);
      toast.success("Client added successfully");
    }

    setNewClient({ name: "", website: "" });
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (client: typeof initialClients[0]) => {
    setEditingClient(client);
    setNewClient({ name: client.name, website: client.website });
    setIsAddDialogOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    setClientsList(clientsList.filter(c => c.id !== id));
    toast.success("Client deleted");
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10 h-9 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex border border-border rounded-md overflow-hidden bg-card">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 rounded-none", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 rounded-none", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          <Popover>
            <PopoverTrigger render={
              <Button variant="outline" className="gap-2 h-9 border-border">
                <TrendingUp className="w-4 h-4" />
                Roll-up Metrics
              </Button>
            } />
            <PopoverContent className="w-80">
              <PopoverHeader>
                <PopoverTitle>Roll-up Metrics</PopoverTitle>
              </PopoverHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Clients</span>
                    <span className="text-2xl font-bold">{clientsList.length}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Projects</span>
                    <span className="text-2xl font-bold">{clientsList.length * 3}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg. Growth</span>
                  <span className="text-2xl font-bold text-emerald-500">+12.5%</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <Settings2 className="w-4 h-4" />
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clients Settings</DialogTitle>
                <DialogDescription>
                  Configure how your clients are displayed and managed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-archive">Auto-archive inactive clients</Label>
                  <Checkbox id="auto-archive" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-logos">Show client logos</Label>
                  <Checkbox id="show-logos" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Email notifications for new clients</Label>
                  <Checkbox id="notifications" defaultChecked />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setIsSettingsDialogOpen(false);
                  toast.success("Settings saved");
                }}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2 h-9 border-border">
                Share
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Clients Dashboard</DialogTitle>
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

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingClient(null);
              setNewClient({ name: "", website: "" });
            }
          }}>
            <DialogTrigger render={
              <Button className="h-9 bg-primary text-primary-foreground">
                Add Client
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                <DialogDescription>
                  {editingClient ? "Update the details of the client." : "Enter the details of the new client you want to add."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Acme Corp"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    placeholder="e.g. acme.com"
                    value={newClient.website}
                    onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingClient ? "Update Client" : "Create Client"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-medium border-dashed">
              <Plus className="w-3 h-3" />
              Add Filter
              {filterType !== "all" && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filterType}</Badge>}
            </Button>
          } />
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterType("all")}>
              All Clients
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("recent")}>
              Recently Added
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
          <span className="text-sm text-muted-foreground font-medium">Showing {filteredClients.length} of {clientsList.length} Rows</span>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="sm" className="gap-2 text-foreground">
                <Calendar className="w-4 h-4" />
                {dateFilter}
                <ChevronDown className="w-4 h-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              {["Last 7 Days", "Last 30 Days", "Last Month", "Last Year"].map((range) => (
                <DropdownMenuItem key={range} onClick={() => {
                  setDateFilter(range);
                  toast.info(`Filtered by ${range}`);
                }}>
                  {range}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-card">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Client</TableHead>
                <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Date Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleSelectClient(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link to={`/dashboard/clients/${client.id}`} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 rounded-lg border border-border">
                        <AvatarImage src={client.logo} />
                        <AvatarFallback className="rounded-lg">{client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground hover:text-primary transition-colors">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.website}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {client.dateCreated}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link to={`/dashboard/clients/${client.id}`} />}>
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(client)}>Edit Client</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClient(client.id)}>
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No clients found matching your search.
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30">
                <TableCell></TableCell>
                <TableCell className="font-bold text-foreground text-xs uppercase tracking-wider">Totals</TableCell>
                <TableCell className="text-muted-foreground text-xs">{filteredClients.length} Clients</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredClients.map((client) => (
              <div key={client.id} className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="w-12 h-12 rounded-lg border border-border">
                    <AvatarImage src={client.logo} />
                    <AvatarFallback className="rounded-lg text-lg">{client.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link to={`/dashboard/clients/${client.id}`} />}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClient(client.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link to={`/dashboard/clients/${client.id}`}>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{client.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{client.website}</p>
                </Link>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Created</span>
                  <span className="text-xs text-foreground font-medium">{client.dateCreated}</span>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground">
                No clients found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
