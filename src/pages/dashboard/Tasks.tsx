import { useState } from "react";
import { 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreHorizontal, 
  Calendar, 
  X,
  ChevronDown,
  LayoutList,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
  id: string;
  name: string;
  status: "TO DO" | "IN PROGRESS" | "DONE";
  category: string;
  client: string;
  assignee: {
    name: string;
    avatar?: string;
  };
  dueDate: string | null;
  dateCompleted: string | null;
}

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    name: "Schedule a call to discuss monthly report",
    status: "TO DO",
    category: "REPORTING",
    client: "Acme Corp",
    assignee: { name: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex" },
    dueDate: "2024-04-15",
    dateCompleted: null,
  },
  {
    id: "2",
    name: "Conduct website audit",
    status: "IN PROGRESS",
    category: "WEBSITE",
    client: "Global Tech",
    assignee: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah" },
    dueDate: "2024-04-20",
    dateCompleted: null,
  },
];

export default function Tasks() {
  const [showEmptyState, setShowEmptyState] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateTask = (taskData: any) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      name: taskData.name,
      status: "TO DO",
      category: taskData.category || "GENERAL",
      client: taskData.client || "No Client",
      assignee: { name: "Unassigned" },
      dueDate: taskData.dueDate || null,
      dateCompleted: null,
    };
    setTasks([newTask, ...tasks]);
    setShowEmptyState(false);
    setIsCreateModalOpen(false);
    toast.success("Task created successfully");
  };

  if (showEmptyState && tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between px-8 py-4 border-b bg-white">
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Ask AI
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <LayoutList className="w-6 h-6 text-slate-600" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                  Effortless Agency Management
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  Streamline your agency's workflows and boost productivity at scale with simplified task management.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Create and assign new tasks",
                  "Schedule repeat and recurring tasks",
                  "Report on completed tasks"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create a Task
                </Button>
                <Button variant="ghost" size="lg" className="gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Help
                </Button>
              </div>

              <p className="text-sm text-slate-500">
                Need to make sure the work stays on track? <button className="text-blue-600 hover:underline">Set up automated task notifications.</button>
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-3xl -z-10 blur-2xl opacity-50" />
              <div className="bg-white rounded-xl border shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div>Task Name</div>
                    <div>Status</div>
                    <div>Category</div>
                    <div className="text-right">Assignee</div>
                  </div>
                  {[
                    { name: "Schedule a call to discuss monthly report", status: "TO DO", category: "REPORTING", color: "slate" },
                    { name: "Conduct website audit", status: "IN PROGRESS", category: "WEBSITE", color: "blue" },
                    { name: "", status: "IN PROGRESS", category: "", color: "blue", skeleton: true },
                    { name: "", status: "DONE", category: "", color: "emerald", skeleton: true },
                    { name: "", status: "DONE", category: "", color: "emerald", skeleton: true },
                  ].map((item, i) => (
                    <div key={i} className="grid grid-cols-4 items-center gap-4">
                      <div className="text-sm font-medium text-slate-700 truncate">
                        {item.skeleton ? (
                          <div className="h-2 w-3/4 bg-slate-100 rounded" />
                        ) : item.name}
                      </div>
                      <div>
                        <Badge variant="secondary" className={`text-[9px] font-bold ${
                          item.status === "TO DO" ? "bg-slate-500 text-white" :
                          item.status === "IN PROGRESS" ? "bg-blue-600 text-white" :
                          "bg-emerald-500 text-white"
                        }`}>
                          {item.status}
                        </Badge>
                      </div>
                      <div>
                        {item.skeleton ? (
                          <div className="h-4 w-12 bg-slate-100 rounded" />
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold text-slate-400">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CreateTaskModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Ask AI
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search" 
              className="pl-9 h-9 bg-slate-50 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-md overflow-hidden h-9">
            <Button variant="ghost" size="icon" className="rounded-none w-9 h-9 border-r bg-slate-100">
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-none w-9 h-9 border-r">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-none w-9 h-9">
              <Clock className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Task
          </Button>
        </div>
      </header>

      <div className="px-8 py-4 border-b bg-white flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Client is</span>
          <Button variant="ghost" size="sm" className="h-8 gap-2 font-medium">
            Any
            <X className="w-3 h-3 text-slate-400" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status is</span>
          <Button variant="ghost" size="sm" className="h-8 gap-2 font-medium">
            Any
            <X className="w-3 h-3 text-slate-400" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
          <Plus className="w-3 h-3" />
          Add Filter
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-slate-400">
          Clear All
        </Button>
      </div>

      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Showing {tasks.length} of {tasks.length} Rows
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/30">
                <TableHead className="w-[400px] font-bold text-slate-900 uppercase text-[10px] tracking-wider">Task Name</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Category</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Client</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Assignee</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Due Date</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-center">Date Completed</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="group">
                  <TableCell className="font-medium text-slate-700">{task.name}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="sm" className={`h-7 text-[10px] font-bold gap-1.5 ${
                          task.status === "TO DO" ? "bg-slate-100 text-slate-600" :
                          task.status === "IN PROGRESS" ? "bg-blue-50 text-blue-600" :
                          "bg-emerald-50 text-emerald-600"
                        }`}>
                          {task.status}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                      } />
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem>TO DO</DropdownMenuItem>
                        <DropdownMenuItem>IN PROGRESS</DropdownMenuItem>
                        <DropdownMenuItem>DONE</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-slate-400">—</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-slate-400">—</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {task.assignee.avatar ? (
                        <Avatar className="w-6 h-6 border">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-slate-400">—</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-slate-400">—</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}

function CreateTaskModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [client, setClient] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, description, client, category });
    setName("");
    setDescription("");
    setClient("");
    setCategory("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">Create task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-2">
            <Input 
              placeholder="Task Name" 
              className="text-2xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-slate-300 h-auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Status</label>
              <div className="flex">
                <Badge className="bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5">TO DO</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Category</label>
              <div className="text-sm text-slate-400">No category</div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Client</label>
              <div className="text-sm text-slate-400">No client</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Due Date</label>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                No due date
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Time Tracking</label>
              <div className="text-sm text-slate-400">No time tracking</div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Assignee</label>
              <div className="text-sm text-slate-400">No assignee</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Description</label>
            <Textarea 
              placeholder="Add task description" 
              className="border-none px-0 focus-visible:ring-0 resize-none min-h-[100px] placeholder:text-slate-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-start gap-3 pt-4">
            <Button type="submit" className="bg-blue-400 hover:bg-blue-500 text-white px-6">
              Create
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Share2(props: any) {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  )
}

function Maximize2(props: any) {
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
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" x2="14" y1="3" y2="10" />
      <line x1="3" x2="10" y1="21" y2="14" />
    </svg>
  )
}
