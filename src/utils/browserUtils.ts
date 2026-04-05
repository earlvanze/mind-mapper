// Browser compatibility utilities
// Lightweight feature detection and browser identification

export type BrowserOS = 'mac' | 'windows' | 'linux' | 'android' | 'ios' | 'unknown';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

export interface BrowserInfo {
  browser: BrowserType;
  os: BrowserOS;
  isMac: boolean;
  isMobile: boolean;
  supportsClipboard: boolean;
  supportsWebShare: boolean;
  supportsFileInput: boolean;
  supportsCrypto: boolean;
  supportsIntl: boolean;
  supportsCssGrid: boolean;
}

/**
 * Detect browser type from user agent
 */
export function detectBrowser(): BrowserType {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('chrome/') && !ua.includes('chromium')) return 'chrome';
  if (ua.includes('firefox/')) return 'firefox';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'safari';
  
  return 'unknown';
}

/**
 * Detect operating system from navigator platform
 */
export function detectOS(): BrowserOS {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const platform = navigator.platform?.toLowerCase() || '';
  const ua = navigator.userAgent.toLowerCase();
  
  if (platform.includes('mac') || ua.includes('macintosh')) return 'mac';
  if (platform.includes('win') || ua.includes('windows')) return 'windows';
  if (platform.includes('linux') && !ua.includes('android')) return 'linux';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  
  return 'unknown';
}

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) ||
    (typeof window !== 'undefined' && 'ontouchstart' in window);
}

/**
 * Check clipboard API support
 */
export function supportsClipboardAPI(): boolean {
  return typeof navigator !== 'undefined' && 
    typeof navigator.clipboard !== 'undefined' &&
    typeof navigator.clipboard.writeText === 'function';
}

/**
 * Check Web Share API support
 */
export function supportsWebShareAPI(): boolean {
  return typeof navigator !== 'undefined' && 
    typeof (navigator as any).share === 'function';
}

/**
 * Check File API support
 */
export function supportsFileAPI(): boolean {
  return typeof window !== 'undefined' && 
    typeof (window as any).File !== 'undefined' &&
    typeof (window as any).FileReader !== 'undefined';
}

/**
 * Check SubtleCrypto API support
 */
export function supportsCryptoAPI(): boolean {
  return typeof window !== 'undefined' && 
    typeof (window as any).crypto !== 'undefined' &&
    typeof (window as any).crypto.subtle !== 'undefined';
}

/**
 * Check Intl API support
 */
export function supportsIntlAPI(): boolean {
  return typeof Intl !== 'undefined';
}

/**
 * Check CSS Grid support
 */
export function supportsCssGrid(): boolean {
  if (typeof document === 'undefined') return false;
  const div = document.createElement('div');
  return typeof (div.style as any).grid !== 'undefined';
}

/**
 * Get complete browser compatibility info
 */
export function getBrowserInfo(): BrowserInfo {
  return {
    browser: detectBrowser(),
    os: detectOS(),
    isMac: detectOS() === 'mac',
    isMobile: isMobileDevice(),
    supportsClipboard: supportsClipboardAPI(),
    supportsWebShare: supportsWebShareAPI(),
    supportsFileInput: supportsFileAPI(),
    supportsCrypto: supportsCryptoAPI(),
    supportsIntl: supportsIntlAPI(),
    supportsCssGrid: supportsCssGrid(),
  };
}

/**
 * Known browser issues and workarounds
 */
export interface BrowserIssue {
  browser: BrowserType;
  os?: BrowserOS;
  severity: 'critical' | 'warning';
  message: string;
  workaround?: string;
}

export const KNOWN_ISSUES: BrowserIssue[] = [
  {
    browser: 'safari',
    severity: 'warning',
    message: 'Clipboard API may require user gesture to work',
    workaround: 'Share link uses clipboard.copy fallback'
  },
  {
    browser: 'firefox',
    os: 'android',
    severity: 'warning',
    message: 'Some CSS Grid layouts may not render correctly',
    workaround: 'Falls back to flexbox'
  },
  {
    browser: 'chrome',
    os: 'android',
    severity: 'warning',
    message: 'Touch events may conflict with pan/zoom gestures',
    workaround: 'Use pinch-to-zoom toggle in settings'
  }
];

/**
 * Get issues relevant to current browser
 */
export function getRelevantIssues(info?: BrowserInfo): BrowserIssue[] {
  const browserInfo = info || getBrowserInfo();
  return KNOWN_ISSUES.filter(issue => {
    if (issue.browser !== browserInfo.browser) return false;
    if (issue.os && issue.os !== browserInfo.os) return false;
    return true;
  });
}
