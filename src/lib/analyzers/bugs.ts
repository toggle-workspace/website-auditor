import * as cheerio from 'cheerio';
import axios from 'axios';
import { BugData, BrokenLink, MissingAltImage } from '@/lib/types';
import { isSameDomain, getOrigin } from '@/lib/utils/url';

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
      const res = await axios.head(`${origin}/favicon.ico`, { timeout: 5000 });
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

  // Broken link check via linkinator
  let brokenLinks: BrokenLink[] = [];
  let linksChecked = 0;

  try {
    const { LinkChecker } = await import('linkinator');
    const checker = new LinkChecker();

    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 20000));
    const checkPromise = checker.check({
      path: url,
      recurse: false,
      timeout: 5000,
      linksToSkip: ['^mailto:', '^tel:', '^javascript:', '^#'],
    });

    const results = await Promise.race([checkPromise, timeoutPromise]);

    if (results) {
      const sameDomainLinks = results.links.filter(l => {
        try {
          return isSameDomain(l.url, url);
        } catch {
          return false;
        }
      });

      linksChecked = sameDomainLinks.length;
      brokenLinks = sameDomainLinks
        .filter(l => l.state === 'BROKEN')
        .slice(0, 20)
        .map(l => ({
          url: l.url,
          status: l.status ?? null,
          parent: url,
          failureReason: l.failureDetails?.[0]?.toString(),
        }));
    }
  } catch {
    // linkinator failed gracefully
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
