import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/src/lib/store";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Megaphone, 
  BarChart3, 
  Settings, 
  Users, 
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  FileText,
  TrendingUp,
  CheckSquare,
  Database,
  Layout,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface SidebarItemProps {
  icon: any;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}

function SidebarItem({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) {
  return (
    <Link to={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium">{label}</span>}
      </div>
    </Link>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = [
    { icon: Users, label: "Clients", href: "/dashboard/clients" },
  ];

  const analysisItems = [
    { icon: FileText, label: "Reports", href: "/dashboard/reports" },
    { icon: LayoutDashboard, label: "Roll-up Dashboards", href: "/dashboard/roll-up" },
  ];

  const projectManagementItems = [
    { icon: TrendingUp, label: "Goals", href: "/dashboard/goals" },
    { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
    { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
  ];

  const managementItems = [
    { icon: Database, label: "Data Sources", href: "/dashboard/data-sources" },
    { icon: BarChart3, label: "Custom Metrics", href: "/dashboard/custom-metrics" },
    { icon: Layout, label: "Templates", href: "/dashboard/templates" },
    { icon: Layers, label: "Bulk Actions", href: "/dashboard/bulk-actions" },
  ];

  const allNavItems = [...navItems, ...analysisItems, ...projectManagementItems, ...managementItems];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 260,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0)
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "bg-card border-r border-border flex flex-col h-full absolute lg:relative z-40 transition-transform lg:translate-x-0"
        )}
      >
        <div className="p-4 flex items-center justify-between h-16">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Layout className="w-5 h-5" />
              </div>
              <span>AgencyPulse</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mx-auto">
              <Layout className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-none">
          <div className="space-y-1">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.href}
                {...item}
                active={location.pathname.startsWith(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </div>

          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Analysis</p>}
          <div className="space-y-1">
            {analysisItems.map((item) => (
              <SidebarItem 
                key={item.href}
                {...item}
                active={location.pathname.startsWith(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </div>

          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Management</p>}
          <div className="space-y-1">
            {projectManagementItems.map((item) => (
              <SidebarItem 
                key={item.href}
                {...item}
                active={location.pathname.startsWith(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </div>

          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Management</p>}
          <div className="space-y-1">
            {managementItems.map((item) => (
              <SidebarItem 
                key={item.href}
                {...item}
                active={location.pathname.startsWith(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>Account Setup</span>
                <span>50%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/2" />
              </div>
            </div>
          )}
          
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "flex-col"
          )}>
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={user?.agency?.logoUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className={cn("text-muted-foreground hover:text-foreground", isCollapsed && "w-full")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-20 h-8 w-8 rounded-full border border-border bg-card shadow-sm hover:bg-muted hidden lg:flex"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setIsMobileOpen(true)}
            >
              <Plus className="w-5 h-5 rotate-45" /> {/* Using Plus as a quick menu icon */}
            </Button>
            <h2 className="text-base lg:text-lg font-semibold text-foreground truncate">
              {allNavItems.find(i => i.href === location.pathname)?.label || "Dashboard"}
            </h2>
            <div className="max-w-md w-full relative ml-4 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search campaigns, reports..." 
                className="pl-10 bg-muted border-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="outline" size="icon" className="relative border-border h-9 w-9">
              <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full border-2 border-card" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1 lg:mx-2 hidden sm:block" />
            <Button className="gap-2 bg-primary text-primary-foreground h-9" onClick={() => toast.info("Add Campaign dialog would open here")}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Campaign</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
