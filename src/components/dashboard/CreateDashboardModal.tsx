import { useState } from "react";
import { Plus, LayoutDashboard, Loader2, Layers, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiClient } from "@/lib/api";
import type { DashboardTemplate, CloneDashboardResponse } from "@/types/templates";

interface Dashboard {
  id: string;
  name: string;
}

interface CreateDashboardModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  campaignId: string;
}

export function CreateDashboardModal({
  open,
  onClose,
  clientId,
  campaignId,
}: CreateDashboardModalProps) {
  const navigate = useNavigate();
  const api = getApiClient();
  const queryClient = useQueryClient();

  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | "BLANK" | null>(null);
  const [newName, setNewName] = useState("");

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", "dashboards"],
    queryFn: () =>
      api.get<{ items: DashboardTemplate[] }>("/templates/dashboards").then((r) => r.data),
    enabled: open,
  });

  const templates = templatesData?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api.post<Dashboard>(`/campaigns/${campaignId}/dashboards`, { name }).then((r) => r.data),
    onSuccess: (created) => {
      toast.success(`Dashboard "${created.name}" created`);
      void queryClient.invalidateQueries({ queryKey: ["dashboards", campaignId] });
      handleClose();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${created.id}`);
    },
    onError: () => toast.error("Failed to create dashboard — please try again"),
  });

  const cloneMutation = useMutation({
    mutationFn: (args: { templateId: string; name: string }) =>
      api
        .post<CloneDashboardResponse>(`/templates/dashboards/${args.templateId}/clone`, {
          campaignId,
          name: args.name,
        })
        .then((r) => r.data),
    onSuccess: (cloned) => {
      toast.success(`Dashboard "${cloned.name}" created from template`);
      void queryClient.invalidateQueries({ queryKey: ["dashboards", campaignId] });
      handleClose();
      navigate(`/clients/${clientId}/campaigns/${campaignId}/dashboards/${cloned.id}`);
    },
    onError: () => toast.error("Failed to clone template"),
  });

  function handleClose() {
    onClose();
    setCreateStep(1);
    setSelectedTemplate(null);
    setNewName("");
  }

  function handleNext() {
    if (!selectedTemplate) return;
    setNewName(selectedTemplate === "BLANK" ? "" : selectedTemplate.name);
    setCreateStep(2);
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    if (selectedTemplate === "BLANK") {
      createMutation.mutate(name);
    } else if (selectedTemplate) {
      cloneMutation.mutate({ templateId: selectedTemplate.id, name });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden transition-all duration-300 ${
              createStep === 1 ? "max-w-2xl" : "max-w-md"
            }`}
            style={{ border: "1px solid #ECECE6" }}
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #5B47E0, #7C3AED)" }} />

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="size-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(91,71,224,0.10)" }}
                >
                  <LayoutDashboard className="size-4" style={{ color: "#5B47E0" }} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-foreground">
                    {createStep === 1 ? "Choose a Template" : "Name your Dashboard"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {createStep === 1
                      ? "Start from scratch or use a pre-built setup."
                      : "Give it a recognisable name."}
                  </p>
                </div>
              </div>

              {/* Step 1: Template selection */}
              {createStep === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                    {/* Blank */}
                    <div
                      onClick={() => setSelectedTemplate("BLANK")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTemplate === "BLANK"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="font-semibold text-sm">Blank Dashboard</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Start from scratch with an empty canvas.
                      </div>
                    </div>

                    {/* Templates */}
                    {isLoadingTemplates ? (
                      <div className="p-4 rounded-xl border border-border flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTemplate(tpl)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedTemplate === tpl
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="font-semibold text-sm">{tpl.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tpl.description}
                          </div>
                          <div className="text-[10px] font-medium text-primary mt-2 flex items-center gap-1">
                            <Layers className="size-3" />
                            {tpl.widgetCount} widgets
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      onClick={handleClose}
                      className="h-9 px-4 mr-2 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!selectedTemplate}
                      className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50 bg-primary"
                    >
                      Continue <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Name input */}
              {createStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Dashboard name
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="e.g. SEO Overview"
                      className="w-full h-10 px-3 text-sm rounded-xl bg-background text-foreground focus:outline-none transition-shadow"
                      style={{ border: "1px solid #ECECE6" }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91,71,224,0.15)";
                        e.currentTarget.style.borderColor = "#5B47E0";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "#ECECE6";
                      }}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => setCreateStep(1)}
                      className="h-9 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                      style={{ border: "1px solid #ECECE6" }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={
                        !newName.trim() || createMutation.isPending || cloneMutation.isPending
                      }
                      className="h-9 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #111827, #1f2937)" }}
                    >
                      {(createMutation.isPending || cloneMutation.isPending) && (
                        <Loader2 className="size-3.5 animate-spin" />
                      )}
                      {createMutation.isPending || cloneMutation.isPending ? "Creating…" : "Create"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Standalone trigger button (used by DashboardsList header)
export function CreateDashboardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm shrink-0"
      style={{ background: "linear-gradient(135deg, #111827, #1f2937)" }}
    >
      <Plus className="size-4" />
      Create Dashboard
    </button>
  );
}
