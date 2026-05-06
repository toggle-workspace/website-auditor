import { SectionResult, UxData, UxCheckItem } from '@/lib/types';
import { ratingBadgeClass, ratingLabel } from '@/lib/utils/score';
import { BarChart3, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  data: SectionResult<UxData>;
}

const CATEGORY_LABELS: Record<UxCheckItem['category'], string> = {
  mobile: 'Mobile',
  accessibility: 'Accessibility',
  performance: 'Performance',
  content: 'Content',
};

function StatusIcon({ status }: { status: UxCheckItem['status'] }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
  if (status === 'warning') return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
}

export default function UxSection({ data }: Props) {
  if (data.error && !data.data?.checks) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-100 font-semibold mb-2">UX Improvements</h2>
        <p className="text-red-400 text-sm">{data.error}</p>
      </div>
    );
  }

  const ux = data.data as UxData;
  const categories = Array.from(new Set(ux.checks?.map(c => c.category))) as UxCheckItem['category'][];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">UX Improvements</h2>
            <p className="text-slate-500 text-xs">Mobile, accessibility &amp; usability</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${ratingBadgeClass(data.rating)}`}>
          {data.score != null ? `${data.score}/100` : '—'} · {ratingLabel(data.rating)}
        </span>
      </div>

      <div className="p-6">
        {/* Score summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Mobile Score', value: ux.mobileScore },
            { label: 'Accessibility', value: ux.accessibilityScore },
            { label: 'Contrast Issues', value: ux.contrastIssues, invert: true },
            { label: 'Tap Target Issues', value: ux.tapTargetIssues, invert: true },
          ].map(({ label, value, invert }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-slate-50">{value ?? '—'}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
              {invert !== undefined && value != null && (
                <div className={`text-xs mt-1 ${(value as number) === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(value as number) === 0 ? 'None found' : `${value} found`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checks by category */}
        <div className="space-y-4">
          {categories.map(cat => {
            const catChecks = ux.checks?.filter(c => c.category === cat) ?? [];
            return (
              <div key={cat}>
                <h3 className="text-slate-500 text-xs uppercase tracking-wider mb-2">
                  {CATEGORY_LABELS[cat as UxCheckItem['category']]}
                </h3>
                <div className="space-y-1">
                  {catChecks.map(check => (
                    <div key={check.id} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
                      <StatusIcon status={check.status} />
                      <div>
                        <p className="text-slate-200 text-sm">{check.label}</p>
                        {check.status !== 'pass' && check.detail && (
                          <p className="text-amber-400 text-xs mt-0.5">{check.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
