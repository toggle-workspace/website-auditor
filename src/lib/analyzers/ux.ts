import type { CheerioAPI } from 'cheerio';
import { UxData, UxCheckItem, PerformanceData } from '@/lib/types';

export function analyzeUx($: CheerioAPI, perfData: PerformanceData): { data: UxData; score: number } {

  const mobileScore = perfData.mobile.performanceScore;
  const accessibilityScore = perfData.mobile.accessibilityScore;

  // Derive counts from PageSpeed opportunities/diagnostics
  const allAudits = [
    ...perfData.mobile.opportunities,
    ...perfData.mobile.diagnostics,
  ];

  const contrastIssues = allAudits.filter(a => a.id === 'color-contrast' && (a.score ?? 100) < 90).length > 0 ? 1 : 0;
  const tapTargetIssues = allAudits.filter(a => a.id === 'tap-targets' && (a.score ?? 100) < 90).length > 0 ? 1 : 0;
  const fontSizeIssues = allAudits.filter(a => a.id === 'font-size' && (a.score ?? 100) < 90).length > 0 ? 1 : 0;
  const imageAltIssues = allAudits.filter(a => a.id === 'image-alt' && (a.score ?? 100) < 90).length > 0 ? 1 : 0;

  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const isResponsive = hasViewport && viewport.includes('width=device-width');
  const blockingUserScale = viewport.includes('user-scalable=no') || viewport.includes('maximum-scale=1');

  const checks: UxCheckItem[] = [];

  function uxCheck(
    id: string,
    category: UxCheckItem['category'],
    label: string,
    pass: boolean,
    detail?: string,
    warning = false
  ) {
    checks.push({ id, category, label, status: pass ? 'pass' : warning ? 'warning' : 'fail', detail });
  }

  uxCheck('viewport', 'mobile', 'Viewport meta tag present', hasViewport, hasViewport ? undefined : 'Missing viewport meta tag');
  uxCheck('responsive', 'mobile', 'Responsive viewport configured', isResponsive, isResponsive ? undefined : 'Add width=device-width to viewport');
  uxCheck('user-scale', 'accessibility', 'User zoom not disabled', !blockingUserScale, blockingUserScale ? 'Remove user-scalable=no' : undefined);
  uxCheck('mobile-perf', 'mobile', 'Mobile performance score ≥ 50', (mobileScore ?? 0) >= 50, `Mobile score: ${mobileScore ?? 'N/A'}`, (mobileScore ?? 0) < 50);
  uxCheck('accessibility', 'accessibility', 'Accessibility score ≥ 90', (accessibilityScore ?? 0) >= 90, `Accessibility score: ${accessibilityScore ?? 'N/A'}`, (accessibilityScore ?? 0) < 90);
  uxCheck('contrast', 'accessibility', 'Sufficient color contrast', contrastIssues === 0, contrastIssues > 0 ? 'Color contrast issues detected' : undefined);
  uxCheck('tap-targets', 'mobile', 'Tap target sizes adequate', tapTargetIssues === 0, tapTargetIssues > 0 ? 'Some tap targets are too small' : undefined);
  uxCheck('font-size', 'content', 'Font sizes legible on mobile', fontSizeIssues === 0, fontSizeIssues > 0 ? 'Some text is too small to read on mobile' : undefined);
  uxCheck('image-alt', 'accessibility', 'Images have alt text', imageAltIssues === 0, imageAltIssues > 0 ? 'Some images are missing alt text' : undefined);
  uxCheck('headings', 'content', 'Heading hierarchy present', $('h1').length > 0 && $('h2').length > 0, $('h1').length === 0 ? 'No H1 found' : $('h2').length === 0 ? 'No H2 found' : undefined, true);

  const hasLang = $('html').attr('lang') != null;
  uxCheck('lang', 'accessibility', 'HTML lang attribute set', hasLang, hasLang ? undefined : 'Add lang attribute to <html> for screen readers');

  const passCount = checks.filter(c => c.status === 'pass').length;
  const checkRate = checks.length > 0 ? (passCount / checks.length) * 100 : 100;

  // UX score: 40% accessibility + 30% mobile perf + 30% check pass rate
  const accWeight = (accessibilityScore ?? 0) * 0.4;
  const mobileWeight = (mobileScore ?? 0) * 0.3;
  const checkWeight = checkRate * 0.3;
  const score = Math.round(accWeight + mobileWeight + checkWeight);

  return {
    score,
    data: {
      mobileScore,
      accessibilityScore,
      hasViewport,
      isResponsive,
      contrastIssues,
      tapTargetIssues,
      fontSizeIssues,
      imageAltIssues,
      checks,
    },
  };
}
