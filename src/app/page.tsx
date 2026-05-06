import UrlInputForm from '@/components/home/UrlInputForm';
import { Search, BarChart3, Bug, Zap, TrendingUp } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Performance', description: 'Lighthouse scores, Core Web Vitals, and optimization opportunities.' },
  { icon: Search, title: 'SEO Analysis', description: 'Meta tags, headings, structured data, robots.txt, and sitemap checks.' },
  { icon: BarChart3, title: 'UX Improvements', description: 'Mobile-friendliness, accessibility, and usability recommendations.' },
  { icon: Bug, title: 'Bug Detection', description: 'Broken links, missing alt text, mixed content, and more.' },
  { icon: TrendingUp, title: 'Traffic Potential', description: 'Domain authority, SEO health, and ranking factor assessment.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            100% Free — No sign-up required
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-50 mb-4 tracking-tight">
            Website Auditor
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl mb-12 max-w-xl mx-auto">
            Enter any URL to get a comprehensive report on performance, SEO, UX, bugs, and traffic potential.
          </p>

          <UrlInputForm />
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <p className="text-center text-slate-500 text-sm uppercase tracking-wider mb-8">What we analyze</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
              <p className="text-slate-500 text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
