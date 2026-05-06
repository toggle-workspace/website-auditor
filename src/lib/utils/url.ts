export function normalizeUrl(input: string | null): string {
  if (!input) throw new Error('URL is required');
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  const parsed = new URL(url);
  return parsed.href;
}

export function extractDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

export function isSameDomain(linkUrl: string, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl).hostname;
    const link = new URL(linkUrl, baseUrl).hostname;
    return link === base || link.endsWith('.' + base);
  } catch {
    return false;
  }
}

export function getOrigin(url: string): string {
  return new URL(url).origin;
}
