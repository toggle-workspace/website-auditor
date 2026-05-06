'use client';

import { useEffect, useState } from 'react';
import { AuditReport } from '@/lib/types';
import ReportHeader from './ReportHeader';
import ScoreGaugeGrid from './ScoreGaugeGrid';
import ReportSkeleton from './ReportSkeleton';
import PerformanceSection from './sections/PerformanceSection';
import SeoSection from './sections/SeoSection';
import UxSection from './sections/UxSection';
import BugSection from './sections/BugSection';
import TrafficSection from './sections/TrafficSection';
import PdfExportButton from '../pdf/PdfExportButton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  rawUrl: string;
}

export default function ReportClient({ rawUrl }: Props) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!rawUrl) { setError('No URL provided.'); setLoading(false); return; }

    // Fake progress bar
    const interval = setInterval(() => {
      setProgress(p => (p < 85 ? p + Math.random() * 3 : p));
    }, 400);

    fetch(`/api/audit?url=${encodeURIComponent(rawUrl)}`)
      .then(res => res.json())
      .then(data => {
        clearInterval(interval);
        setProgress(100);
        if (data.success && data.report) {
          setReport(data.report);
        } else {
          setError(data.error ?? 'Audit failed. Please try again.');
        }
      })
      .catch(() => {
        clearInterval(interval);
        setError('Network error. Please try again.');
      })
      .finally(() => setLoading(false));

    return () => clearInterval(interval);
  }, [rawUrl]);

  if (loading) return <ReportSkeleton url={rawUrl} progress={progress} />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Audit Failed</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Try another URL
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ReportHeader report={report} />

        <div className="mb-8">
          <ScoreGaugeGrid report={report} />
        </div>

        <div className="flex justify-end mb-6">
          <PdfExportButton report={report} />
        </div>

        <div className="space-y-6">
          <PerformanceSection data={report.performance} />
          <SeoSection data={report.seo} />
          <UxSection data={report.ux} />
          <BugSection data={report.bugs} />
          <TrafficSection data={report.traffic} />
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Audit another URL
          </Link>
          <p className="text-slate-600 text-xs">All data powered by free public APIs</p>
        </div>
      </div>
    </div>
  );
}
