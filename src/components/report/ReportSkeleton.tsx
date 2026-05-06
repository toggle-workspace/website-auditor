interface Props {
  url: string;
  progress: number;
}

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

export default function ReportSkeleton({ url, progress }: Props) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-slate-500 text-sm mb-2">
            <span>Auditing {url}...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Pulse className="h-8 w-3/4 mb-2" />
        <Pulse className="h-4 w-1/2 mb-8" />

        {/* Score gauges skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <Pulse className="h-4 w-24 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Pulse className="w-24 h-16 rounded-full" />
                <Pulse className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Section skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
            <Pulse className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <Pulse key={j} className="h-10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
