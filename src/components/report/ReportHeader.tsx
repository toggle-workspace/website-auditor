import { AuditReport } from '@/lib/types';
import { ratingBadgeClass, ratingLabel } from '@/lib/utils/score';
import { Globe, Clock } from 'lucide-react';

interface Props {
  report: AuditReport;
}

export default function ReportHeader({ report }: Props) {
  const overallRating = report.overallScore != null
    ? report.overallScore >= 90 ? 'good' : report.overallScore >= 50 ? 'needs-improvement' : 'poor'
    : 'unknown';

  const date = new Date(report.auditedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Globe className="w-4 h-4" />
            <span className="font-mono">{report.domain}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 break-all">{report.url}</h1>
          <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>Audited {date}</span>
          </div>
        </div>

        {report.overallScore != null && (
          <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4">
            <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Overall Score</span>
            <span className="text-5xl font-bold text-slate-50">{report.overallScore}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border mt-2 ${ratingBadgeClass(overallRating)}`}>
              {ratingLabel(overallRating)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
