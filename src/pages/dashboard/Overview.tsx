import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Megaphone, 
  FileText, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const data = [
  { name: "Mon", sessions: 4000, conversions: 240 },
  { name: "Tue", sessions: 3000, conversions: 139 },
  { name: "Wed", sessions: 2000, conversions: 980 },
  { name: "Thu", sessions: 2780, conversions: 390 },
  { name: "Fri", sessions: 1890, conversions: 480 },
  { name: "Sat", sessions: 2390, conversions: 380 },
  { name: "Sun", sessions: 3490, conversions: 430 },
];

const campaigns = [
  { id: 1, name: "Summer Sale 2024", client: "Nike", integrations: 3, status: "Active", sync: "2 mins ago" },
  { id: 2, name: "Brand Awareness", client: "Apple", integrations: 2, status: "Active", sync: "1 hour ago" },
  { id: 3, name: "Lead Gen Q2", client: "Tesla", integrations: 4, status: "Warning", sync: "5 hours ago" },
  { id: 4, name: "Product Launch", client: "Samsung", integrations: 1, status: "Active", sync: "10 mins ago" },
];

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  trend: "up" | "down";
  trendValue: string;
}

function StatCard({ title, value, icon: Icon, trend, trendValue }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          )}
          <span className={cn(
            "text-xs font-medium",
            trend === "up" ? "text-emerald-600" : "text-rose-600"
          )}>
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Campaigns" 
          value="24" 
          icon={Megaphone} 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          title="Active Clients" 
          value="12" 
          icon={Users} 
          trend="up" 
          trendValue="+2%" 
        />
        <StatCard 
          title="Reports Generated" 
          value="156" 
          icon={FileText} 
          trend="up" 
          trendValue="+18%" 
        />
        <StatCard 
          title="System Alerts" 
          value="3" 
          icon={AlertCircle} 
          trend="down" 
          trendValue="-5%" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Performance Overview</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">Conversions</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#FBBF24" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Conversions by Day</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                  />
                  <Bar dataKey="conversions" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
          <Badge variant="outline" className="font-normal">View all</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Integrations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.client}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {[...Array(campaign.integrations)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={campaign.status === "Active" ? "default" : "destructive"}
                      className={cn(
                        "font-normal",
                        campaign.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                      )}
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{campaign.sync}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
