import { SectionResult, BrowserData } from '@/lib/types';
import { ratingBadgeClass, ratingLabel } from '@/lib/utils/score';
import { Monitor, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  data: SectionResult<BrowserData>;
}

function truncateUrl(url: string, max = 60): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + '…';
}

function ExpandableList({
  title,
  count,
  colorClass,
  children,
}: {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details className="group">
      <summary className={`flex items-center gap-2 cursor-pointer list-none select-none text-sm font-medium ${colorClass} mb-2`}>
        <ChevronRight className="w-4 h-4 group-open:hidden shrink-0" />
        <ChevronDown className="w-4 h-4 hidden group-open:block shrink-0" />
        {title} <span className="text-slate-500 font-normal">({count})</span>
      </summary>
      <div className="mt-2 space-y-1.5 pb-2">{children}</div>
    </details>
  );
}

export default function BrowserSection({ data }: Props) {
  if (data.error && !data.data?.checks) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-100 font-semibold mb-2">Browser Errors</h2>
        <p className="text-red-400 text-sm">{data.error}</p>
      </div>
    );
  }

  const browser = data.data as BrowserData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">Browser Errors</h2>
            <p className="text-slate-500 text-xs">Console errors, JS exceptions &amp; network failures</p>
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
            { label: 'JS Errors', value: browser.jsErrorCount, bad: browser.jsErrorCount > 0 },
            { label: 'Console Errors', value: browser.consoleErrorCount, bad: browser.consoleErrorCount > 0 },
            { label: 'Warnings', value: browser.consoleWarningCount, bad: browser.consoleWarningCount > 0 },
            { label: 'Network Failures', value: browser.networkErrorCount, bad: browser.networkErrorCount > 0 },
          ].map(({ label, value, bad }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${bad ? 'text-red-400' : 'text-green-400'}`}>{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Check list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {browser.checks?.map(check => (
            <div key={check.id} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
              {check.status === 'pass'
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-px" />
                : check.status === 'warning'
                ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-px" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
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

        {/* Expandable detail lists */}
        <div className="space-y-4">
          <ExpandableList title="JavaScript Errors" count={browser.jsErrors?.length ?? 0} colorClass="text-red-400">
            {browser.jsErrors?.map((err, i) => (
              <div key={i} className="bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-red-300 text-sm font-mono">{err.message}</p>
                {err.stack && (
                  <pre className="text-slate-500 text-xs mt-1.5 overflow-x-auto whitespace-pre-wrap break-all">
                    {err.stack.split('\n').slice(1, 4).join('\n')}
                  </pre>
                )}
              </div>
            ))}
          </ExpandableList>

          <ExpandableList title="Console Errors" count={browser.consoleMessages?.filter(m => m.type === 'error').length ?? 0} colorClass="text-red-400">
            {browser.consoleMessages?.filter(m => m.type === 'error').map((msg, i) => (
              <div key={i} className="bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-red-300 text-sm font-mono break-all">{msg.text}</p>
                {msg.url && (
                  <p className="text-slate-500 text-xs mt-1">
                    {truncateUrl(msg.url)}{msg.line != null ? `:${msg.line}` : ''}
                  </p>
                )}
              </div>
            ))}
          </ExpandableList>

          <ExpandableList title="Console Warnings" count={browser.consoleMessages?.filter(m => m.type === 'warning').length ?? 0} colorClass="text-amber-400">
            {browser.consoleMessages?.filter(m => m.type === 'warning').map((msg, i) => (
              <div key={i} className="bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-amber-300 text-sm font-mono break-all">{msg.text}</p>
                {msg.url && (
                  <p className="text-slate-500 text-xs mt-1">
                    {truncateUrl(msg.url)}{msg.line != null ? `:${msg.line}` : ''}
                  </p>
                )}
              </div>
            ))}
          </ExpandableList>

          <ExpandableList title="Network Failures" count={browser.networkErrors?.length ?? 0} colorClass="text-orange-400">
            {browser.networkErrors?.map((err, i) => (
              <div key={i} className="bg-slate-800 rounded-lg px-4 py-3 flex items-start gap-3">
                <span className="text-slate-500 text-xs bg-slate-700 rounded px-1.5 py-0.5 font-mono shrink-0 mt-px">
                  {err.resourceType}
                </span>
                <div className="min-w-0">
                  <p className="text-orange-300 text-sm font-mono break-all">{truncateUrl(err.url, 80)}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{err.errorText}</p>
                </div>
              </div>
            ))}
          </ExpandableList>
        </div>

        {browser.jsErrorCount === 0 && browser.consoleErrorCount === 0 && browser.networkErrorCount === 0 && browser.consoleWarningCount === 0 && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            No browser errors detected on page load
          </div>
        )}
      </div>
    </div>
  );
}
