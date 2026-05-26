/**
 * Credential schemas for API-key platforms.
 *
 * Storage layout (matches backend StandardApiKeyService):
 *   apiKey            → accessToken (encrypted)
 *   apiUrl/accessId   → externalAccountId as JSON {"apiUrl":"..."} or {"accessId":"..."}
 *   externalAccountId → stored as-is (takes precedence over apiUrl/accessId assembly)
 *
 * Tier A: single API key
 * Tier B: key + one secondary field (apiUrl or accessId)
 * Tier C: multi-field JSON (storeUrl, host, etc.)
 */

export type FieldType = 'text' | 'password' | 'url' | 'number' | 'textarea';

export interface FieldDef {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  hint?: string;
  required?: boolean;
}

export interface CredentialPayload {
  apiKey: string;
  apiUrl?: string;
  accessId?: string;
  externalAccountId?: string;
}

export interface CredentialSchema {
  fields: FieldDef[];
  buildPayload: (values: Record<string, string>) => CredentialPayload;
}

// ─── Reusable tier helpers ────────────────────────────────────────────────────

function tierA(label = 'API Key', placeholder = 'Enter your API key', hint?: string): CredentialSchema {
  return {
    fields: [{ id: 'apiKey', label, placeholder, type: 'password', required: true, hint }],
    buildPayload: (v) => ({ apiKey: v.apiKey }),
  };
}

function tierBUrl(
  keyLabel = 'API Key',
  urlLabel = 'Account URL',
  urlPlaceholder = 'https://youraccountname.api-us1.com',
  urlHint?: string,
): CredentialSchema {
  return {
    fields: [
      { id: 'apiKey', label: keyLabel, placeholder: 'Enter your API key', type: 'password', required: true },
      { id: 'apiUrl', label: urlLabel, placeholder: urlPlaceholder, type: 'url', required: true, hint: urlHint },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, apiUrl: v.apiUrl }),
  };
}

function tierBId(
  keyLabel = 'Secret Key',
  idLabel = 'Access ID',
  idPlaceholder = 'Enter access ID',
  idHint?: string,
): CredentialSchema {
  return {
    fields: [
      { id: 'accessId', label: idLabel, placeholder: idPlaceholder, type: 'text', required: true, hint: idHint },
      { id: 'apiKey', label: keyLabel, placeholder: 'Enter your secret key', type: 'password', required: true },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, accessId: v.accessId }),
  };
}

// ─── Platform credential schemas map ─────────────────────────────────────────

export const CREDENTIAL_SCHEMAS: Record<string, CredentialSchema> = {
  // ─── Email ────────────────────────────────────────────────────────────────
  KLAVIYO: tierA('Private API Key', 'pk_live_...', 'Found in Klaviyo → Account → Settings → API Keys'),
  BREVO: tierA('API Key', 'xkeysib-...', 'Found in Brevo → My Account → SMTP & API → API Keys'),
  CAMPAIGN_MONITOR: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Campaign Monitor API key', type: 'password', required: true, hint: 'Found in Campaign Monitor → Account Settings → API Keys' },
      { id: 'clientId', label: 'Client ID', placeholder: 'Enter your Client ID', type: 'text', required: false, hint: 'Found in Campaign Monitor — Client ID in the URL when viewing a client. Leave blank to auto-detect.' },
    ],
    buildPayload: (v) => ({
      apiKey: v.apiKey,
      externalAccountId: v.clientId?.trim() || undefined,
    }),
  },
  CONVERTKIT: tierA('API Secret', 'Enter your ConvertKit API secret', 'Found in ConvertKit → Settings → Advanced → API Secret'),
  DRIP: {
    fields: [
      { id: 'apiKey', label: 'API Token', placeholder: 'Enter your Drip API token', type: 'password', required: true, hint: 'Found in Drip → User Settings → API Token' },
      { id: 'accountId', label: 'Account ID', placeholder: 'Enter your Drip account ID', type: 'text', required: true, hint: 'Visible in the URL: app.getdrip.com/ACCOUNT_ID/...' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.accountId }),
  },
  ACTIVECAMPAIGN: tierBUrl(
    'API Key',
    'Account URL',
    'https://youraccountname.api-us1.com',
    'Found in ActiveCampaign → Settings → Developer → API Access',
  ),
  // ─── SEO ──────────────────────────────────────────────────────────────────
  SEMRUSH: tierA('API Key', 'Enter your Semrush API key', 'Found in Semrush → Profile → API keys'),
  AHREFS: tierA('API Token', 'Enter your Ahrefs API token', 'Found in Ahrefs → Settings → API'),
  MAJESTIC_SEO: tierA('API Key', 'Enter your Majestic API key', 'Found in Majestic → My Account → Developer API'),
  SE_RANKING: {
    fields: [
      { id: 'apiKey', label: 'API Token', placeholder: 'Enter your SE Ranking API token', type: 'password', required: true, hint: 'Found in SE Ranking → Profile → API access' },
      { id: 'siteId', label: 'Site ID', placeholder: 'Enter your SE Ranking Site ID', type: 'text', required: true, hint: 'Numeric ID visible in the URL when viewing a project in SE Ranking' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.siteId }),
  },
  BRIGHTLOCAL: tierA('API Key', 'Enter your BrightLocal API key', 'Found in BrightLocal → Account Settings → API Key'),
  BING_WEBMASTER_TOOLS: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Bing API Key', type: 'password', required: true, hint: 'Found in Bing Webmaster Tools → Settings → API Access → API Key' },
      { id: 'siteUrl', label: 'Site URL', placeholder: 'https://example.com', type: 'url', required: true, hint: 'The exact URL of your site as registered in Bing (e.g. https://qodet.com/)' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.siteUrl }),
  },
  GOOGLE_PAGESPEED: tierBUrl(
    'PageSpeed API Key',
    'Website URL to Audit',
    'https://example.com',
    'API key is optional — leave blank to use free tier. Website URL is the page to audit.',
  ),
  GOOGLE_LIGHTHOUSE: {
    fields: [
      { id: 'apiUrl', label: 'Website URL to Audit', placeholder: 'https://example.com', type: 'url', required: true, hint: 'No API key needed — Lighthouse runs publicly accessible pages.' },
    ],
    buildPayload: (v) => ({ apiKey: 'no-auth', apiUrl: v.apiUrl }),
  },
  RANK_TRACKER: tierA('API Key', 'Enter your Rank Tracker API key'),
  BACKLINK_MONITOR: tierA('API Key', 'Enter your Backlink Monitor API key'),
  MOZ: tierBId('Secret Key', 'Access ID', 'mozscape-...', 'Found in Moz → My Account → API Access → Access ID'),
  // ─── PPC ──────────────────────────────────────────────────────────────────
  STACKADAPT: tierA('GraphQL Token', 'Enter your StackAdapt GraphQL token', 'Found in StackAdapt → Settings → API'),
  SIMPLIFI: tierBId('API Secret', 'API Key / Client ID', 'Enter your API key', 'Found in Simpli.fi → Settings → API Access'),
  CHOOZLE: tierA('API Key', 'Enter your Choozle API key', 'Found in Choozle → Account Settings → API'),
  GROUNDTRUTH: tierA('API Key', 'Enter your GroundTruth API key'),
  BASIS_PLATFORM: tierA('API Key', 'Enter your Basis Platform API key'),
  YELP_ADS: tierA('API Key', 'Enter your Yelp Ads API key', 'Found in Yelp → Manage Account → API'),
  UNBOUNCE: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Unbounce API key', type: 'password', required: true, hint: 'Found in Unbounce → Manage Account → API Access' },
      { id: 'accountId', label: 'Account ID', placeholder: 'e.g. 4983889', type: 'text', required: true, hint: 'Visible in the URL: app.unbounce.com/.../accounts/ACCOUNT_ID/...' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.accountId }),
  },
  // ─── Ecommerce ─────────────────────────────────────────────────────────────
  WOOCOMMERCE: {
    fields: [
      { id: 'storeUrl', label: 'Store URL', placeholder: 'https://mystore.com', type: 'url', required: true, hint: 'Your WooCommerce store\'s base URL' },
      { id: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', type: 'text', required: true },
      { id: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', type: 'password', required: true, hint: 'Generated in WooCommerce → Settings → Advanced → REST API' },
    ],
    buildPayload: (v) => ({
      apiKey: v.consumerKey,
      externalAccountId: JSON.stringify({ siteUrl: v.storeUrl, consumerSecret: v.consumerSecret }),
    }),
  },
  BIGCOMMERCE: {
    fields: [
      { id: 'storeHash', label: 'Store Hash', placeholder: 'Enter your store hash', type: 'text', required: true, hint: 'The alphanumeric hash from your API URL (e.g. stores/HASH/v3)' },
      { id: 'apiKey', label: 'API Token (V2/V3)', placeholder: 'Enter your BigCommerce API token', type: 'password', required: true, hint: 'Generated in BigCommerce → Advanced Settings → API Accounts' },
    ],
    buildPayload: (v) => ({
      apiKey: v.apiKey,
      externalAccountId: JSON.stringify({ storeHash: v.storeHash }),
    }),
  },
  STRIPE_ECOMMERCE: tierA('Secret Key', 'sk_live_...', 'Found in Stripe Dashboard → Developers → API Keys → Secret key'),
  // ─── Analytics & CRM ───────────────────────────────────────────────────────
  MATOMO: {
    fields: [
      { id: 'authToken', label: 'Auth Token', placeholder: 'Enter your Matomo auth token', type: 'password', required: true, hint: 'Found in Matomo → Administration → Personal Settings → Security → Auth tokens' },
      { id: 'matomoUrl', label: 'Matomo URL', placeholder: 'https://analytics.yoursite.com', type: 'url', required: true, hint: 'Your Matomo instance URL (without trailing slash)' },
      { id: 'siteId', label: 'Site ID', placeholder: '1', type: 'number', required: true, hint: 'Visible in Matomo URL as idSite=X when viewing a site' },
    ],
    buildPayload: (v) => ({
      apiKey: v.authToken,
      externalAccountId: JSON.stringify({ matomoUrl: v.matomoUrl.replace(/\/$/, ''), siteId: v.siteId }),
    }),
  },
  SHARPSPRING: tierBId(
    'Secret Key',
    'Account ID',
    'Enter your SharpSpring account ID',
    'Found in SharpSpring → Settings → API Settings',
  ),
  GRAVITY_FORMS: {
    fields: [
      { id: 'siteUrl', label: 'WordPress Site URL', placeholder: 'https://yoursite.com', type: 'url', required: true },
      { id: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', type: 'text', required: true },
      { id: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', type: 'password', required: true },
      { id: 'formId', label: 'Form ID', placeholder: '1', type: 'number', required: true, hint: 'The numeric ID of the Gravity Form to track' },
    ],
    buildPayload: (v) => ({
      apiKey: v.consumerKey,
      externalAccountId: JSON.stringify({ siteUrl: v.siteUrl, consumerSecret: v.consumerSecret, formId: v.formId }),
    }),
  },
  // ─── Call Tracking ─────────────────────────────────────────────────────────
  CALLRAIL: tierA('API Key', 'Enter your CallRail API key', 'Found in CallRail → Account Settings → API access → Create API key'),
  CALLTRACKING_METRICS: {
    fields: [
      { id: 'accountId', label: 'Account ID', placeholder: 'Enter your CTM account ID', type: 'text', required: true, hint: 'Found in CallTrackingMetrics → Account → Settings' },
      { id: 'secretKey', label: 'Secret Key', placeholder: 'Enter your CTM secret key', type: 'password', required: true, hint: 'Found in CallTrackingMetrics → Account → Settings → API Keys' },
    ],
    buildPayload: (v) => ({
      apiKey: v.secretKey,
      externalAccountId: JSON.stringify({ accountId: v.accountId, secretKey: v.secretKey }),
    }),
  },
  TWILIO: tierBId(
    'Auth Token',
    'Account SID',
    'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'Found in Twilio Console → Account Info panel',
  ),
  WHATCONVERTS: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your WhatConverts API key', type: 'password', required: true, hint: 'Found in WhatConverts → Settings → API' },
      { id: 'secretKey', label: 'API Secret', placeholder: 'Enter your WhatConverts API secret', type: 'password', required: true },
    ],
    buildPayload: (v) => ({
      apiKey: v.apiKey,
      externalAccountId: JSON.stringify({ secretKey: v.secretKey }),
    }),
  },
  MARCHEX: tierA('API Key', 'Enter your Marchex API key'),
  AVANSER: tierA('API Key', 'Enter your Avanser API key'),
  CALLSOURCE: tierA('API Key', 'Enter your CallSource API key'),
  DELACON: tierA('API Key', 'Enter your Delacon API key'),
  WILDJAR: tierA('API Key', 'Enter your WildJar API key'),
  // ─── Local & Reputation ─────────────────────────────────────────────────────
  YELP: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Yelp Fusion API key', type: 'password', required: true, hint: 'Found at fusion.yelp.com → Manage App' },
      { id: 'businessId', label: 'Business ID', placeholder: 'gary-danko-san-francisco', type: 'text', required: true, hint: 'The slug from your Yelp business URL: yelp.com/biz/YOUR-BUSINESS-ID' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.businessId }),
  },
  BIRDEYE: {
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Birdeye API key', type: 'password', required: true, hint: 'Found in Birdeye → Settings → Integrations → API' },
      { id: 'businessId', label: 'Business ID', placeholder: '123456789', type: 'text', required: true, hint: 'Numeric ID visible in your Birdeye account URL or under Settings → Account Info' },
    ],
    buildPayload: (v) => ({ apiKey: v.apiKey, externalAccountId: v.businessId }),
  },
  GATHERUP: tierBId(
    'Bearer Token',
    'Client ID',
    'Your GatherUp Client ID (hash string from API Credentials page)',
    'Found in GatherUp → Settings → API Credentials',
  ),
  GRADE_US: tierA('API Key', 'Enter your Grade.us API key'),
  SYNUP: tierA('API Key', 'Enter your Synup API key'),
  // ─── Database / Warehouse ─────────────────────────────────────────────────
  MYSQL_DB: {
    fields: [
      { id: 'host', label: 'Host', placeholder: 'db.example.com', type: 'text', required: true },
      { id: 'port', label: 'Port', placeholder: '3306', type: 'number', required: false },
      { id: 'database', label: 'Database Name', placeholder: 'analytics', type: 'text', required: true },
      { id: 'user', label: 'Username', placeholder: 'readonly_user', type: 'text', required: true },
      { id: 'password', label: 'Password', placeholder: 'Enter password', type: 'password', required: true },
      { id: 'query', label: 'SQL Query', placeholder: "SELECT date, metric_key, value FROM metrics WHERE date BETWEEN '{from}' AND '{to}'", type: 'textarea', required: true, hint: 'Must return columns: date (YYYY-MM-DD), metric_key, value. Use {from} and {to} as date placeholders.' },
    ],
    buildPayload: (v) => ({
      apiKey: v.password,
      externalAccountId: JSON.stringify({ host: v.host, port: v.port ? parseInt(v.port, 10) : 3306, database: v.database, user: v.user, query: v.query }),
    }),
  },
  AMAZON_REDSHIFT: {
    fields: [
      { id: 'host', label: 'Cluster Endpoint', placeholder: 'mycluster.xxxx.us-east-1.redshift.amazonaws.com', type: 'text', required: true },
      { id: 'port', label: 'Port', placeholder: '5439', type: 'number', required: false },
      { id: 'database', label: 'Database Name', placeholder: 'analytics', type: 'text', required: true },
      { id: 'user', label: 'Username', placeholder: 'readonly_user', type: 'text', required: true },
      { id: 'password', label: 'Password', placeholder: 'Enter password', type: 'password', required: true },
      { id: 'query', label: 'SQL Query', placeholder: "SELECT date, metric_key, value FROM metrics WHERE date BETWEEN '{from}' AND '{to}'", type: 'textarea', required: true, hint: 'Must return columns: date (YYYY-MM-DD), metric_key, value. Use {from} and {to} as date placeholders.' },
    ],
    buildPayload: (v) => ({
      apiKey: v.password,
      externalAccountId: JSON.stringify({ host: v.host, port: v.port ? parseInt(v.port, 10) : 5439, database: v.database, user: v.user, query: v.query }),
    }),
  },
  SNOWFLAKE: {
    fields: [
      { id: 'account', label: 'Account Identifier', placeholder: 'myorg-myaccount', type: 'text', required: true, hint: 'e.g. myorg-myaccount or the full URL prefix' },
      { id: 'user', label: 'Username', placeholder: 'READONLY_USER', type: 'text', required: true },
      { id: 'password', label: 'Password', placeholder: 'Enter password', type: 'password', required: true },
      { id: 'database', label: 'Database', placeholder: 'ANALYTICS_DB', type: 'text', required: true },
      { id: 'schema', label: 'Schema', placeholder: 'PUBLIC', type: 'text', required: true },
      { id: 'warehouse', label: 'Warehouse', placeholder: 'COMPUTE_WH', type: 'text', required: true },
      { id: 'query', label: 'SQL Query', placeholder: "SELECT date, metric_key, value FROM metrics WHERE date BETWEEN '{from}' AND '{to}'", type: 'textarea', required: true, hint: 'Must return columns: DATE, METRIC_KEY, VALUE. Use {from} and {to} as date placeholders.' },
    ],
    buildPayload: (v) => ({
      apiKey: v.password,
      externalAccountId: JSON.stringify({ account: v.account, user: v.user, database: v.database, schema: v.schema, warehouse: v.warehouse, query: v.query }),
    }),
  },
};
