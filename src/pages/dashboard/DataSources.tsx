import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, CheckCircle2, Shield, ArrowRight, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORM_CATALOG,
  PLATFORM_CATEGORY_FILTERS,
  getPlatformInitials,
  type PlatformCategoryFilter,
  type PlatformEntry,
} from "@/lib/platform-catalog";

// ─── Platform Logo ────────────────────────────────────────────────────────────

function PlatformLogo({ name, className }: { name: string; className?: string }) {
  const { initials, colorClass } = getPlatformInitials(name);
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-white font-bold text-sm select-none", colorClass, className)}>
      {initials}
    </div>
  );
}

// ─── Platform Card ────────────────────────────────────────────────────────────

function PlatformCard({ platform, onClick }: { platform: PlatformEntry; onClick: () => void }) {
  return (
    <Card
      className="group cursor-pointer border-border bg-card transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <PlatformLogo name={platform.name} className="w-10 h-10 shrink-0" />
          <Badge variant="outline" className="text-[10px] font-semibold shrink-0 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
            Available
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="mb-1">
          <h3 className="font-semibold text-sm text-foreground leading-tight">{platform.name}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{platform.authLabel}</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-2">
          {platform.description}
        </p>
        <div className="mt-3">
          <Button size="sm" className="w-full text-xs h-7 bg-primary text-primary-foreground">
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DataSources() {
  const [activeCategory, setActiveCategory] = useState<PlatformCategoryFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PlatformEntry | null>(null);

  const filtered = useMemo(() => {
    let list = PLATFORM_CATALOG;

    if (activeCategory !== "ALL") {
      list = list.filter(
        (p) => p.category === activeCategory || p.altCategories?.includes(activeCategory as typeof p.category),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCategory, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {PLATFORM_CATALOG.length} integrations available across all marketing categories. Connect them from any campaign's Integrations page.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            {PLATFORM_CATALOG.length} Available
          </span>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_CATEGORY_FILTERS.map((cat) => {
            const count =
              cat.value === "ALL"
                ? PLATFORM_CATALOG.length
                : PLATFORM_CATALOG.filter(
                    (p) =>
                      p.category === cat.value ||
                      p.altCategories?.includes(cat.value as typeof p.category),
                  ).length;

            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
                )}
              >
                {cat.label}
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1 py-0.5 rounded-full min-w-[18px] text-center",
                    activeCategory === cat.value
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results info */}
      {(search || activeCategory !== "ALL") && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} integration{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "ALL" && ` in ${PLATFORM_CATEGORY_FILTERS.find((c) => c.value === activeCategory)?.label}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No integrations found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term or category</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-border"
            onClick={() => { setSearch(""); setActiveCategory("ALL"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((p) => (
            <PlatformCard key={p.key} platform={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <PlatformLogo name={selected.name} className="w-12 h-12" />
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                      {selected.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase border-border">
                        {selected.category.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Auth Method</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{selected.authLabel}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Security</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">AES-256 Encrypted</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Data Sync</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">Every 6 hours</span>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    To connect {selected.name}, go to a campaign and open its <strong>Integrations</strong> tab.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" className="border-border" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
