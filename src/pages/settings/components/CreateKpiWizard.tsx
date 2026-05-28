import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calculator, X, ChevronRight, ChevronLeft, Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { getApiClient } from "@/lib/api";
import { useMetricDefinitions } from "@/hooks/useMetricDefinitions";
import { toast } from "sonner";
import type { IntegrationPlatform } from "@/types/dashboard";
import type { CreateKpiDefinitionDto, KpiFormatType, KpiGoalCondition } from "@/types/kpi";

const PLATFORM_OPTIONS = [
  { value: "GA4", label: "Google Analytics 4" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_SEARCH_CONSOLE", label: "Search Console" },
  { value: "YOUTUBE_ANALYTICS", label: "YouTube Analytics" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
  { value: "TIKTOK_ADS", label: "TikTok Ads" },
  { value: "AMAZON_ADS", label: "Amazon Ads" },
];

const FORMAT_OPTIONS: { value: KpiFormatType; label: string }[] = [
  { value: "NUMBER", label: "Numeric (e.g. 1,000)" },
  { value: "PERCENTAGE", label: "Percentage (e.g. 5.5%)" },
  { value: "CURRENCY", label: "Currency (e.g. $100.00)" },
];

const GOAL_CONDITIONS: { value: KpiGoalCondition; label: string }[] = [
  { value: "ABOVE", label: "Good if Above Target" },
  { value: "BELOW", label: "Good if Below Target" },
  { value: "BETWEEN", label: "Good if Between Range" },
];

// Sharp styling
const inputStyle = { border: '1px solid #ECECE6' };
const onFocusViolet = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,71,224,0.12)';
  e.currentTarget.style.borderColor = '#5B47E0';
};
const onBlurReset = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = '#ECECE6';
};

interface CreateKpiWizardProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: Partial<CreateKpiDefinitionDto>;
}

export function CreateKpiWizard({ onClose, onCreated, initialData }: CreateKpiWizardProps) {
  const api = getApiClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name || "");
  const [platform, setPlatform] = useState<string>(initialData?.platform || "");
  const [formatType, setFormatType] = useState<KpiFormatType>(initialData?.formatType || "NUMBER");
  const [formula, setFormula] = useState(initialData?.formula || "");
  const [goalCondition, setGoalCondition] = useState<KpiGoalCondition | "">(initialData?.goalCondition || "");
  const [goalTarget, setGoalTarget] = useState<string>(initialData?.goalTarget?.toString() || "");

  const formulaRef = useRef<HTMLTextAreaElement>(null);

  const { metrics, isLoading: loadingMetrics } = useMetricDefinitions(
    platform ? (platform as IntegrationPlatform) : undefined
  );

  const metricKeys = useMemo(() => new Set(metrics.map(m => m.metricKey)), [metrics]);

  // Syntax Validation
  const syntaxState = useMemo(() => {
    if (!formula.trim()) return { valid: false, message: "Formula is empty" };
    // Very basic math validation: check unbalanced parens
    let parens = 0;
    for (const char of formula) {
      if (char === '(') parens++;
      if (char === ')') parens--;
      if (parens < 0) return { valid: false, message: "Unbalanced parentheses" };
    }
    if (parens > 0) return { valid: false, message: "Unbalanced parentheses" };

    // Find words that look like variables
    const tokens = formula.split(/[\s+\-*/()]+/);
    const unknownVars = tokens.filter(t => t.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) && !metricKeys.has(t));
    
    if (unknownVars.length > 0 && metricKeys.size > 0) {
      return { valid: false, message: `Unknown metrics: ${unknownVars.join(', ')}` };
    }
    return { valid: true, message: "Formula looks good!" };
  }, [formula, metricKeys]);

  const insertToken = useCallback((token: string) => {
    const el = formulaRef.current;
    if (!el) { setFormula((f) => f + token); return; }
    const start = el.selectionStart ?? formula.length;
    const end = el.selectionEnd ?? formula.length;
    const newVal = formula.slice(0, start) + token + formula.slice(end);
    setFormula(newVal);
    setTimeout(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    }, 0);
  }, [formula]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) return setError("Name is required");
      if (!platform) return setError("Platform is required");
    }
    if (step === 2) {
      if (!formula.trim()) return setError("Formula is required");
      if (!syntaxState.valid && metricKeys.size > 0) return setError("Please fix formula errors before continuing");
    }
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const dto: CreateKpiDefinitionDto = {
        name: name.trim(),
        formula: formula.trim(),
        platform,
        formatType,
      };
      if (goalCondition && goalTarget) {
        dto.goalCondition = goalCondition;
        dto.goalTarget = parseFloat(goalTarget);
      }
      await api.post("/agencies/me/kpi-definitions", dto);
      toast.success("KPI created successfully");
      onCreated();
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      setError(typeof msg === 'string' ? msg : "Failed to save KPI");
    } finally {
      setSaving(false);
    }
  };

  // Render Rich Tokens
  const renderFormulaRich = () => {
    if (!formula) return <span className="text-muted-foreground opacity-50">Visual formula preview...</span>;
    // Split by non-alphanumeric (math operators and spaces) but keep delimiters
    const parts = formula.split(/([\s+\-*/()]+)/);
    return parts.map((part, i) => {
      if (metricKeys.has(part)) {
        return (
          <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 font-mono text-[11px] font-semibold bg-violet-50 text-violet-700" style={{ border: '1px solid rgba(91,71,224,0.3)' }}>
            {part}
          </span>
        );
      }
      if (part.match(/^[a-zA-Z_]/)) {
        return <span key={i} className="text-red-500 font-mono font-semibold">{part}</span>;
      }
      return <span key={i} className="font-mono text-foreground">{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative bg-white shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col rounded-none"
        style={{ border: '1px solid #ECECE6' }}
      >
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #5B47E0, #7C3AED)' }} />
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: '#ECECE6' }}>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
              <Calculator className="size-5 text-violet-600" />
              {initialData ? "Customize KPI" : "Create Custom KPI"}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`size-6 rounded-none flex items-center justify-center text-xs font-bold transition-colors ${step === s ? 'bg-violet-600 text-white' : step > s ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
                    {step > s ? <CheckCircle2 className="size-3.5" /> : s}
                  </div>
                  {s < 3 && <div className={`w-6 h-px ${step > s ? 'bg-violet-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-none hover:bg-muted text-muted-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">KPI Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Engagement Rate"
                    className="w-full h-11 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data Source / Platform</label>
                  <select
                    value={platform}
                    onChange={e => { setPlatform(e.target.value); setFormula(""); }}
                    className="w-full h-11 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow appearance-none"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  >
                    <option value="">Select a platform...</option>
                    {PLATFORM_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Number Format</label>
                  <select
                    value={formatType}
                    onChange={e => setFormatType(e.target.value as KpiFormatType)}
                    className="w-full h-11 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow appearance-none"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  >
                    {FORMAT_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Formula Builder</label>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-none ${syntaxState.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {syntaxState.message}
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 border rounded-none min-h-[60px] flex items-center flex-wrap" style={{ borderColor: '#ECECE6' }}>
                    {renderFormulaRich()}
                  </div>

                  <textarea
                    ref={formulaRef}
                    value={formula}
                    onChange={e => setFormula(e.target.value)}
                    placeholder="Type formula (e.g. clicks / impressions * 100)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm font-mono rounded-none bg-background text-foreground focus:outline-none resize-none transition-shadow"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  />

                  {loadingMetrics ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-gray-50 border rounded-none">
                      <Loader2 className="size-4 animate-spin" /> Loading metrics...
                    </div>
                  ) : (
                    <div className="space-y-2 border p-3 rounded-none bg-gray-50" style={{ borderColor: '#ECECE6' }}>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Available Metrics (Click to insert)</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {metrics.map(m => (
                          <button
                            key={m.metricKey}
                            type="button"
                            onClick={() => insertToken(m.metricKey)}
                            title={m.label}
                            className="text-xs font-mono px-2 py-1 transition-colors hover:bg-violet-100 rounded-none"
                            style={{ border: '1px solid rgba(91,71,224,0.3)', background: 'white', color: '#5B47E0' }}
                          >
                            {m.metricKey}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="p-4 bg-violet-50 border border-violet-100 flex items-start gap-3 rounded-none">
                  <Info className="size-5 text-violet-600 shrink-0" />
                  <p className="text-sm text-violet-900">
                    Set a target goal to enable Red/Amber/Green status indicators on your dashboards.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Goal Condition (Optional)</label>
                  <select
                    value={goalCondition}
                    onChange={e => setGoalCondition(e.target.value as KpiGoalCondition)}
                    className="w-full h-11 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow appearance-none"
                    style={inputStyle}
                    onFocus={onFocusViolet}
                    onBlur={onBlurReset}
                  >
                    <option value="">No goal (always neutral)</option>
                    {GOAL_CONDITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <AnimatePresence>
                  {goalCondition && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Value</label>
                      <input
                        type="number"
                        step="any"
                        value={goalTarget}
                        onChange={e => setGoalTarget(e.target.value)}
                        placeholder={formatType === 'PERCENTAGE' ? "e.g. 5 (for 5%)" : "e.g. 100"}
                        className="w-full h-11 px-3 text-sm rounded-none bg-background text-foreground focus:outline-none transition-shadow"
                        style={inputStyle}
                        onFocus={onFocusViolet}
                        onBlur={onBlurReset}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-none border border-red-100">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between bg-gray-50" style={{ borderColor: '#ECECE6' }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="h-10 px-4 rounded-none text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-gray-700"
              style={{ border: '1px solid #ECECE6', background: 'white' }}
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="h-10 px-5 rounded-none text-sm font-semibold text-white transition-colors hover:bg-violet-700 flex items-center gap-1.5"
              style={{ background: '#5B47E0' }}
            >
              Next <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-none text-sm font-semibold text-white transition-colors flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {saving ? "Saving..." : "Save KPI"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
