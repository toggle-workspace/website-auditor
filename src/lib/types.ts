export type ScoreRating = 'good' | 'needs-improvement' | 'poor' | 'unknown';

export interface SectionResult<T = unknown> {
  score: number | null;
  rating: ScoreRating;
  data: T;
  error?: string;
}

// ─── Performance ──────────────────────────────────────────────────────────────

export interface CoreWebVital {
  id: string;
  label: string;
  displayValue: string;
  score: number | null;
  rating: ScoreRating;
}

export interface PageSpeedOpportunity {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score: number | null;
}

export interface PerformanceData {
  mobile: {
    performanceScore: number | null;
    accessibilityScore: number | null;
    bestPracticesScore: number | null;
    seoScore: number | null;
    coreWebVitals: CoreWebVital[];
    opportunities: PageSpeedOpportunity[];
    diagnostics: PageSpeedOpportunity[];
  };
  desktop: {
    performanceScore: number | null;
    accessibilityScore: number | null;
    bestPracticesScore: number | null;
    seoScore: number | null;
    coreWebVitals: CoreWebVital[];
    opportunities: PageSpeedOpportunity[];
    diagnostics: PageSpeedOpportunity[];
  };
  fetchedAt: string;
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface SeoCheckItem {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  value?: string;
  recommendation?: string;
}

export interface SeoData {
  url: string;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasViewportMeta: boolean;
  hasRobotsTxt: boolean;
  robotsAllowsCrawl: boolean;
  hasSitemap: boolean;
  sitemapUrl: string | null;
  sitemapPageCount: number;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  langAttribute: string | null;
  checks: SeoCheckItem[];
}

// ─── UX ───────────────────────────────────────────────────────────────────────

export interface UxCheckItem {
  id: string;
  category: 'mobile' | 'accessibility' | 'performance' | 'content';
  label: string;
  status: 'pass' | 'fail' | 'warning';
  detail?: string;
}

export interface UxData {
  mobileScore: number | null;
  accessibilityScore: number | null;
  hasViewport: boolean;
  isResponsive: boolean;
  contrastIssues: number;
  tapTargetIssues: number;
  fontSizeIssues: number;
  imageAltIssues: number;
  checks: UxCheckItem[];
}

// ─── Bugs ─────────────────────────────────────────────────────────────────────

export interface BrokenLink {
  url: string;
  status: number | null;
  parent: string;
  failureReason?: string;
}

export interface MissingAltImage {
  src: string;
}

export interface BugData {
  brokenLinks: BrokenLink[];
  brokenLinkCount: number;
  linksChecked: number;
  missingAltImages: MissingAltImage[];
  missingMetaDescription: boolean;
  duplicateH1: boolean;
  h1Count: number;
  hasFavicon: boolean;
  hasMixedContent: boolean;
  missingLangAttribute: boolean;
  checks: Array<{
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'warning';
    detail?: string;
  }>;
}

// ─── Traffic ──────────────────────────────────────────────────────────────────

export interface TrafficData {
  domain: string;
  domainAuthority: number | null;
  pageRankAvailable: boolean;
  coreWebVitalsRating: ScoreRating;
  mobileReadiness: ScoreRating;
  overallTrafficPotential: ScoreRating;
  seoImpactScore: number | null;
  recommendations: string[];
}

// ─── Root Report ──────────────────────────────────────────────────────────────

export interface AuditReport {
  url: string;
  domain: string;
  auditedAt: string;
  overallScore: number | null;
  performance: SectionResult<PerformanceData>;
  seo: SectionResult<SeoData>;
  ux: SectionResult<UxData>;
  bugs: SectionResult<BugData>;
  traffic: SectionResult<TrafficData>;
}

export interface AuditApiResponse {
  success: boolean;
  report?: AuditReport;
  error?: string;
}
