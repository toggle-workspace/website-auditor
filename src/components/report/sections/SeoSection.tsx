import { SectionResult, SeoData, SeoCheckItem } from '@/lib/types';
import { ratingBadgeClass, ratingLabel } from '@/lib/utils/score';
import { Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  data: SectionResult<SeoData>;
}

function StatusIcon({ status }: { status: SeoCheckItem['status'] }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
  if (status === 'warning') return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
}

export default function SeoSection({ data }: Props) {
  if (data.error && !data.data?.checks) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-100 font-semibold mb-2">SEO Analysis</h2>
        <p className="text-red-400 text-sm">{data.error}</p>
      </div>
    );
  }

  const seo = data.data as SeoData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">SEO Analysis</h2>
            <p className="text-slate-500 text-xs">On-page SEO health check</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${ratingBadgeClass(data.rating)}`}>
          {data.score != null ? `${data.score}/100` : '—'} · {ratingLabel(data.rating)}
        </span>
      </div>

      <div className="p-6">
        {/* Title & meta preview */}
        {(seo.title || seo.metaDescription) && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Google Preview</p>
            <p className="text-blue-400 text-base font-medium truncate">{seo.title ?? 'No title'}</p>
            <p className="text-green-600 text-xs mt-0.5">{seo.url}</p>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
              {seo.metaDescription ?? 'No meta description found.'}
            </p>
          </div>
        )}

        {/* Checks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {seo.checks?.map(check => (
            <div key={check.id} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
              <StatusIcon status={check.status} />
              <div className="min-w-0">
                <p className="text-slate-200 text-sm font-medium">{check.label}</p>
                {check.value && (
                  <p className="text-slate-500 text-xs truncate mt-0.5">{check.value}</p>
                )}
                {check.status !== 'pass' && check.recommendation && (
                  <p className="text-amber-400 text-xs mt-0.5">{check.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Heading structure */}
        {seo.h1Tags?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Heading Structure</h3>
            <div className="space-y-1">
              {seo.h1Tags.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-indigo-400 font-mono text-xs w-6">H1</span>
                  <span className="text-slate-300 truncate">{h}</span>
                </div>
              ))}
              {seo.h2Tags?.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm ml-4">
                  <span className="text-blue-400 font-mono text-xs w-6">H2</span>
                  <span className="text-slate-400 truncate">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
