import { SectionResult, TrafficData } from '@/lib/types';
import { ratingBadgeClass, ratingLabel, ratingColor } from '@/lib/utils/score';
import { TrendingUp, Info } from 'lucide-react';

interface Props {
  data: SectionResult<TrafficData>;
}

export default function TrafficSection({ data }: Props) {
  if (data.error && !data.data?.domain) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-100 font-semibold mb-2">Traffic Potential</h2>
        <p className="text-red-400 text-sm">{data.error}</p>
      </div>
    );
  }

  const traffic = data.data as TrafficData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">Traffic Potential</h2>
            <p className="text-slate-500 text-xs">Organic reach &amp; ranking factors</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${ratingBadgeClass(data.rating)}`}>
          {data.score != null ? `${data.score}/100` : '—'} · {ratingLabel(data.rating)}
        </span>
      </div>

      <div className="p-6">
        {/* Domain authority */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            {traffic.pageRankAvailable ? (
              <>
                <div className="text-3xl font-bold text-slate-50">{traffic.domainAuthority?.toFixed(1) ?? '—'}</div>
                <div className="text-slate-500 text-xs mt-1">Domain Authority</div>
                <div className="text-slate-600 text-xs mt-0.5">out of 10</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-slate-600">—</div>
                <div className="text-slate-500 text-xs mt-1">Domain Authority</div>
                <div className="text-slate-600 text-xs mt-0.5">API key needed</div>
              </>
            )}
          </div>

          {[
            { label: 'Core Web Vitals', rating: traffic.coreWebVitalsRating },
            { label: 'Mobile Readiness', rating: traffic.mobileReadiness },
            { label: 'Traffic Potential', rating: traffic.overallTrafficPotential },
          ].map(({ label, rating }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: ratingColor(rating) }}
              >
                {ratingLabel(rating)}
              </div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* SEO impact score */}
        {traffic.seoImpactScore != null && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">SEO Impact Score</span>
              <span className="text-slate-200 font-semibold">{traffic.seoImpactScore}/100</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${traffic.seoImpactScore}%`,
                  background: ratingColor(
                    traffic.seoImpactScore >= 90 ? 'good' : traffic.seoImpactScore >= 50 ? 'needs-improvement' : 'poor'
                  ),
                }}
              />
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-3">Recommendations</h3>
          <div className="space-y-2">
            {traffic.recommendations?.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {!traffic.pageRankAvailable && (
          <div className="mt-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-indigo-300 text-xs">
              <strong>Tip:</strong> Add a free Open PageRank API key to{' '}
              <code className="bg-indigo-900/40 px-1 rounded">.env.local</code> to unlock domain authority scores.
              Get a free key at{' '}
              <span className="underline">openpagerank.com</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
