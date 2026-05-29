import { useState, useRef, useEffect, type ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, LogOut, Menu, Search, Settings,
  Users, UsersRound, LayoutTemplate, Calculator,
  ShieldCheck, CreditCard, FileSearch, BellDot,
  ChevronLeft, ChevronRight, Sparkles, X,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore, useSidebarStore } from "@/lib/store";
import { useHasRole, useRole } from "@/hooks/useRole";
import { hasRole } from "@/lib/rbac";
import { useBranding } from "@/contexts/BrandingContext";
import { logout as doLogout } from "@/lib/auth-service";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { GlobalAiWidget } from "@/components/ai/GlobalAiWidget";
import { OnboardingBar } from "@/components/onboarding/OnboardingBar";
import type { Role } from "@/types/auth";

type NavItem = {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  minRole?: Role;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/overview", icon: LayoutDashboard, label: "Overview" },
      { to: "/clients", icon: Users, label: "Clients" },
    ],
  },
  {
    title: "Manage",
    items: [
      { to: "/team", icon: UsersRound, label: "Team", minRole: "AGENCY_ADMIN" },
      { to: "/templates", icon: LayoutTemplate, label: "Templates" },
      { to: "/kpi-definitions", icon: Calculator, label: "Custom KPIs", minRole: "AGENCY_ADMIN" },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "/settings/profile", icon: Settings, label: "Agency profile", minRole: "AGENCY_ADMIN" },
      { to: "/settings/branding", icon: ShieldCheck, label: "Branding", minRole: "AGENCY_OWNER" },
      { to: "/settings/billing", icon: CreditCard, label: "Billing", minRole: "AGENCY_OWNER" },
      { to: "/settings/audit-log", icon: FileSearch, label: "Audit log", minRole: "AGENCY_ADMIN" },
      { to: "/settings/notifications", icon: BellDot, label: "Notifications" },
    ],
  },
];

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5",
          collapsed ? "justify-center px-2.5" : "",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
              style={{ background: '#5B47E0' }}
            />
          )}
          <item.icon
            className={[
              "size-[18px] flex-shrink-0 transition-colors",
              isActive ? "text-white" : "text-white/40 group-hover:text-white/70",
            ].join(" ")}
          />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function UserAvatar({ initials, avatarUrl, size = 8 }: { initials: string; avatarUrl?: string | null; size?: number }) {
  const sizeClass = `size-${size}`;
  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, #5B47E0 0%, #8B5CF6 100%)', border: '2px solid rgba(91,71,224,0.60)' }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold text-xs leading-none">{initials}</span>
      )}
    </div>
  );
}

function HeaderUserMenu({ initials, avatarUrl, fullName, email, canSeeSettings, onSettings, onLogout }: {
  initials: string; avatarUrl?: string | null; fullName: string; email: string;
  canSeeSettings: boolean; onSettings: () => void; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 h-8 rounded-lg transition-colors"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <UserAvatar initials={initials} avatarUrl={avatarUrl} size={6} />
        <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate" style={{ color: 'var(--foreground)' }}>
          {fullName || email}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' as const }}
            className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl overflow-hidden bg-white py-1"
            style={{ border: '1px solid #ECECE6', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
          >
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #ECECE6' }}>
              <p className="text-sm font-semibold text-foreground truncate">{fullName || email}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
            </div>
            {canSeeSettings && (
              <button
                onClick={() => { onSettings(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted/40"
              >
                <Settings className="size-4 text-muted-foreground" />
                Settings
              </button>
            )}
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-red-50"
              style={{ color: '#f43f5e' }}
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgencyAppLayout() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const setIsCollapsed = useSidebarStore((s) => s.setCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useRole();
  const { branding } = useBranding();
  const canSeeSettings = useHasRole("AGENCY_ADMIN");

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  async function handleLogout() {
    await doLogout();
    navigate("/login", { replace: true });
  }

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.minRole || hasRole(role, i.minRole)),
  })).filter((g) => g.items.length > 0);

  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const activeItem = allItems
    .filter((i) => location.pathname.startsWith(i.to))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const SidebarContent = (
    <>
      {/* Logo + collapse toggle */}
      <div
        className={[
          "flex items-center h-16 px-4 gap-2 flex-shrink-0",
          isCollapsed ? "justify-center" : "justify-between",
        ].join(" ")}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.agencyName} className="size-8 rounded-xl object-cover shadow-sm flex-shrink-0" />
          ) : (
            <div
              className="relative size-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B47E0 0%, #8B5CF6 100%)' }}
            >
              <Sparkles className="size-4 text-white" strokeWidth={2.5} />
            </div>
          )}
          {!isCollapsed && (
            <span className="font-heading font-semibold tracking-tight text-sm truncate text-white">
              {branding.agencyName}
            </span>
          )}
        </Link>

        {/* Collapse toggle — fully inside sidebar */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="size-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" strokeWidth={3} style={{ color: 'rgba(255,255,255,0.90)' }} />
          ) : (
            <ChevronLeft className="size-4" strokeWidth={3} style={{ color: 'rgba(255,255,255,0.90)' }} />
          )}
        </button>
      </div>

      {/* Nav groups */}
      <div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {visibleGroups.map((group, idx) => (
          <div key={idx} className="space-y-0.5">
            {!isCollapsed && group.title && (
              <p className="px-3 pb-2 text-[10px] font-bold text-white/25 uppercase tracking-[0.12em]">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={isCollapsed} />
            ))}
          </div>
        ))}
      </div>

      {/* User footer — avatar + name + direct sign-out */}
      <div
        className="px-3 pb-4 pt-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className={[
            "flex items-center gap-2.5 p-2 rounded-xl",
            isCollapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <UserAvatar initials={initials} avatarUrl={user?.avatarUrl} size={8} />

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white leading-tight">
                {fullName || user?.email}
              </p>
              <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {role?.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Sign-out button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="size-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ color: '#f43f5e' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden relative" style={{ background: '#F0EFF9' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 backdrop-blur-sm z-30 lg:hidden"
            style={{ background: 'rgba(15,13,31,0.5)' }}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="hidden lg:flex flex-col h-full relative z-10 flex-shrink-0 overflow-hidden"
        style={{ background: '#0F0D1F' }}
      >
        {SidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="lg:hidden fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
            style={{ background: '#0F0D1F' }}
          >
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-4 size-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <X className="size-4" />
            </button>
            {SidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="h-14 bg-white px-4 lg:px-6 flex items-center justify-between gap-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #ECECE6' }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="lg:hidden size-8 rounded-xl flex items-center justify-center transition-colors"
              onClick={() => setIsMobileOpen(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Menu className="size-4" />
            </button>

            {activeItem && (
              <span className="hidden lg:block font-heading font-bold text-sm text-foreground tracking-tight">
                {activeItem.label}
              </span>
            )}

            {/* Search */}
            <div className="hidden sm:flex items-center max-w-xs w-full relative">
              <Search className="absolute left-3 size-3.5 pointer-events-none" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }} />
              <input
                placeholder="Search clients, campaigns…"
                disabled
                className="w-full pl-9 h-8 text-sm rounded-full outline-none"
                style={{ background: '#F0EFF9', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--muted-foreground)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />

            <div className="w-px h-5 mx-1" style={{ background: '#ECECE6' }} />

            <HeaderUserMenu
              initials={initials}
              avatarUrl={user?.avatarUrl}
              fullName={fullName}
              email={user?.email ?? ""}
              canSeeSettings={canSeeSettings}
              onSettings={() => navigate("/settings/profile")}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Email verification banner (above page content) */}
        <EmailVerificationBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Onboarding checklist — sticky bottom bar, visible on all pages until complete or dismissed */}
        <OnboardingBar />
      </div>

      {/* Global AI assistant — floating bubble bottom-right */}
      <GlobalAiWidget />
    </div>
  );
}
