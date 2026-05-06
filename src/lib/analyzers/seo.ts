import axios from 'axios';
import * as cheerio from 'cheerio';
import { SeoData, SeoCheckItem } from '@/lib/types';
import { getOrigin } from '@/lib/utils/url';

export async function analyzeSeo(url: string): Promise<{ data: SeoData; html: string; score: number }> {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'WebsiteAuditor/1.0 (compatibility check)' },
    maxRedirects: 5,
  });

  const html = response.data as string;
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
    const robotsRes = await axios.get(`${origin}/robots.txt`, { timeout: 5000 });
    if (robotsRes.status === 200) {
      hasRobotsTxt = true;
      const robotsParser = require('robots-parser');
      const parser = robotsParser(`${origin}/robots.txt`, robotsRes.data);
      robotsAllowsCrawl = parser.isAllowed(url, 'Googlebot') !== false;
      const sitemaps = parser.getSitemaps();
      if (sitemaps.length > 0) sitemapUrlFromRobots = sitemaps[0];
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
    try {
      const SitemapperModule = await import('sitemapper');
      const SitemapperClass = SitemapperModule.default || SitemapperModule;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapper = new (SitemapperClass as any)({ url: candidate, timeout: 8000 });
      const result = await mapper.fetch();
      if (result.sites.length > 0) {
        hasSitemap = true;
        sitemapUrl = candidate;
        sitemapPageCount = result.sites.length;
        break;
      }
    } catch {
      // try next
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
