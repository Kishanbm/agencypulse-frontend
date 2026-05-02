import { Link } from "react-router-dom";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Templates", href: "#" },
    { label: "What's new", href: "#" },
  ],
  Solutions: [
    { label: "For digital agencies", href: "#" },
    { label: "For SEO agencies", href: "#" },
    { label: "For paid media teams", href: "#" },
    { label: "For freelancers", href: "#" },
    { label: "For in-house marketers", href: "#" },
  ],
  Resources: [
    { label: "Help center", href: "#" },
    { label: "API docs", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Customer stories", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press kit", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 pt-16 pb-10">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="size-8 rounded-lg bg-gradient-violet flex items-center justify-center shadow-md">
                <Sparkles className="size-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-heading font-semibold tracking-tight">
                AgencyPulse
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The reporting platform agencies actually love. Connect every channel, build branded
              dashboards, send automated reports.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="size-9 rounded-lg border border-border/60 bg-white flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold text-sm tracking-tight mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-14 pt-7 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AgencyPulse, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">DPA</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-border/60">
              <span className="size-1.5 rounded-full bg-mint animate-pulse" />
              <span>All systems normal</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
