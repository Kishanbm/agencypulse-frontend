export type PlatformCategory =
  | 'PPC'
  | 'SEO'
  | 'SOCIAL'
  | 'EMAIL'
  | 'ECOMMERCE'
  | 'ANALYTICS'
  | 'CALL_TRACKING'
  | 'LOCAL'
  | 'DATABASE';

export type PlatformCategoryFilter = 'ALL' | PlatformCategory;

export type PlatformAuthType = 'OAUTH' | 'API_KEY' | 'BOTH';

export interface PlatformEntry {
  /** Backend enum key (e.g. GOOGLE_ADS) */
  key: string;
  /** URL slug for API calls (e.g. google-ads) */
  slug: string;
  name: string;
  category: PlatformCategory;
  altCategories?: PlatformCategory[];
  authType: PlatformAuthType;
  authLabel: string;
  description: string;
  /** Per-shop OAuth: user must supply their store domain before the auth URL can be built */
  requiresShopDomain?: boolean;
}

function s(key: string): string {
  return key.toLowerCase().replace(/_/g, '-');
}

export const PLATFORM_CATALOG: PlatformEntry[] = [
  // ─── Dedicated OAuth modules (GA4, Google Ads, Meta, GSC, LinkedIn, YouTube, TikTok, Amazon) ─
  { key: 'GA4', slug: s('GA4'), name: 'Google Analytics 4', category: 'ANALYTICS', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Track website traffic, user behaviour, conversions, and events from Google Analytics 4.' },
  { key: 'GOOGLE_ADS', slug: s('GOOGLE_ADS'), name: 'Google Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Pull campaign performance, clicks, impressions, spend, and conversions from Google Ads.' },
  { key: 'META_ADS', slug: s('META_ADS'), name: 'Meta Ads', category: 'PPC', altCategories: ['SOCIAL'], authType: 'OAUTH', authLabel: 'Facebook OAuth', description: 'Sync Facebook and Instagram ad campaign data — spend, reach, clicks, and conversions.' },
  { key: 'GOOGLE_SEARCH_CONSOLE', slug: s('GOOGLE_SEARCH_CONSOLE'), name: 'Google Search Console', category: 'SEO', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Monitor organic search impressions, clicks, average position, and keyword rankings.' },
  { key: 'LINKEDIN_ADS', slug: s('LINKEDIN_ADS'), name: 'LinkedIn Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'LinkedIn OAuth', description: 'Track B2B ad performance — impressions, clicks, spend, and lead gen form submissions.' },
  { key: 'YOUTUBE_ANALYTICS', slug: s('YOUTUBE_ANALYTICS'), name: 'YouTube', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Monitor video views, watch time, subscribers, and channel engagement metrics.' },
  { key: 'TIKTOK_ADS', slug: s('TIKTOK_ADS'), name: 'TikTok Ads', category: 'PPC', altCategories: ['SOCIAL'], authType: 'OAUTH', authLabel: 'TikTok OAuth', description: 'Pull TikTok paid campaign metrics — impressions, clicks, spend, and video views.' },
  { key: 'AMAZON_ADS', slug: s('AMAZON_ADS'), name: 'Amazon Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Amazon OAuth', description: 'Sync Amazon Advertising campaign data — Sponsored Products, Brands, and Display.' },
  // ─── PPC ─────────────────────────────────────────────────────────────────────
  { key: 'MAILCHIMP', slug: s('MAILCHIMP'), name: 'Mailchimp', category: 'EMAIL', authType: 'OAUTH', authLabel: 'Mailchimp OAuth', description: 'Track email campaign opens, clicks, unsubscribes, and list growth.' },
  { key: 'SHOPIFY', slug: s('SHOPIFY'), name: 'Shopify', category: 'ECOMMERCE', authType: 'OAUTH', authLabel: 'Shopify OAuth', requiresShopDomain: true, description: 'Pull revenue, orders, average order value, and product sales from Shopify.' },
  { key: 'SEMRUSH', slug: s('SEMRUSH'), name: 'Semrush', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Import keyword rankings, organic traffic estimates, backlinks, and site audit data.' },
  { key: 'MICROSOFT_ADS', slug: s('MICROSOFT_ADS'), name: 'Microsoft Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Microsoft OAuth', description: 'Sync Bing / Microsoft Ads campaign performance — clicks, impressions, spend, and conversions.' },
  { key: 'PINTEREST_ADS', slug: s('PINTEREST_ADS'), name: 'Pinterest Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Pinterest OAuth', description: 'Track Pinterest paid campaign metrics — impressions, saves, clicks, and spend.' },
  { key: 'SNAPCHAT_ADS', slug: s('SNAPCHAT_ADS'), name: 'Snapchat Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Snapchat OAuth', description: 'Pull Snapchat Ads performance — impressions, swipe-ups, spend, and story views.' },
  { key: 'X_ADS', slug: s('X_ADS'), name: 'X Ads', category: 'PPC', altCategories: ['SOCIAL'], authType: 'OAUTH', authLabel: 'X OAuth', description: 'Sync X (Twitter) paid campaign data — impressions, engagements, clicks, and spend.' },
  { key: 'REDDIT_ADS', slug: s('REDDIT_ADS'), name: 'Reddit Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Reddit OAuth', description: 'Monitor Reddit Ads campaign performance — clicks, impressions, spend, and conversions.' },
  { key: 'ADROLL', slug: s('ADROLL'), name: 'AdRoll', category: 'PPC', authType: 'OAUTH', authLabel: 'OAuth', description: 'Pull retargeting and prospecting campaign metrics from AdRoll.' },
  { key: 'GOOGLE_AD_MANAGER', slug: s('GOOGLE_AD_MANAGER'), name: 'Google Ad Manager', category: 'PPC', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Sync programmatic ad delivery data — impressions, CTR, revenue, and fill rates.' },
  { key: 'GOOGLE_DV360', slug: s('GOOGLE_DV360'), name: 'Google DV360', category: 'PPC', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Pull Display & Video 360 programmatic campaign data — reach, frequency, spend, and conversions.' },
  { key: 'GOOGLE_LOCAL_SERVICES_ADS', slug: s('GOOGLE_LOCAL_SERVICES_ADS'), name: 'Google Local Services Ads', category: 'PPC', altCategories: ['LOCAL'], authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Track Local Services Ads leads, calls, and spend for service-area businesses.' },
  { key: 'INSTAGRAM_ADS', slug: s('INSTAGRAM_ADS'), name: 'Instagram Ads', category: 'PPC', altCategories: ['SOCIAL'], authType: 'OAUTH', authLabel: 'Facebook OAuth', description: 'Pull Instagram paid campaign data — reach, impressions, clicks, and spend.' },
  { key: 'SPOTIFY_ADS', slug: s('SPOTIFY_ADS'), name: 'Spotify Ads', category: 'PPC', authType: 'OAUTH', authLabel: 'Spotify OAuth', description: 'Sync Spotify Ads Studio campaign data — impressions, clicks, reach, and audio completions.' },
  { key: 'STACKADAPT', slug: s('STACKADAPT'), name: 'StackAdapt', category: 'PPC', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull programmatic display, native, and video campaign data from StackAdapt.' },
  { key: 'SIMPLIFI', slug: s('SIMPLIFI'), name: 'Simpli.fi', category: 'PPC', authType: 'API_KEY', authLabel: 'API Key', description: 'Import programmatic advertising campaign metrics from Simpli.fi DSP.' },
  { key: 'CHOOZLE', slug: s('CHOOZLE'), name: 'Choozle', category: 'PPC', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync digital advertising campaign data from the Choozle DSP platform.' },
  { key: 'GROUNDTRUTH', slug: s('GROUNDTRUTH'), name: 'GroundTruth', category: 'PPC', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull location-based mobile advertising campaign data from GroundTruth.' },
  { key: 'BASIS_PLATFORM', slug: s('BASIS_PLATFORM'), name: 'Basis Platform', category: 'PPC', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync programmatic, search, and social campaign data from Centro Basis.' },
  { key: 'YELP_ADS', slug: s('YELP_ADS'), name: 'Yelp Ads', category: 'PPC', altCategories: ['LOCAL'], authType: 'API_KEY', authLabel: 'API Key', description: 'Track Yelp Ads performance — impressions, clicks, and direction requests.' },
  // ─── SEO ─────────────────────────────────────────────────────────────────────
  { key: 'AHREFS', slug: s('AHREFS'), name: 'Ahrefs', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull backlink data, organic keyword rankings, domain rating, and traffic estimates.' },
  { key: 'MOZ', slug: s('MOZ'), name: 'Moz', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Import Domain Authority, page authority, backlinks, and keyword rankings from Moz.' },
  { key: 'SE_RANKING', slug: s('SE_RANKING'), name: 'SE Ranking', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync keyword positions, website audits, and backlink monitoring data.' },
  { key: 'MAJESTIC_SEO', slug: s('MAJESTIC_SEO'), name: 'Majestic SEO', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull Trust Flow, Citation Flow, and backlink data from Majestic SEO.' },
  { key: 'BING_WEBMASTER_TOOLS', slug: s('BING_WEBMASTER_TOOLS'), name: 'Bing Webmaster Tools', category: 'SEO', authType: 'OAUTH', authLabel: 'Microsoft OAuth', description: 'Monitor Bing organic search impressions, clicks, pages crawled, and index status.' },
  { key: 'GOOGLE_BUSINESS_PROFILE', slug: s('GOOGLE_BUSINESS_PROFILE'), name: 'Google Business Profile', category: 'LOCAL', altCategories: ['SEO'], authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Track Google Business Profile views, searches, direction requests, and calls.' },
  { key: 'GOOGLE_LIGHTHOUSE', slug: s('GOOGLE_LIGHTHOUSE'), name: 'Google Lighthouse', category: 'SEO', authType: 'API_KEY', authLabel: 'No Auth Needed', description: 'Run automated Lighthouse audits for performance, accessibility, SEO, and best practices.' },
  { key: 'GOOGLE_PAGESPEED', slug: s('GOOGLE_PAGESPEED'), name: 'Google PageSpeed', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull Core Web Vitals and PageSpeed scores for desktop and mobile.' },
  { key: 'RANK_TRACKER', slug: s('RANK_TRACKER'), name: 'Rank Tracker', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Monitor daily keyword ranking positions across Google, Bing, and Yahoo.' },
  { key: 'BACKLINK_MONITOR', slug: s('BACKLINK_MONITOR'), name: 'Backlink Monitor', category: 'SEO', authType: 'API_KEY', authLabel: 'API Key', description: 'Track new and lost backlinks, domain authority changes, and link health over time.' },
  // ─── Social / Organic ────────────────────────────────────────────────────────
  { key: 'FACEBOOK_ORGANIC', slug: s('FACEBOOK_ORGANIC'), name: 'Facebook', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'Facebook OAuth', description: 'Track organic Facebook Page metrics — reach, impressions, likes, comments, and shares.' },
  { key: 'INSTAGRAM_ORGANIC', slug: s('INSTAGRAM_ORGANIC'), name: 'Instagram', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'Facebook OAuth', description: 'Monitor organic Instagram metrics — followers, reach, impressions, and post engagement.' },
  { key: 'PINTEREST_ORGANIC', slug: s('PINTEREST_ORGANIC'), name: 'Pinterest', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'Pinterest OAuth', description: 'Track organic Pinterest metrics — impressions, saves, clicks, and audience data.' },
  { key: 'VIMEO', slug: s('VIMEO'), name: 'Vimeo', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'Vimeo OAuth', description: 'Pull video performance metrics from Vimeo — plays, finishes, likes, and comments.' },
  { key: 'X_ORGANIC', slug: s('X_ORGANIC'), name: 'X (Twitter)', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'X OAuth', description: 'Track organic X (Twitter) account metrics — impressions, engagements, follows, and replies.' },
  { key: 'TIKTOK_ORGANIC', slug: s('TIKTOK_ORGANIC'), name: 'TikTok', category: 'SOCIAL', authType: 'OAUTH', authLabel: 'TikTok OAuth', description: 'Monitor organic TikTok account metrics — views, likes, comments, shares, and followers.' },
  // ─── Email Marketing ─────────────────────────────────────────────────────────
  { key: 'KLAVIYO', slug: s('KLAVIYO'), name: 'Klaviyo', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull email and SMS campaign performance from Klaviyo — opens, clicks, revenue, and list growth.' },
  { key: 'ACTIVECAMPAIGN', slug: s('ACTIVECAMPAIGN'), name: 'ActiveCampaign', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync email campaign metrics and automation performance from ActiveCampaign.' },
  { key: 'BREVO', slug: s('BREVO'), name: 'Brevo', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Import email campaign sends, opens, clicks, and unsubscribes from Brevo.' },
  { key: 'CONSTANT_CONTACT', slug: s('CONSTANT_CONTACT'), name: 'Constant Contact', category: 'EMAIL', authType: 'OAUTH', authLabel: 'OAuth', description: 'Track email campaign performance — sends, opens, clicks, and list growth.' },
  { key: 'CAMPAIGN_MONITOR', slug: s('CAMPAIGN_MONITOR'), name: 'Campaign Monitor', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull email campaign analytics — opens, clicks, bounces, and revenue.' },
  { key: 'CONVERTKIT', slug: s('CONVERTKIT'), name: 'ConvertKit', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync subscriber growth, email sequence performance, and broadcast metrics.' },
  { key: 'DRIP', slug: s('DRIP'), name: 'Drip', category: 'EMAIL', authType: 'API_KEY', authLabel: 'API Key', description: 'Import email and SMS campaign metrics from Drip — opens, clicks, revenue, and workflow performance.' },
  // ─── Ecommerce ────────────────────────────────────────────────────────────────
  { key: 'WOOCOMMERCE', slug: s('WOOCOMMERCE'), name: 'WooCommerce', category: 'ECOMMERCE', authType: 'API_KEY', authLabel: 'API Keys', description: 'Pull WooCommerce store data — revenue, orders, AOV, refunds, and top products.' },
  { key: 'BIGCOMMERCE', slug: s('BIGCOMMERCE'), name: 'BigCommerce', category: 'ECOMMERCE', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync BigCommerce store metrics — revenue, orders, conversion rate, and product performance.' },
  { key: 'STRIPE_ECOMMERCE', slug: s('STRIPE_ECOMMERCE'), name: 'Stripe', category: 'ECOMMERCE', authType: 'API_KEY', authLabel: 'API Key', description: 'Track Stripe revenue, new customers, refunds, and MRR for ecommerce businesses.' },
  { key: 'KEAP', slug: s('KEAP'), name: 'Keap', category: 'ECOMMERCE', altCategories: ['EMAIL'], authType: 'OAUTH', authLabel: 'OAuth', description: 'Sync Keap CRM and ecommerce data — contacts, revenue, and pipeline metrics.' },
  // ─── Analytics & CRM ─────────────────────────────────────────────────────────
  { key: 'HUBSPOT', slug: s('HUBSPOT'), name: 'HubSpot', category: 'ANALYTICS', altCategories: ['EMAIL'], authType: 'OAUTH', authLabel: 'HubSpot OAuth', description: 'Pull HubSpot CRM data — contacts, deals, revenue, email performance, and pipeline stages.' },
  { key: 'MATOMO', slug: s('MATOMO'), name: 'Matomo', category: 'ANALYTICS', authType: 'API_KEY', authLabel: 'API Key', description: 'Import privacy-friendly web analytics from Matomo — visits, bounce rate, goals, and funnels.' },
  { key: 'SALESFORCE', slug: s('SALESFORCE'), name: 'Salesforce', category: 'ANALYTICS', altCategories: ['EMAIL'], authType: 'OAUTH', authLabel: 'Salesforce OAuth', description: 'Sync Salesforce CRM pipeline metrics — leads, opportunities, revenue, and win rates.' },
  { key: 'SHARPSPRING', slug: s('SHARPSPRING'), name: 'SharpSpring', category: 'ANALYTICS', altCategories: ['EMAIL'], authType: 'API_KEY', authLabel: 'API Key', description: 'Pull SharpSpring marketing automation data — leads, email campaigns, and pipeline metrics.' },
  { key: 'GRAVITY_FORMS', slug: s('GRAVITY_FORMS'), name: 'Gravity Forms', category: 'ANALYTICS', authType: 'API_KEY', authLabel: 'API Keys', description: 'Track form submissions, conversion rates, and entry data from Gravity Forms.' },
  { key: 'UNBOUNCE', slug: s('UNBOUNCE'), name: 'Unbounce', category: 'ANALYTICS', authType: 'OAUTH', authLabel: 'OAuth', description: 'Sync landing page performance — visits, conversions, and A/B test results.' },
  { key: 'HIGHLEVEL', slug: s('HIGHLEVEL'), name: 'HighLevel', category: 'ANALYTICS', altCategories: ['CALL_TRACKING'], authType: 'OAUTH', authLabel: 'OAuth', description: 'Pull HighLevel CRM and marketing automation data — leads, pipeline, and campaign performance.' },
  { key: 'GOOGLE_SHEETS', slug: s('GOOGLE_SHEETS'), name: 'Google Sheets', category: 'ANALYTICS', altCategories: ['PPC'], authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Import custom data from Google Sheets as a flexible dashboard data source.' },
  // ─── Call Tracking ────────────────────────────────────────────────────────────
  { key: 'CALLRAIL', slug: s('CALLRAIL'), name: 'CallRail', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Track inbound calls, call sources, duration, and lead quality from CallRail.' },
  { key: 'CALLTRACKING_METRICS', slug: s('CALLTRACKING_METRICS'), name: 'CallTrackingMetrics', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull call tracking data — calls, sources, duration, and conversion tracking.' },
  { key: 'TWILIO', slug: s('TWILIO'), name: 'Twilio', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'Account SID + Token', description: 'Sync Twilio call and SMS data — call volume, duration, SMS campaigns, and conversion events.' },
  { key: 'WHATCONVERTS', slug: s('WHATCONVERTS'), name: 'WhatConverts', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Import call, form, chat, and transaction conversion data from WhatConverts.' },
  { key: 'MARCHEX', slug: s('MARCHEX'), name: 'Marchex', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull call analytics, conversational intelligence, and attribution data from Marchex.' },
  { key: 'AVANSER', slug: s('AVANSER'), name: 'Avanser', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Track call conversions and attribution data from the Avanser call tracking platform.' },
  { key: 'CALLSOURCE', slug: s('CALLSOURCE'), name: 'CallSource', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Import call tracking and analytics data from CallSource.' },
  { key: 'DELACON', slug: s('DELACON'), name: 'Delacon', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Sync call tracking and attribution data from the Delacon platform.' },
  { key: 'WILDJAR', slug: s('WILDJAR'), name: 'WildJar', category: 'CALL_TRACKING', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull call tracking, transcription, and attribution data from WildJar.' },
  // ─── Local & Reputation ───────────────────────────────────────────────────────
  { key: 'BRIGHTLOCAL', slug: s('BRIGHTLOCAL'), name: 'BrightLocal', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Monitor local SEO rankings, citation accuracy, and reputation scores from BrightLocal.' },
  { key: 'TRUSTPILOT', slug: s('TRUSTPILOT'), name: 'Trustpilot', category: 'LOCAL', authType: 'OAUTH', authLabel: 'OAuth', description: 'Track Trustpilot review scores, review count, and rating trends over time.' },
  { key: 'YELP', slug: s('YELP'), name: 'Yelp', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Monitor Yelp business ratings, review count, and customer impression metrics.' },
  { key: 'BIRDEYE', slug: s('BIRDEYE'), name: 'Birdeye', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull review scores, sentiment, and reputation data across platforms from Birdeye.' },
  { key: 'YEXT', slug: s('YEXT'), name: 'Yext', category: 'LOCAL', authType: 'OAUTH', authLabel: 'OAuth', description: 'Sync Yext knowledge graph data — listing accuracy, review scores, and local search performance.' },
  { key: 'GATHERUP', slug: s('GATHERUP'), name: 'GatherUp', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Track customer review requests, review scores, and feedback trends from GatherUp.' },
  { key: 'GRADE_US', slug: s('GRADE_US'), name: 'Grade.us', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Monitor review generation and reputation management metrics from Grade.us.' },
  { key: 'SYNUP', slug: s('SYNUP'), name: 'Synup', category: 'LOCAL', authType: 'API_KEY', authLabel: 'API Key', description: 'Pull local listing accuracy, review scores, and presence data from Synup.' },
  { key: 'VENDASTA', slug: s('VENDASTA'), name: 'Vendasta', category: 'LOCAL', authType: 'OAUTH', authLabel: 'OAuth', description: 'Sync Vendasta reputation management and local marketing data into your dashboards.' },
  // ─── Database / Warehouse ─────────────────────────────────────────────────────
  { key: 'GOOGLE_BIGQUERY', slug: s('GOOGLE_BIGQUERY'), name: 'Google BigQuery', category: 'DATABASE', authType: 'OAUTH', authLabel: 'Google OAuth', description: 'Query custom datasets from Google BigQuery and visualise them in dashboards.' },
  { key: 'AMAZON_REDSHIFT', slug: s('AMAZON_REDSHIFT'), name: 'Amazon Redshift', category: 'DATABASE', authType: 'BOTH', authLabel: 'Credentials', description: 'Connect to Amazon Redshift data warehouses and pull custom metrics.' },
  { key: 'MYSQL_DB', slug: s('MYSQL_DB'), name: 'MySQL', category: 'DATABASE', authType: 'BOTH', authLabel: 'Credentials', description: 'Connect to a MySQL database and import custom query results as dashboard metrics.' },
  { key: 'SNOWFLAKE', slug: s('SNOWFLAKE'), name: 'Snowflake', category: 'DATABASE', authType: 'BOTH', authLabel: 'Credentials', description: 'Pull data from Snowflake data warehouses and display it in custom dashboards.' },
];

export const PLATFORM_CATEGORY_FILTERS: { value: PlatformCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PPC', label: 'PPC' },
  { value: 'SEO', label: 'SEO' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'ECOMMERCE', label: 'Ecommerce' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'CALL_TRACKING', label: 'Call Tracking' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'DATABASE', label: 'Database' },
];

/** Get initials + deterministic background color for a platform logo. */
export function getPlatformInitials(name: string): { initials: string; colorClass: string } {
  const initials = name
    .split(/[\s.()]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colors: Record<string, string> = {
    G: 'bg-blue-500', M: 'bg-blue-600', F: 'bg-blue-700', L: 'bg-sky-600',
    T: 'bg-pink-500', A: 'bg-orange-500', Y: 'bg-red-500', S: 'bg-emerald-600',
    P: 'bg-rose-500', X: 'bg-gray-800', R: 'bg-orange-600', C: 'bg-violet-500',
    H: 'bg-orange-400', K: 'bg-indigo-500', B: 'bg-green-600', W: 'bg-purple-500',
    V: 'bg-cyan-500', D: 'bg-teal-500', I: 'bg-pink-600', U: 'bg-amber-500',
    N: 'bg-lime-600', Z: 'bg-gray-600',
  };

  const colorClass = colors[initials[0]] ?? 'bg-muted-foreground/40';
  return { initials, colorClass };
}
