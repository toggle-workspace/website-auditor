import { PerformanceData, CoreWebVital, PageSpeedOpportunity, ScoreRating } from '@/lib/types';
import { ratingFromScore } from '@/lib/utils/score';

const PAGESPEED_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  details?: { type: string; items?: unknown[] };
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number | null };
      accessibility?: { score: number | null };
      'best-practices'?: { score: number | null };
      seo?: { score: number | null };
    };
    audits?: Record<string, LighthouseAudit>;
  };
}

function toScore(raw: number | null): number | null {
  if (raw === null || raw === undefined) return null;
  return Math.round(raw * 100);
}

function auditRating(score: number | null): ScoreRating {
  if (score === null) return 'unknown';
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

const CORE_WEB_VITAL_IDS = [
  { id: 'largest-contentful-paint', label: 'LCP' },
  { id: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'total-blocking-time', label: 'TBT' },
  { id: 'first-contentful-paint', label: 'FCP' },
  { id: 'interactive', label: 'TTI' },
  { id: 'speed-index', label: 'Speed Index' },
];

async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop') {
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'performance',
  });
  params.append('category', 'accessibility');
  params.append('category', 'seo');
  params.append('category', 'best-practices');

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) params.set('key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${PAGESPEED_BASE}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (res.status === 429) {
      throw new Error('PageSpeed API quota exceeded. Add a free PAGESPEED_API_KEY to .env.local to get performance scores.');
    }
    if (!res.ok) throw new Error(`PageSpeed API returned ${res.status}`);
    return (await res.json()) as PageSpeedResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function parseResult(data: PageSpeedResponse) {
  const lr = data.lighthouseResult;
  const cats = lr?.categories;
  const audits = lr?.audits ?? {};

  const coreWebVitals: CoreWebVital[] = CORE_WEB_VITAL_IDS.map(({ id, label }) => {
    const audit = audits[id];
    return {
      id,
      label,
      displayValue: audit?.displayValue ?? 'N/A',
      score: audit?.score != null ? Math.round(audit.score * 100) : null,
      rating: auditRating(audit?.score ?? null) as ScoreRating,
    };
  }).filter(v => v.displayValue !== 'N/A');

  const opportunities: PageSpeedOpportunity[] = Object.values(audits)
    .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 1)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      displayValue: a.displayValue,
      score: a.score != null ? Math.round(a.score * 100) : null,
    }));

  const diagnostics: PageSpeedOpportunity[] = Object.values(audits)
    .filter(
      a =>
        (a.details?.type === 'table' || a.details?.type === 'list') &&
        a.score !== null &&
        a.score < 1
    )
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      displayValue: a.displayValue,
      score: a.score != null ? Math.round(a.score * 100) : null,
    }));

  return {
    performanceScore: toScore(cats?.performance?.score ?? null),
    accessibilityScore: toScore(cats?.accessibility?.score ?? null),
    bestPracticesScore: toScore(cats?.['best-practices']?.score ?? null),
    seoScore: toScore(cats?.seo?.score ?? null),
    coreWebVitals,
    opportunities,
    diagnostics,
  };
}

export async function analyzePerformance(url: string): Promise<PerformanceData> {
  const [mobileData, desktopData] = await Promise.allSettled([
    fetchPageSpeed(url, 'mobile'),
    fetchPageSpeed(url, 'desktop'),
  ]);

  const mobile =
    mobileData.status === 'fulfilled'
      ? parseResult(mobileData.value)
      : {
          performanceScore: null,
          accessibilityScore: null,
          bestPracticesScore: null,
          seoScore: null,
          coreWebVitals: [],
          opportunities: [],
          diagnostics: [],
        };

  const desktop =
    desktopData.status === 'fulfilled'
      ? parseResult(desktopData.value)
      : {
          performanceScore: null,
          accessibilityScore: null,
          bestPracticesScore: null,
          seoScore: null,
          coreWebVitals: [],
          opportunities: [],
          diagnostics: [],
        };

  // Surface the error if both strategies failed
  if (mobileData.status === 'rejected' && desktopData.status === 'rejected') {
    throw new Error(mobileData.reason?.message ?? 'PageSpeed API unavailable');
  }

  return { mobile, desktop, fetchedAt: new Date().toISOString() };
}

export function scoreFromPerformance(data: PerformanceData): number | null {
  const scores = [
    data.mobile.performanceScore,
    data.mobile.accessibilityScore,
    data.mobile.bestPracticesScore,
  ].filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export { ratingFromScore };
