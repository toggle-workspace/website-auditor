import { NextResponse } from 'next/server';

export const maxDuration = 90;
import { normalizeUrl, extractDomain } from '@/lib/utils/url';
import { ratingFromScore, calculateOverallScore } from '@/lib/utils/score';
import { analyzePerformance, scoreFromPerformance } from '@/lib/analyzers/performance';
import { analyzeSeo } from '@/lib/analyzers/seo';
import { analyzeUx } from '@/lib/analyzers/ux';
import { analyzeBugs } from '@/lib/analyzers/bugs';
import { analyzeTraffic } from '@/lib/analyzers/traffic';
import { analyzeBrowser } from '@/lib/analyzers/browser';
import { AuditReport, SectionResult } from '@/lib/types';

function errResult(error: string): SectionResult {
  return { score: null, rating: 'unknown', data: {}, error };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  let url: string;
  try {
    url = normalizeUrl(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid URL provided.' }, { status: 400 });
  }

  try {
    // Step 1: Run performance and SEO in parallel (independent — neither needs the other's output)
    let perfData;
    let perfScore: number | null = null;
    let perfResult: SectionResult;
    let seo$: import('cheerio').CheerioAPI | null = null;
    let seoResult: SectionResult;
    let seoScore: number | null = null;

    const [perfSettled, seoSettled] = await Promise.allSettled([
      analyzePerformance(url),
      analyzeSeo(url),
    ]);

    if (perfSettled.status === 'fulfilled') {
      perfData = perfSettled.value;
      perfScore = scoreFromPerformance(perfData);
      perfResult = { score: perfScore, rating: ratingFromScore(perfScore), data: perfData };
    } else {
      const msg = perfSettled.reason instanceof Error ? perfSettled.reason.message : 'Performance analysis failed';
      perfResult = errResult(msg);
    }

    if (seoSettled.status === 'fulfilled') {
      const { data, $, score } = seoSettled.value;
      seo$ = $;
      seoScore = score;
      seoResult = { score, rating: ratingFromScore(score), data };
    } else {
      const msg = seoSettled.reason instanceof Error ? seoSettled.reason.message : 'SEO analysis failed';
      seoResult = errResult(msg);
    }

    // Empty perf data fallback — UX and Traffic can run with degraded data
    const emptyPerfData = perfData ?? {
      mobile: { performanceScore: null, accessibilityScore: null, bestPracticesScore: null, seoScore: null, coreWebVitals: [], opportunities: [], diagnostics: [] },
      desktop: { performanceScore: null, accessibilityScore: null, bestPracticesScore: null, seoScore: null, coreWebVitals: [], opportunities: [], diagnostics: [] },
      fetchedAt: new Date().toISOString(),
    };

    // Step 3: Run UX, Bugs, Traffic, and Browser in parallel using shared data
    const [uxSettled, bugsSettled, trafficSettled, browserSettled] = await Promise.allSettled([
      (async () => {
        if (!seo$) throw new Error('Missing HTML for UX analysis');
        return analyzeUx(seo$, emptyPerfData);
      })(),
      (async () => {
        if (!seo$) throw new Error('Missing HTML for bug analysis');
        return analyzeBugs(url, seo$);
      })(),
      (async () => {
        return analyzeTraffic(url, emptyPerfData, seoScore);
      })(),
      (async () => {
        return analyzeBrowser(url);
      })(),
    ]);

    const uxResult: SectionResult =
      uxSettled.status === 'fulfilled'
        ? { score: uxSettled.value.score, rating: ratingFromScore(uxSettled.value.score), data: uxSettled.value.data }
        : errResult(uxSettled.reason?.message ?? 'UX analysis failed');

    const bugsResult: SectionResult =
      bugsSettled.status === 'fulfilled'
        ? { score: bugsSettled.value.score, rating: ratingFromScore(bugsSettled.value.score), data: bugsSettled.value.data }
        : errResult(bugsSettled.reason?.message ?? 'Bug analysis failed');

    const trafficResult: SectionResult =
      trafficSettled.status === 'fulfilled'
        ? { score: trafficSettled.value.score, rating: ratingFromScore(trafficSettled.value.score), data: trafficSettled.value.data }
        : errResult(trafficSettled.reason?.message ?? 'Traffic analysis failed');

    const browserResult: SectionResult =
      browserSettled.status === 'fulfilled'
        ? { score: browserSettled.value.score, rating: ratingFromScore(browserSettled.value.score), data: browserSettled.value.data }
        : errResult(browserSettled.reason?.message ?? 'Browser analysis failed');

    const report: AuditReport = {
      url,
      domain: extractDomain(url),
      auditedAt: new Date().toISOString(),
      overallScore: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      performance: perfResult as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seo: seoResult as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ux: uxResult as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bugs: bugsResult as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      browser: browserResult as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      traffic: trafficResult as any,
    };

    report.overallScore = calculateOverallScore(report);

    return NextResponse.json(
      { success: true, report },
      {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Audit failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
