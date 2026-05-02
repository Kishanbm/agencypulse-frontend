import { useNavigate, Outlet, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useBranding } from "@/contexts/BrandingContext";
import { logout as doLogout } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Layout shell for CLIENT_USER only. Intentionally isolated from AgencyAppLayout:
 * no shared sidebar config, no hidden admin affordances, no conditional branches
 * on role. This is how we guarantee CLIENT_USER can never see admin UI by mistake.
 */
export function ClientPortalLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { branding } = useBranding();

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  async function handleLogout() {
    await doLogout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between gap-4">
        <Link to="/portal" className="flex items-center gap-3 min-w-0">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.agencyName}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {branding.agencyName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {branding.agencyName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Client portal
            </p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 h-9 px-2" />}>
            <Avatar className="w-7 h-7">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[180px]">
              {fullName || user?.email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold">{fullName || user?.email}</span>
              <span className="text-xs text-muted-foreground font-normal">
                Client
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>Powered by {branding.agencyName}</span>
        </div>
      </footer>
    </div>
  );
}
