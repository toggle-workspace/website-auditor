import { Suspense } from 'react';
import ReportClient from '@/components/report/ReportClient';

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url = '' } = await searchParams;
  return (
    <Suspense>
      <ReportClient rawUrl={url} />
    </Suspense>
  );
}
