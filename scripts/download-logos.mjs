import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/integrations');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Platforms not covered by @iconify/logos or simple-icons
const TARGETS = {
  AHREFS:               { domain: 'ahrefs.com' },
  KLAVIYO:              { domain: 'klaviyo.com' },
  ACTIVECAMPAIGN:       { domain: 'activecampaign.com' },
  CALLRAIL:             { domain: 'callrail.com' },
  YEXT:                 { domain: 'yext.com' },
  BIRDEYE:              { domain: 'birdeye.com' },
  STACKADAPT:           { domain: 'stackadapt.com' },
  CONVERTKIT:           { domain: 'kit.com' },
  CONSTANT_CONTACT:     { domain: 'constantcontact.com' },
  KEAP:                 { domain: 'keap.com' },
  HIGHLEVEL:            { domain: 'gohighlevel.com' },
  SHARPSPRING:          { domain: 'sharpspring.com' },
  BRIGHTLOCAL:          { domain: 'brightlocal.com' },
  MAJESTIC_SEO:         { domain: 'majestic.com' },
  SE_RANKING:           { domain: 'seranking.com' },
  SIMPLIFI:             { domain: 'simpli.fi' },
  CHOOZLE:              { domain: 'choozle.com' },
  GROUNDTRUTH:          { domain: 'groundtruth.com' },
  BASIS_PLATFORM:       { domain: 'basis.com' },
  AVANSER:              { domain: 'avanser.com.au' },
  CALLSOURCE:           { domain: 'callsource.com' },
  CALLTRACKING_METRICS: { domain: 'calltrackingmetrics.com' },
  WHATCONVERTS:         { domain: 'whatconverts.com' },
  MARCHEX:              { domain: 'marchex.com' },
  DELACON:              { domain: 'delacon.com.au' },
  WILDJAR:              { domain: 'wildjar.com' },
  GATHERUP:             { domain: 'gatherup.com' },
  GRADE_US:             { domain: 'grade.us' },
  SYNUP:                { domain: 'synup.com' },
  VENDASTA:             { domain: 'vendasta.com' },
  RANK_TRACKER:         { domain: 'ranktracker.com' },
  BACKLINK_MONITOR:     { domain: 'monitor.backlinkwatch.com' },
  MOZ:                  { domain: 'moz.com' },
  // Better Google sub-product icons
  GOOGLE_SHEETS:        { domain: 'docs.google.com', path: '/favicon.ico' },
  SALESFORCE:           { domain: 'salesforce.com' },
  TWILIO:               { domain: 'twilio.com' },
  LINKEDIN_ADS:         { domain: 'linkedin.com' },
  AMAZON_ADS:           { domain: 'advertising.amazon.com' },
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.destroy();
        return fetch(redirectUrl).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.destroy();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || '' }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function tryUrls(domain, key) {
  const paths = [
    `https://${domain}/apple-touch-icon.png`,
    `https://${domain}/apple-touch-icon-precomposed.png`,
    `https://www.${domain}/apple-touch-icon.png`,
    `https://${domain}/favicon-192x192.png`,
    `https://${domain}/favicon-96x96.png`,
    `https://${domain}/favicon.png`,
    `https://www.${domain}/favicon.png`,
    `https://${domain}/favicon.ico`,
  ];

  for (const url of paths) {
    try {
      const { buffer, contentType } = await fetch(url);
      if (buffer.length < 100) continue; // skip tiny files
      const ext = contentType.includes('png') || url.endsWith('.png') ? 'png'
                : contentType.includes('ico') || url.endsWith('.ico') ? 'ico'
                : 'png';
      const dest = path.join(OUT_DIR, `${key}.${ext}`);
      fs.writeFileSync(dest, buffer);
      console.log(`✓ ${key} <- ${url} (${buffer.length} bytes)`);
      return ext;
    } catch {
      // try next
    }
  }
  console.log(`✗ ${key} (${domain}) - all failed`);
  return null;
}

const results = {};
for (const [key, { domain, path: customPath }] of Object.entries(TARGETS)) {
  const ext = await tryUrls(customPath ? domain + customPath : domain, key);
  if (ext) results[key] = ext;
  await new Promise(r => setTimeout(r, 150)); // be polite
}

console.log('\nSuccess:', Object.keys(results).length, '/', Object.keys(TARGETS).length);
console.log('Downloaded:', Object.keys(results).join(', '));
