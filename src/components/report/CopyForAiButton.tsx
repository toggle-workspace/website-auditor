'use client';

import { useState } from 'react';
import { Check, Bot } from 'lucide-react';
import { AuditReport, SectionResult } from '@/lib/types';

function rating(r: string): string {
  switch (r) {
    case 'good': return 'Good';
    case 'needs-improvement': return 'Needs Work';
    case 'poor': return 'Poor';
    default: return 'Unknown';
  }
}

function sectionHeader(name: string, result: SectionResult): string {
  const score = result.score != null ? `${result.score}/100` : 'N/A';
  return `--- ${name.toUpperCase()} (${score} · ${rating(result.rating)}) ---`;
}

function buildPrompt(report: AuditReport): string {
  const lines: string[] = [];

  lines.push(`I ran a website audit for: ${report.url}`);
  lines.push(`Overall Score: ${report.overallScore ?? 'N/A'}/100`);
  lines.push(`Audited at: ${new Date(report.auditedAt).toLocaleString()}`);
  lines.push('');
  lines.push('Can you explain what these issues mean in plain terms and tell me which ones to prioritize fixing?\n');

  // Performance
  lines.push(sectionHeader('Performance', report.performance));
  if (report.performance.error) {
    lines.push(`Error: ${report.performance.error}`);
  } else {
    const p = report.performance.data;
    lines.push(`Mobile Performance: ${p.mobile.performanceScore ?? 'N/A'}/100`);
    lines.push(`Desktop Performance: ${p.desktop.performanceScore ?? 'N/A'}/100`);
    lines.push(`Accessibility: ${p.mobile.accessibilityScore ?? 'N/A'}/100`);
    if (p.mobile.coreWebVitals?.length) {
      lines.push('Core Web Vitals (mobile):');
      p.mobile.coreWebVitals.forEach(v => lines.push(`  - ${v.label}: ${v.displayValue} (${v.rating})`));
    }
    const failedOpps = p.mobile.opportunities?.filter(o => (o.score ?? 1) < 0.9);
    if (failedOpps?.length) {
      lines.push('Top opportunities:');
      failedOpps.slice(0, 5).forEach(o => lines.push(`  - ${o.title}${o.displayValue ? ` (${o.displayValue})` : ''}`));
    }
  }
  lines.push('');

  // SEO
  lines.push(sectionHeader('SEO', report.seo));
  if (report.seo.error) {
    lines.push(`Error: ${report.seo.error}`);
  } else {
    const s = report.seo.data;
    lines.push(`Title: ${s.title ?? 'Missing'} (${s.titleLength} chars)`);
    lines.push(`Meta Description: ${s.metaDescription ?? 'Missing'}`);
    lines.push(`H1 Tags: ${s.h1Tags?.join(', ') || 'None'}`);
    lines.push(`Canonical URL: ${s.canonicalUrl ?? 'Not set'}`);
    lines.push(`Robots.txt: ${s.hasRobotsTxt ? 'Present' : 'Missing'} | Sitemap: ${s.hasSitemap ? `Present (${s.sitemapPageCount} pages)` : 'Missing'}`);
    const failed = s.checks?.filter(c => c.status !== 'pass');
    if (failed?.length) {
      lines.push('Issues:');
      failed.forEach(c => lines.push(`  ✗ ${c.label}${c.recommendation ? ` — ${c.recommendation}` : ''}`));
    }
  }
  lines.push('');

  // UX
  lines.push(sectionHeader('UX', report.ux));
  if (report.ux.error) {
    lines.push(`Error: ${report.ux.error}`);
  } else {
    const u = report.ux.data;
    lines.push(`Mobile Readiness Score: ${u.mobileScore ?? 'N/A'}/100`);
    lines.push(`Accessibility Score: ${u.accessibilityScore ?? 'N/A'}/100`);
    lines.push(`Contrast issues: ${u.contrastIssues} | Tap target issues: ${u.tapTargetIssues} | Font size issues: ${u.fontSizeIssues}`);
    const failed = u.checks?.filter(c => c.status !== 'pass');
    if (failed?.length) {
      lines.push('Issues:');
      failed.forEach(c => lines.push(`  ✗ ${c.label}${c.detail ? ` — ${c.detail}` : ''}`));
    }
  }
  lines.push('');

  // Bugs
  lines.push(sectionHeader('Bug Detection', report.bugs));
  if (report.bugs.error) {
    lines.push(`Error: ${report.bugs.error}`);
  } else {
    const b = report.bugs.data;
    lines.push(`Broken links: ${b.brokenLinkCount} (of ${b.linksChecked} checked)`);
    lines.push(`Images missing alt text: ${b.missingAltImages?.length ?? 0}`);
    lines.push(`H1 tags: ${b.h1Count} | HTTPS: ${b.hasMixedContent ? 'Mixed content detected' : 'Clean'}`);
    const failed = b.checks?.filter(c => c.status !== 'pass');
    if (failed?.length) {
      lines.push('Issues:');
      failed.forEach(c => lines.push(`  ✗ ${c.label}${c.detail ? ` — ${c.detail}` : ''}`));
    }
  }
  lines.push('');

  // Browser Errors
  lines.push(sectionHeader('Browser Errors', report.browser));
  if (report.browser.error) {
    lines.push(`Error: ${report.browser.error}`);
  } else {
    const br = report.browser.data;
    lines.push(`JavaScript errors: ${br.jsErrorCount}`);
    lines.push(`Console errors: ${br.consoleErrorCount} | Warnings: ${br.consoleWarningCount}`);
    lines.push(`Network failures: ${br.networkErrorCount}`);
    lines.push(`Horizontal overflow: ${br.hasHorizontalScroll ? 'Yes' : 'No'}`);
    if (br.jsErrors?.length) {
      lines.push('JS Errors:');
      br.jsErrors.slice(0, 3).forEach(e => lines.push(`  - ${e.message}`));
    }
    if (br.consoleMessages?.filter(m => m.type === 'error').length) {
      lines.push('Console Errors:');
      br.consoleMessages.filter(m => m.type === 'error').slice(0, 3).forEach(m => lines.push(`  - ${m.text}`));
    }
    if (br.networkErrors?.length) {
      lines.push('Network Failures:');
      br.networkErrors.slice(0, 3).forEach(e => lines.push(`  - ${e.resourceType}: ${e.url} (${e.errorText})`));
    }
  }
  lines.push('');

  // Traffic
  lines.push(sectionHeader('Traffic', report.traffic));
  if (report.traffic.error) {
    lines.push(`Error: ${report.traffic.error}`);
  } else {
    const t = report.traffic.data;
    lines.push(`Domain Authority: ${t.domainAuthority ?? 'N/A'}`);
    lines.push(`Overall Traffic Potential: ${t.overallTrafficPotential}`);
    if (t.recommendations?.length) {
      lines.push('Recommendations:');
      t.recommendations.forEach(r => lines.push(`  - ${r}`));
    }
  }

  return lines.join('\n');
}

interface Props {
  report: AuditReport;
}

export default function CopyForAiButton({ report }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API unavailable — silent fail
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-slate-100 text-sm transition-all"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Copied to clipboard!</span>
        </>
      ) : (
        <>
          <Bot className="w-4 h-4 text-indigo-400" />
          Ask AI to explain this report
        </>
      )}
    </button>
  );
}
