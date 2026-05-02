export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to   = isoDate(now);
  const from = new Date(now);
  switch (preset) {
    case '7d':  from.setDate(now.getDate() - 6);  break;
    case '30d': from.setDate(now.getDate() - 29); break;
    case '90d': from.setDate(now.getDate() - 89); break;
    case 'mtd': from.setDate(1);                  break;
    default:    from.setDate(now.getDate() - 29); break;
  }
  return { from: isoDate(from), to };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export const METRIC_LABELS: Record<string, { label: string; currency?: boolean }> = {
  sessions:    { label: 'Sessions'    },
  users:       { label: 'Users'       },
  pageviews:   { label: 'Page Views'  },
  clicks:      { label: 'Clicks'      },
  impressions: { label: 'Impressions' },
  conversions: { label: 'Conversions' },
  cost:        { label: 'Ad Spend', currency: true },
  revenue:     { label: 'Revenue',  currency: true },
  leads:       { label: 'Leads'       },
  videoViews:  { label: 'Video Views' },
};

export const KPI_DISPLAY_KEYS = [
  'sessions', 'users', 'clicks', 'impressions', 'conversions', 'cost', 'revenue', 'leads',
];

export const DATE_PRESETS = [
  { value: '7d',  label: 'Last 7 days'   },
  { value: '30d', label: 'Last 30 days'  },
  { value: '90d', label: 'Last 90 days'  },
  { value: 'mtd', label: 'Month to date' },
];

export const RANKING_METRICS = [
  { value: 'sessions',    label: 'Sessions'    },
  { value: 'clicks',      label: 'Clicks'      },
  { value: 'impressions', label: 'Impressions' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'cost',        label: 'Ad Spend'    },
  { value: 'revenue',     label: 'Revenue'     },
  { value: 'leads',       label: 'Leads'       },
];
