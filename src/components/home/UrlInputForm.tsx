'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, AlertCircle } from 'lucide-react';

export default function UrlInputForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function validate(value: string): string {
    if (!value.trim()) return 'Please enter a URL.';
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(withProtocol);
      return '';
    } catch {
      return 'Please enter a valid URL (e.g. example.com).';
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(url);
    if (err) { setError(err); return; }
    setError('');
    router.push(`/report?url=${encodeURIComponent(url.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
        <Search className="w-5 h-5 text-slate-500 shrink-0" />
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); if (error) setError(''); }}
          placeholder="Enter website URL (e.g. example.com)"
          className="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500 text-base"
          autoFocus
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors shrink-0"
        >
          Audit
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      <p className="text-slate-600 text-xs mt-3 text-center">
        Audits typically take 15–30 seconds
      </p>
    </form>
  );
}
