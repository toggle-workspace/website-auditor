'use client';

import { useState } from 'react';
import { SectionResult, PerformanceData } from '@/lib/types';
import { ratingBadgeClass, ratingLabel, ratingColor } from '@/lib/utils/score';
import { Zap, Monitor, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: SectionResult<PerformanceData>;
}

export default function PerformanceSection({ data }: Props) {
  const [tab, setTab] = useState<'mobile' | 'desktop'>('mobile');

  if (data.error) {
    return <SectionError title="Performance" error={data.error} />;
  }

  const perf = data.data;
  const active = tab === 'mobile' ? perf.mobile : perf.desktop;

  const chartData = active.coreWebVitals.map(v => ({
    name: v.label,
    score: v.score ?? 0,
    rating: v.rating,
    displayValue: v.displayValue,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold">Performance</h2>
            <p className="text-slate-500 text-xs">Lighthouse scores &amp; Core Web Vitals</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${ratingBadgeClass(data.rating)}`}>
          {data.score != null ? `${data.score}/100` : '—'} · {ratingLabel(data.rating)}
        </span>
      </div>

      <div className="p-6">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {(['mobile', 'desktop'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Performance', value: active.performanceScore },
            { label: 'Accessibility', value: active.accessibilityScore },
            { label: 'Best Practices', value: active.bestPracticesScore },
            { label: 'SEO', value: active.seoScore },
          ].map(({ label, value }) => {
            const r = value == null ? 'unknown' : value >= 90 ? 'good' : value >= 50 ? 'needs-improvement' : 'poor';
            return (
              <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-slate-50 mb-1">{value ?? '—'}</div>
                <div className="text-slate-500 text-xs">{label}</div>
                <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full border inline-block ${ratingBadgeClass(r)}`}>
                  {ratingLabel(r)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Web Vitals chart */}
        {chartData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Core Web Vitals</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any, _: any, props: any) => [
                    `${val} (${props.payload.displayValue})`,
                    'Score',
                  ]}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={ratingColor(entry.rating)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Opportunities */}
        {active.opportunities.length > 0 && (
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3">Top Opportunities</h3>
            <div className="space-y-2">
              {active.opportunities.map(opp => (
                <div key={opp.id} className="bg-slate-800 rounded-lg px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-200 text-sm font-medium">{opp.title}</span>
                    {opp.displayValue && (
                      <span className="text-amber-400 text-xs shrink-0">{opp.displayValue}</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{opp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionError({ title, error }: { title: string; error: string }) {
  const isQuotaError = error.toLowerCase().includes('quota') || error.toLowerCase().includes('429');
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <h2 className="text-slate-100 font-semibold">{title}</h2>
      </div>
      <div className="p-6">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        {isQuotaError && (
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-indigo-300 text-xs">
              <strong>Fix:</strong> Get a free Google PageSpeed Insights API key from{' '}
              <span className="underline">console.cloud.google.com</span> and add it to{' '}
              <code className="bg-indigo-900/40 px-1 rounded">.env.local</code> as{' '}
              <code className="bg-indigo-900/40 px-1 rounded">PAGESPEED_API_KEY=your_key</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
