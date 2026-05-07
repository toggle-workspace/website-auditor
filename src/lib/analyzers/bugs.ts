import * as cheerio from 'cheerio';
import { BugData, BrokenLink, MissingAltImage } from '@/lib/types';
import { isSameDomain, getOrigin } from '@/lib/utils/url';

async function checkLinks(html: string, baseUrl: string): Promise<{ brokenLinks: BrokenLink[]; linksChecked: number }> {
  const $ = cheerio.load(html);
  const hrefs = $('a[href]')
    .map((_, el) => $(el).attr('href') ?? '')
    .get()
    .filter(href => href && !/^(mailto:|tel:|javascript:|#)/.test(href));

  const resolved = Array.from(new Set(
    hrefs.map(href => {
      try { return new URL(href, baseUrl).href; } catch { return null; }
    }).filter((u): u is string => u !== null && isSameDomain(u, baseUrl))
  )).slice(0, 20);

  const results = await Promise.allSettled(
    resolved.map(async (url) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try {
          const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
          return { url, status: res.status, broken: res.status >= 400 };
        } finally {
          clearTimeout(timer);
        }
      } catch {
        return { url, status: null as number | null, broken: true };
      }
    })
  );

  const checked = results
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter((r): r is { url: string; status: number | null; broken: boolean } => r !== null);

  const brokenLinks: BrokenLink[] = checked
    .filter(r => r.broken)
    .slice(0, 20)
    .map(r => ({ url: r.url, status: r.status, parent: baseUrl }));

  return { brokenLinks, linksChecked: checked.length };
}

export async function analyzeBugs(url: string, html: string): Promise<{ data: BugData; score: number }> {
  const $ = cheerio.load(html);
  const origin = getOrigin(url);
  const isHttps = url.startsWith('https://');

  const missingAltImages: MissingAltImage[] = $('img:not([alt]), img[alt=""]')
    .map((_, el) => ({ src: $(el).attr('src') || '' }))
    .get()
    .filter(img => img.src)
    .slice(0, 20);

  const missingMetaDescription = !$('meta[name="description"]').attr('content');
  const h1Count = $('h1').length;
  const duplicateH1 = h1Count > 1;

  const hasFaviconInHtml = $('link[rel~="icon"], link[rel="shortcut icon"]').length > 0;
  let hasFavicon = hasFaviconInHtml;
  if (!hasFavicon) {
    try {
      const res = await fetch(`${origin}/favicon.ico`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      hasFavicon = res.status < 400;
    } catch {
      hasFavicon = false;
    }
  }

  const hasMixedContent = isHttps && (
    $('[src^="http:"]').length > 0 ||
    $('[href^="http:"][rel!="canonical"][rel!="stylesheet"]').length > 0
  );

  const missingLangAttribute = !$('html').attr('lang');

  // Broken link check
  let brokenLinks: BrokenLink[] = [];
  let linksChecked = 0;

  try {
    const result = await checkLinks(html, url);
    brokenLinks = result.brokenLinks;
    linksChecked = result.linksChecked;
  } catch {
    // link check failed gracefully
  }

  // Build checks
  const checks: BugData['checks'] = [];

  function bugCheck(id: string, label: string, pass: boolean, detail?: string, warning = false) {
    checks.push({ id, label, status: pass ? 'pass' : warning ? 'warning' : 'fail', detail });
  }

  bugCheck('broken-links', `Broken links (${brokenLinks.length} found)`, brokenLinks.length === 0, brokenLinks.length > 0 ? `${brokenLinks.length} broken link(s) detected` : undefined);
  bugCheck('alt-text', `Images with alt text`, missingAltImages.length === 0, missingAltImages.length > 0 ? `${missingAltImages.length} image(s) missing alt text` : undefined);
  bugCheck('meta-desc', 'Meta description present', !missingMetaDescription, missingMetaDescription ? 'Add a meta description' : undefined);
  bugCheck('h1-count', 'Single H1 tag', !duplicateH1, duplicateH1 ? `${h1Count} H1 tags found — use only one` : undefined, true);
  bugCheck('favicon', 'Favicon present', hasFavicon, !hasFavicon ? 'Add a favicon.ico or <link rel="icon">' : undefined, true);
  bugCheck('mixed-content', 'No mixed content', !hasMixedContent, hasMixedContent ? 'HTTP resources loaded on HTTPS page' : undefined);
  bugCheck('lang', 'HTML lang attribute', !missingLangAttribute, missingLangAttribute ? 'Add lang attribute to <html>' : undefined, true);

  // Score
  let score = 100;
  score -= brokenLinks.length * 5;
  score -= missingAltImages.length * 2;
  if (missingMetaDescription) score -= 10;
  if (duplicateH1) score -= 5;
  if (!hasFavicon) score -= 5;
  if (hasMixedContent) score -= 15;
  if (missingLangAttribute) score -= 5;
  score = Math.max(0, score);

  return {
    score,
    data: {
      brokenLinks,
      brokenLinkCount: brokenLinks.length,
      linksChecked,
      missingAltImages,
      missingMetaDescription,
      duplicateH1,
      h1Count,
      hasFavicon,
      hasMixedContent,
      missingLangAttribute,
      checks,
    },
  };
}
