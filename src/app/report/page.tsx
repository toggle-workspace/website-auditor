import { Suspense } from 'react';
import ReportClient from '@/components/report/ReportClient';

export default function ReportPage({ searchParams }: { searchParams: { url?: string } }) {
  const url = searchParams.url ?? '';
  return (
    <Suspense>
      <ReportClient rawUrl={url} />
    </Suspense>
  );
}
