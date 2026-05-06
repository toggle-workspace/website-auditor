import { SectionResult, BugData } from '@/lib/types';
import { ratingBadgeClass, ratingLabel } from '@/lib/utils/score';
import { Bug, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Props {
  data: SectionResult<BugData>;
}

export default function BugSection({ data }: Props) {
  if (data.error && !data.data?.checks) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-100 font-semibold mb-2">Bug Detection</h2>
        <p className="text-red-400 text-sm">{data.error}</p>
      </div>
    );
  }

  const bugs = data.data as BugData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Bug className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">Bug Detection</h2>
            <p className="text-slate-500 text-xs">Broken links, missing assets &amp; issues</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${ratingBadgeClass(data.rating)}`}>
          {data.score != null ? `${data.score}/100` : '—'} · {ratingLabel(data.rating)}
        </span>
      </div>

      <div className="p-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Broken Links', value: bugs.brokenLinkCount, bad: bugs.brokenLinkCount > 0 },
            { label: 'Links Checked', value: bugs.linksChecked, bad: false },
            { label: 'Missing Alt Text', value: bugs.missingAltImages?.length ?? 0, bad: (bugs.missingAltImages?.length ?? 0) > 0 },
            { label: 'H1 Tags', value: bugs.h1Count, bad: bugs.h1Count !== 1 },
          ].map(({ label, value, bad }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${bad ? 'text-red-400' : 'text-green-400'}`}>{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Check list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {bugs.checks?.map(check => (
            <div key={check.id} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
              {check.status === 'pass'
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : check.status === 'warning'
                ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              }
              <div>
                <p className="text-slate-200 text-sm">{check.label}</p>
                {check.status !== 'pass' && check.detail && (
                  <p className="text-amber-400 text-xs mt-0.5">{check.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Broken links table */}
        {bugs.brokenLinks?.length > 0 && (
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3">Broken Links</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-500 py-2 pr-4 font-medium">URL</th>
                    <th className="text-left text-slate-500 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bugs.brokenLinks.map((link, i) => (
                    <tr key={i} className="border-b border-slate-800 last:border-0">
                      <td className="py-2 pr-4 text-red-400 max-w-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{link.url}</span>
                        </div>
                      </td>
                      <td className="py-2 text-slate-400 whitespace-nowrap">
                        {link.status ?? link.failureReason ?? 'Failed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Missing alt images */}
        {bugs.missingAltImages?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Images Missing Alt Text</h3>
            <div className="space-y-1">
              {bugs.missingAltImages.slice(0, 10).map((img, i) => (
                <div key={i} className="bg-slate-800 rounded-lg px-4 py-2 text-slate-400 text-xs font-mono truncate">
                  {img.src}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
