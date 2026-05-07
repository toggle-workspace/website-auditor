# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (Next.js defaults, no custom config)
```

No test suite is configured.

## Environment Variables

```
PAGESPEED_API_KEY      # Google PageSpeed Insights API key (optional — omitting it still works but hits rate limits faster)
OPEN_PAGERANK_API_KEY  # OpenPageRank API key for domain authority scores in the Traffic section
```

## Architecture

This is a Next.js 14 App Router application. The core flow is:

1. User submits a URL on the homepage (`/`)
2. Browser navigates to `/report?url=<url>`
3. `ReportClient` (client component) fetches `GET /api/audit?url=<url>`
4. The API route runs analyzers sequentially/in parallel and returns a full `AuditReport`
5. Results are rendered across 5 report sections with score gauges and a PDF export option

### API execution order (`src/app/api/audit/route.ts`)

The audit pipeline has a fixed dependency order:
- **Step 1** — `analyzePerformance` (fetches Google PageSpeed Insights; provides `PerformanceData` for UX and Traffic)
- **Step 2** — `analyzeSeo` (fetches and parses the target URL's HTML; the raw HTML string is reused by UX and Bugs)
- **Step 3** — `analyzeUx`, `analyzeBugs`, `analyzeTraffic` run in parallel via `Promise.allSettled`, each receiving shared data from steps 1–2

Each analyzer returns `{ score, data }`. The route wraps these in `SectionResult<T>` and assembles the final `AuditReport`.

### Key directories

- `src/app/api/audit/` — Single API route; entry point for all analysis
- `src/lib/analyzers/` — One file per section: `performance.ts`, `seo.ts`, `ux.ts`, `bugs.ts`, `traffic.ts`
- `src/lib/types.ts` — All shared TypeScript types (`AuditReport`, `SectionResult<T>`, per-section data interfaces)
- `src/lib/utils/score.ts` — `ratingFromScore`, `calculateOverallScore` (overall score weights each section)
- `src/lib/utils/url.ts` — `normalizeUrl`, `extractDomain`
- `src/components/report/` — Report UI: `ReportClient.tsx` (data fetching), `ScoreGaugeGrid.tsx`, per-section display components
- `src/components/pdf/` — `AuditPdfDocument.tsx` + `PdfExportButton.tsx` for client-side PDF export via `@react-pdf/renderer`

### External dependencies worth knowing

- `cheerio` — server-side HTML parsing (marked as `serverComponentsExternalPackages` in `next.config.mjs` to avoid ESM issues)
- `linkinator` — broken link detection in `analyzeBugs`; also external-packaged
- `sitemapper` / `robots-parser` — sitemap and robots.txt checks in `analyzeSeo`
- `recharts` — score visualizations in report components
- `@react-pdf/renderer` — runs client-side only; the PDF button lazy-loads to avoid SSR issues
