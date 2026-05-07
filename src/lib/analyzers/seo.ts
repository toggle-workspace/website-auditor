import * as cheerio from 'cheerio';
import { SeoData, SeoCheckItem } from '@/lib/types';
import { getOrigin } from '@/lib/utils/url';

function parseRobotsTxt(content: string, targetUrl: string): { allowsCrawl: boolean; sitemapUrl: string | null } {
  const lines = content.split('\n').map(l => l.split('#')[0].trim()).filter(Boolean);
  let sitemapUrl: string | null = null;
  const rules: Array<{ agents: string[]; disallow: string[]; allow: string[] }> = [];
  let currentAgents: string[] = [];
  let currentDisallow: string[] = [];
  let currentAllow: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('sitemap:')) {
      sitemapUrl = line.slice(8).trim();
    } else if (lower.startsWith('user-agent:')) {
      if (currentAgents.length > 0) {
        rules.push({ agents: currentAgents, disallow: currentDisallow, allow: currentAllow });
        currentAgents = [];
        currentDisallow = [];
        currentAllow = [];
      }
      currentAgents.push(line.slice(11).trim().toLowerCase());
    } else if (lower.startsWith('disallow:')) {
      currentDisallow.push(line.slice(9).trim());
    } else if (lower.startsWith('allow:')) {
      currentAllow.push(line.slice(6).trim());
    }
  }
  if (currentAgents.length > 0) {
    rules.push({ agents: currentAgents, disallow: currentDisallow, allow: currentAllow });
  }

  let path: string;
  try {
    path = new URL(targetUrl).pathname;
  } catch {
    path = '/';
  }

  for (const agentName of ['googlebot', '*']) {
    const rule = rules.find(r => r.agents.includes(agentName));
    if (!rule) continue;
    for (const allow of rule.allow) {
      if (allow && path.startsWith(allow)) return { allowsCrawl: true, sitemapUrl };
    }
    for (const disallow of rule.disallow) {
      if (disallow && path.startsWith(disallow)) return { allowsCrawl: false, sitemapUrl };
    }
  }
  return { allowsCrawl: true, sitemapUrl };
}

async function fetchSitemapCount(url: string): Promise<number> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return 0;
    const xml = await res.text();
    const urlCount = (xml.match(/<url[\s>]/gi) ?? []).length;
    const sitemapRefCount = (xml.match(/<sitemap[\s>]/gi) ?? []).length;
    return urlCount || sitemapRefCount;
  } catch {
    return 0;
  }
}

export async function analyzeSeo(url: string): Promise<{ data: SeoData; html: string; score: number }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WebsiteAuditor/1.0 (compatibility check)' },
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const origin = getOrigin(url);

  const title = $('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2Tags = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10);
  const h3Tags = $('h3').map((_, el) => $(el).text().trim()).get().slice(0, 10);
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription = $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;
  const langAttribute = $('html').attr('lang') || null;

  const jsonLdScripts = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get();
  const structuredDataTypes: string[] = [];
  for (const script of jsonLdScripts) {
    try {
      const parsed = JSON.parse(script || '{}');
      const types = Array.isArray(parsed) ? parsed.map((p: { '@type'?: string }) => p['@type']) : [parsed['@type']];
      structuredDataTypes.push(...types.filter(Boolean));
    } catch {
      // invalid JSON-LD
    }
  }

  // robots.txt
  let hasRobotsTxt = false;
  let robotsAllowsCrawl = true;
  let sitemapUrlFromRobots: string | null = null;

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3000) });
    if (robotsRes.ok) {
      hasRobotsTxt = true;
      const robotsText = await robotsRes.text();
      const parsed = parseRobotsTxt(robotsText, url);
      robotsAllowsCrawl = parsed.allowsCrawl;
      sitemapUrlFromRobots = parsed.sitemapUrl;
    }
  } catch {
    // no robots.txt
  }

  // sitemap
  let hasSitemap = false;
  let sitemapUrl: string | null = sitemapUrlFromRobots;
  let sitemapPageCount = 0;

  const sitemapCandidates = [
    sitemapUrlFromRobots,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ].filter(Boolean) as string[];

  for (const candidate of sitemapCandidates) {
    const count = await fetchSitemapCount(candidate);
    if (count > 0) {
      hasSitemap = true;
      sitemapUrl = candidate;
      sitemapPageCount = count;
      break;
    }
  }

  // Build checks & score
  let score = 100;
  const checks: SeoCheckItem[] = [];

  function check(
    id: string,
    label: string,
    condition: boolean,
    value?: string,
    recommendation?: string,
    isWarning = false,
    deduction = 0
  ) {
    const status = condition ? 'pass' : isWarning ? 'warning' : 'fail';
    if (!condition) score -= deduction;
    checks.push({ id, label, status, value, recommendation });
  }

  check('title', 'Page title present', !!title, title ?? undefined, 'Add a descriptive <title> tag.', false, 15);
  check(
    'title-length',
    'Title length (10–60 chars)',
    !!title && title.length >= 10 && title.length <= 60,
    title ? `${title.length} chars` : undefined,
    'Keep title between 10–60 characters.',
    true,
    5
  );
  check(
    'meta-description',
    'Meta description present',
    !!metaDescription,
    metaDescription ?? undefined,
    'Add a meta description (120–160 chars).',
    false,
    10
  );
  check(
    'meta-description-length',
    'Meta description length (≤160 chars)',
    !metaDescription || metaDescription.length <= 160,
    metaDescription ? `${metaDescription.length} chars` : undefined,
    'Shorten meta description to under 160 characters.',
    true,
    5
  );
  check('h1', 'H1 tag present', h1Tags.length > 0, h1Tags[0], 'Add exactly one H1 tag.', false, 10);
  check(
    'single-h1',
    'Only one H1 tag',
    h1Tags.length <= 1,
    `${h1Tags.length} H1 tags found`,
    'Use only one H1 per page.',
    true,
    5
  );
  check('canonical', 'Canonical URL set', !!canonicalUrl, canonicalUrl ?? undefined, 'Add <link rel="canonical">.', true, 5);
  check('og-tags', 'Open Graph tags', !!ogTitle && !!ogDescription, ogTitle ?? undefined, 'Add og:title and og:description.', true, 5);
  check('og-image', 'OG image present', !!ogImage, ogImage ?? undefined, 'Add og:image for social sharing.', true, 3);
  check('viewport', 'Viewport meta tag', hasViewportMeta, undefined, 'Add <meta name="viewport">.', false, 10);
  check('robots-txt', 'robots.txt present', hasRobotsTxt, undefined, 'Create a robots.txt file.', true, 5);
  check('robots-crawl', 'Googlebot can crawl', robotsAllowsCrawl, undefined, 'robots.txt is blocking Googlebot.', false, 15);
  check('sitemap', 'XML sitemap found', hasSitemap, sitemapUrl ?? undefined, 'Create and submit a sitemap.xml.', true, 5);
  check('structured-data', 'Structured data (JSON-LD)', structuredDataTypes.length > 0, structuredDataTypes.join(', '), 'Add JSON-LD structured data.', true, 5);
  check('lang', 'HTML lang attribute', !!langAttribute, langAttribute ?? undefined, 'Add lang attribute to <html>.', true, 5);

  score = Math.max(0, score);

  return {
    html,
    score,
    data: {
      url,
      title,
      titleLength: title?.length ?? 0,
      metaDescription,
      metaDescriptionLength: metaDescription?.length ?? 0,
      h1Tags,
      h2Tags,
      h3Tags,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      hasViewportMeta,
      hasRobotsTxt,
      robotsAllowsCrawl,
      hasSitemap,
      sitemapUrl,
      sitemapPageCount,
      hasStructuredData: structuredDataTypes.length > 0,
      structuredDataTypes,
      langAttribute,
      checks,
    },
  };
}
