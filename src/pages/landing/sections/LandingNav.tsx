import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1280px] px-5 lg:px-8"
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative size-8 rounded-lg bg-gradient-violet flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Sparkles className="size-4 text-white" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-lg bg-gradient-violet blur-md opacity-50 -z-10" />
            </div>
            <span className="font-heading font-semibold tracking-tight text-base">
              AgencyPulse
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3.5 py-1.5 text-sm text-foreground/70 hover:text-foreground rounded-md transition-colors hover:bg-muted/60"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center shrink-0">
            <Link to="/register">
              <Button variant="gradient" size="sm">
                Sign up
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden size-9 rounded-lg flex items-center justify-center hover:bg-muted/60 transition"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-border/60">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm rounded-md hover:bg-muted/60"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="pt-2">
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button variant="gradient" className="w-full" size="lg">
                      Sign up
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
