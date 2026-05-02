import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getApiClient } from "@/lib/api";

export interface Branding {
  agencyName: string;
  slug: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
  emailFromName: string;
  emailFromAddress: string | null;
}

const DEFAULT_BRANDING: Branding = {
  agencyName: "AgencyPulse",
  slug: null,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  customDomain: null,
  emailFromName: "AgencyPulse",
  emailFromAddress: null,
};

interface BrandingContextValue {
  branding: Branding;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(
  undefined,
);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const api = getApiClient();
      const { data } = await api.get<Branding>("/branding");
      setBranding({ ...DEFAULT_BRANDING, ...data });
    } catch {
      setBranding(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", branding.primaryColor);
    root.style.setProperty("--brand-secondary", branding.secondaryColor);

    if (branding.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }

    if (branding.agencyName && branding.agencyName !== "AgencyPulse") {
      document.title = branding.agencyName;
    }
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refresh: load }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used inside <BrandingProvider>");
  }
  return ctx;
}
