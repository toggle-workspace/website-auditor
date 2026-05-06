import { TrafficData, ScoreRating, PerformanceData } from '@/lib/types';
import { extractDomain } from '@/lib/utils/url';
import { ratingFromScore } from '@/lib/utils/score';

interface OpenPageRankResponse {
  response: Array<{
    page_rank_decimal: number | null;
    rank: string | null;
    status_code: number;
    error?: string;
  }>;
}

export async function analyzeTraffic(
  url: string,
  perfData: PerformanceData,
  seoScore: number | null
): Promise<{ data: TrafficData; score: number }> {
  const domain = extractDomain(url);
  let domainAuthority: number | null = null;
  let pageRankAvailable = false;

  const apiKey = process.env.OPEN_PAGERANK_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(domain)}`,
        {
          headers: { 'API-OPR': apiKey },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as OpenPageRankResponse;
        const item = data.response?.[0];
        if (item?.status_code === 200 && item.page_rank_decimal != null) {
          domainAuthority = item.page_rank_decimal;
          pageRankAvailable = true;
        }
      }
    } catch {
      // API unavailable
    }
  }

  // Core Web Vitals SEO signal
  const cwv = perfData.mobile.coreWebVitals;
  const lcpAudit = cwv.find(v => v.id === 'largest-contentful-paint');
  const clsAudit = cwv.find(v => v.id === 'cumulative-layout-shift');
  const tbtAudit = cwv.find(v => v.id === 'total-blocking-time');

  const cwvScores = [lcpAudit?.score, clsAudit?.score, tbtAudit?.score].filter((s): s is number => s != null);
  const cwvAvg = cwvScores.length > 0 ? cwvScores.reduce((a, b) => a + b, 0) / cwvScores.length : null;
  const coreWebVitalsRating: ScoreRating = ratingFromScore(cwvAvg);

  const mobileScore = perfData.mobile.performanceScore;
  const mobileReadiness: ScoreRating = ratingFromScore(mobileScore);

  // Traffic potential score (0-100)
  // DA: 40%, CWV: 30%, mobile: 15%, SEO: 15%
  const daScore = pageRankAvailable && domainAuthority != null ? (domainAuthority / 10) * 100 : null;
  const cwvScore = cwvAvg;
  const mobileWeighted = mobileScore;
  const seoWeighted = seoScore;

  const components: [number | null, number][] = [
    [daScore, 0.4],
    [cwvScore, 0.3],
    [mobileWeighted, 0.15],
    [seoWeighted, 0.15],
  ];

  const available = components.filter(([s]) => s != null) as [number, number][];
  let trafficScore: number | null = null;
  if (available.length > 0) {
    const totalWeight = available.reduce((acc, [, w]) => acc + w, 0);
    const weightedSum = available.reduce((acc, [s, w]) => acc + s * w, 0);
    trafficScore = Math.round(weightedSum / totalWeight);
  }

  const overallTrafficPotential: ScoreRating = ratingFromScore(trafficScore);

  // Recommendations
  const recommendations: string[] = [];
  if (!pageRankAvailable) {
    recommendations.push('Add your Open PageRank API key for domain authority data (free at openpagerank.com).');
  }
  if (coreWebVitalsRating === 'poor' || coreWebVitalsRating === 'needs-improvement') {
    recommendations.push('Improve Core Web Vitals — Google uses them as ranking signals. Focus on LCP, CLS, and TBT.');
  }
  if (mobileReadiness === 'poor' || mobileReadiness === 'needs-improvement') {
    recommendations.push('Improve mobile performance — over 60% of web traffic is mobile.');
  }
  if ((seoScore ?? 0) < 70) {
    recommendations.push('Fix SEO issues to increase organic search visibility and traffic.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Great traffic potential! Continue monitoring Core Web Vitals and SEO health.');
  }

  return {
    score: trafficScore ?? 50,
    data: {
      domain,
      domainAuthority,
      pageRankAvailable,
      coreWebVitalsRating,
      mobileReadiness,
      overallTrafficPotential,
      seoImpactScore: seoScore,
      recommendations,
    },
  };
}
