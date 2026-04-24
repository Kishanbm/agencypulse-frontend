import { useState } from "react";
import { Routes, Route, Link, useLocation, useParams, Navigate } from "react-router-dom";
import {
  Settings,
  Sparkles,
  ChevronDown,
  Home,
  LayoutDashboard,
  FileText,
  Database,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  HelpCircle,
  ArrowUpRight,
  Maximize2,
  Bell,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { DashboardsList } from "./client/DashboardsList";
import { DashboardViewer } from "./client/DashboardViewer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { motion } from "motion/react";

function ClientHome() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { title: "Reports", icon: FileText, content: "No reports sent in the last 30 days", hasViewAll: true },
        { title: "Notifications", icon: Bell, content: "All clear! You don't have any notifications", isCircle: true },
        { title: "Dashboards", icon: LayoutDashboard, content: "No dashboards", subContent: "Create dashboards to monitor your clients data", hasButton: "Create dashboard" },
        { title: "Data Sources", icon: Database, content: "No data sources" },
        { title: "Users", icon: Users, content: "No users", hasButton: "Add user" },
      ].map((item) => (
        <Card key={item.title} className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
            </div>
            {item.hasViewAll && <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0">View all</Button>}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              {item.isCircle ? (
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 opacity-20" />
                </div>
              ) : (
                <item.icon className="w-12 h-12 mb-4 opacity-20" />
              )}
              <p className="text-sm font-medium">{item.content}</p>
              {item.subContent && <p className="text-xs text-slate-400 mt-1 mb-4">{item.subContent}</p>}
              {item.hasButton && <Button variant="outline" size="sm" className="mt-4">{item.hasButton}</Button>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClientDataSources() {
  const sources = [
    { name: "Google Ads", icon: "https://www.gstatic.com/images/branding/product/1x/google_ads_48dp.png", status: "Connected", color: "bg-blue-50" },
    { name: "Facebook Ads", icon: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png", status: "Connected", color: "bg-blue-100" },
    { name: "Google Analytics 4", icon: "https://www.gstatic.com/images/branding/product/1x/google_analytics_48dp.png", status: "Connected", color: "bg-orange-50" },
    { name: "Instagram", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png", status: "Not Connected", color: "bg-pink-50" },
    { name: "LinkedIn Ads", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png", status: "Not Connected", color: "bg-blue-50" },
    { name: "YouTube", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png", status: "Not Connected", color: "bg-red-50" },
    { name: "Search Console", icon: "https://www.gstatic.com/images/branding/product/1x/search_console_48dp.png", status: "Connected", color: "bg-blue-50" },
    { name: "Mailchimp", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Mailchimp_Logo.svg/1200px-Mailchimp_Logo.svg.png", status: "Not Connected", color: "bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Data Sources</h3>
        <Button className="bg-primary text-primary-foreground">Add Data Source</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={source.name} className="hover:shadow-md transition-shadow cursor-pointer border-border bg-card">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center mb-4 p-3", source.color)}>
                <img src={source.icon} alt={source.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <h4 className="font-bold text-foreground mb-1">{source.name}</h4>
              <Badge variant={source.status === "Connected" ? "default" : "secondary"} className={cn("text-[10px] uppercase font-bold", source.status === "Connected" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-500")}>
                {source.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClientUsers() {
  const users = [
    { name: "Ashith", email: "ashith@klantroef.com", role: "Admin", lastActive: "2 mins ago", avatar: "https://picsum.photos/seed/ashith/32/32" },
    { name: "Sarah Chen", email: "sarah@agency.com", role: "Editor", lastActive: "1 hour ago", avatar: "https://picsum.photos/seed/sarah/32/32" },
    { name: "Mike Ross", email: "mike@client.com", role: "Viewer", lastActive: "Yesterday", avatar: "https://picsum.photos/seed/mike/32/32" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Users</h3>
        <Button className="bg-primary text-primary-foreground">Add User</Button>
      </div>
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">User</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Role</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Last Active</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.email} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase border-border">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


function ClientReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Reports</h3>
        <Button className="bg-primary text-primary-foreground">Create Report</Button>
      </div>
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Report Name</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Frequency</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Last Sent</TableHead>
              <TableHead className="font-bold text-foreground uppercase text-[10px] tracking-wider">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">Monthly SEO Report</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Mar 1, 2026</TableCell>
              <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none">Active</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></TableCell>
            </TableRow>
            <TableRow className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">Weekly PPC Summary</TableCell>
              <TableCell>Weekly</TableCell>
              <TableCell>Mar 28, 2026</TableCell>
              <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none">Active</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const clientName = id === "demo-client" ? "Demo client" : "Klantroef Studios";
  const clientLogo = id === "demo-client" ? "https://picsum.photos/seed/demo/40/40" : "https://picsum.photos/seed/klantroef/40/40";

  const tabs = [
    { label: "Home", href: "", icon: Home },
    { label: "Dashboards", href: "/dashboards", icon: LayoutDashboard },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Data Sources", href: "/data-sources", icon: Database },
    { label: "Users", href: "/users", icon: Users },
    { label: "Goals", href: "/goals", icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 px-6 py-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4" />
        <span>This is a demo client to help you understand how things are set up using sample data.</span>
      </div>

      <div className="bg-card border-b border-border px-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard/clients" className="hover:text-primary transition-colors">Clients</Link>
            <span>/</span>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Avatar className="w-5 h-5 rounded-sm"><AvatarImage src={clientLogo} /><AvatarFallback className="rounded-sm text-[10px]">{clientName.charAt(0)}</AvatarFallback></Avatar>
              <span>{clientName}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 border-border"><Settings className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const href = `/dashboard/clients/${id}${tab.href}`;
            const isActive = location.pathname === href || (tab.href === "" && location.pathname === `/dashboard/clients/${id}`);
            return (
              <Link key={tab.label} to={href} className={cn("pb-3 text-sm font-medium transition-colors relative", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                {tab.label}
                {isActive && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </Link>
            );
          })}
          <div className="flex items-center gap-1 pb-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"><span>More</span><ChevronDown className="w-4 h-4" /></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <Routes>
          <Route index element={<ClientHome />} />
          <Route path="dashboards">
            <Route index element={<DashboardsList />} />
            <Route path=":dashboardId" element={<DashboardViewer />} />
          </Route>
          <Route path="reports" element={<ClientReports />} />
          <Route path="data-sources" element={<ClientDataSources />} />
          <Route path="users" element={<ClientUsers />} />
          <Route path="goals" element={<div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><TrendingUp className="w-12 h-12 mb-4 opacity-20" /><p>No goals set</p></div>} />
        </Routes>
      </div>
    </div>
  );
}
