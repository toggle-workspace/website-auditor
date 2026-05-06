import { AuditReport } from '@/lib/types';
import ScoreGauge from './ScoreGauge';

interface Props {
  report: AuditReport;
}

const sections = [
  { key: 'performance', label: 'Performance' },
  { key: 'seo', label: 'SEO' },
  { key: 'ux', label: 'UX' },
  { key: 'bugs', label: 'Bugs' },
  { key: 'traffic', label: 'Traffic' },
] as const;

export default function ScoreGaugeGrid({ report }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-slate-500 text-xs uppercase tracking-wider mb-6">Section Scores</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {sections.map(({ key, label }) => {
          const section = report[key];
          return (
            <ScoreGauge
              key={key}
              score={section.score}
              rating={section.rating}
              label={label}
              size={110}
            />
          );
        })}
      </div>
    </div>
  );
}
