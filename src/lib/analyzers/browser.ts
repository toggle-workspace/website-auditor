import { BrowserData, ConsoleMessage, NetworkError, JsError } from '@/lib/types';

const TIMEOUT_MS = 30_000;

async function launchBrowser() {
  // On Vercel (or any production env), use the lightweight sparticuz Chromium binary.
  // Locally, fall back to the full puppeteer package which bundles its own Chromium.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
}

// Messages that are expected/irrelevant noise on most sites
const NOISE_PATTERNS = [
  /favicon/i,
  /service.?worker/i,
  /\[HMR\]/,
  /\[Fast Refresh\]/,
  /chrome-extension/i,
];

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some(p => p.test(text));
}

export async function analyzeBrowser(url: string): Promise<{ data: BrowserData; score: number }> {
  const consoleMessages: ConsoleMessage[] = [];
  const networkErrors: NetworkError[] = [];
  const jsErrors: JsError[] = [];

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      const type = msg.type();
      if (type !== 'error' && type !== 'warn') return;
      const text = msg.text();
      if (isNoise(text)) return;
      consoleMessages.push({
        type: type === 'error' ? 'error' : 'warning',
        text,
        url: msg.location()?.url,
        line: msg.location()?.lineNumber,
        column: msg.location()?.columnNumber,
      });
    });

    page.on('pageerror', (err: unknown) => {
      const e = err as Error;
      jsErrors.push({ message: e.message ?? String(err), stack: e.stack });
    });

    page.on('requestfailed', (req) => {
      const reqUrl = req.url();
      if (isNoise(reqUrl)) return;
      networkErrors.push({
        url: reqUrl,
        resourceType: req.resourceType(),
        errorText: req.failure()?.errorText ?? 'Failed',
      });
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    const trimmedConsole = consoleMessages.slice(0, 30);
    const trimmedNetwork = networkErrors.slice(0, 25);
    const trimmedJs = jsErrors.slice(0, 20);

    const errorMessages = trimmedConsole.filter(m => m.type === 'error');
    const warnMessages = trimmedConsole.filter(m => m.type === 'warning');

    const checks: BrowserData['checks'] = [];

    function check(id: string, label: string, pass: boolean, detail?: string, warning = false) {
      checks.push({ id, label, status: pass ? 'pass' : warning ? 'warning' : 'fail', detail });
    }

    check('js-errors', `JavaScript errors (${trimmedJs.length} found)`, trimmedJs.length === 0, trimmedJs.length > 0 ? `${trimmedJs.length} uncaught exception(s) on page load` : undefined);
    check('console-errors', `Console errors (${errorMessages.length} found)`, errorMessages.length === 0, errorMessages.length > 0 ? `${errorMessages.length} error(s) logged to console` : undefined);
    check('console-warnings', `Console warnings (${warnMessages.length} found)`, warnMessages.length === 0, warnMessages.length > 0 ? `${warnMessages.length} warning(s) logged to console` : undefined, true);
    check('network-errors', `Network failures (${trimmedNetwork.length} found)`, trimmedNetwork.length === 0, trimmedNetwork.length > 0 ? `${trimmedNetwork.length} resource(s) failed to load` : undefined);
    check('horizontal-scroll', 'No horizontal overflow at 1280px', !hasHorizontalScroll, hasHorizontalScroll ? 'Page content overflows horizontally — likely a layout bug' : undefined, true);

    let score = 100;
    score -= Math.min(trimmedJs.length * 15, 45);
    score -= Math.min(errorMessages.length * 8, 30);
    score -= Math.min(warnMessages.length * 3, 12);
    score -= Math.min(trimmedNetwork.length * 4, 20);
    if (hasHorizontalScroll) score -= 10;
    score = Math.max(0, score);

    return {
      score,
      data: {
        consoleMessages: trimmedConsole,
        networkErrors: trimmedNetwork,
        jsErrors: trimmedJs,
        consoleErrorCount: errorMessages.length,
        consoleWarningCount: warnMessages.length,
        networkErrorCount: trimmedNetwork.length,
        jsErrorCount: trimmedJs.length,
        hasHorizontalScroll,
        checks,
      },
    };
  } finally {
    await browser?.close();
  }
}
