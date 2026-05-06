import { ScoreRating, AuditReport } from '@/lib/types';

export function ratingFromScore(score: number | null): ScoreRating {
  if (score === null) return 'unknown';
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

export function ratingColor(rating: ScoreRating): string {
  switch (rating) {
    case 'good': return '#22c55e';
    case 'needs-improvement': return '#f59e0b';
    case 'poor': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function ratingBadgeClass(rating: ScoreRating): string {
  switch (rating) {
    case 'good': return 'bg-green-100 text-green-800 border-green-200';
    case 'needs-improvement': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'poor': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function ratingLabel(rating: ScoreRating): string {
  switch (rating) {
    case 'good': return 'Good';
    case 'needs-improvement': return 'Needs Work';
    case 'poor': return 'Poor';
    default: return 'Unknown';
  }
}

export function calculateOverallScore(report: Partial<AuditReport>): number | null {
  const weights: [number | null | undefined, number][] = [
    [report.performance?.score, 0.30],
    [report.seo?.score, 0.25],
    [report.ux?.score, 0.20],
    [report.bugs?.score, 0.15],
    [report.traffic?.score, 0.10],
  ];

  const available = weights.filter(([s]) => s != null) as [number, number][];
  if (available.length === 0) return null;

  const totalWeight = available.reduce((acc, [, w]) => acc + w, 0);
  const weightedSum = available.reduce((acc, [s, w]) => acc + s * w, 0);
  return Math.round(weightedSum / totalWeight);
}
