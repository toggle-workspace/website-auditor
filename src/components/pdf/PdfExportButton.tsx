'use client';

import React, { useEffect, useState } from 'react';
import { AuditReport } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  report: AuditReport;
}

export default function PdfExportButton({ report }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [AuditPdfDoc, setAuditPdfDoc] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Both imports are client-only — dynamically loaded to avoid SSR crash
    Promise.all([
      import('@react-pdf/renderer'),
      import('./AuditPdfDocument'),
    ]).then(([pdfMod, docMod]) => {
      setPDFDownloadLink(() => pdfMod.PDFDownloadLink as React.ComponentType<unknown>);
      setAuditPdfDoc(() => docMod.default);
    }).catch(() => {
      // PDF unavailable in this environment
    });
  }, []);

  const fileName = `audit-${report.domain}-${new Date().toISOString().split('T')[0]}.pdf`;

  if (!PDFDownloadLink || !AuditPdfDoc) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-slate-800 text-slate-500 px-4 py-2 rounded-xl text-sm font-medium cursor-wait"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparing PDF...
      </button>
    );
  }

  const Link = PDFDownloadLink as React.ComponentType<{
    document: React.ReactElement;
    fileName: string;
    children: (props: { loading: boolean }) => React.ReactElement;
  }>;

  return (
    <Link
      document={<AuditPdfDoc report={report} />}
      fileName={fileName}
    >
      {({ loading }: { loading: boolean }) => (
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-4 h-4" /> Export as PDF</>
          )}
        </button>
      )}
    </Link>
  );
}
