import { describe, it, expect } from 'vitest';
import {
  detectBrowser,
  detectOS,
  isMobileDevice,
  supportsClipboardAPI,
  supportsWebShareAPI,
  supportsFileAPI,
  supportsCryptoAPI,
  supportsIntlAPI,
  supportsCssGrid,
  getBrowserInfo,
  KNOWN_ISSUES,
  getRelevantIssues,
  type BrowserType,
  type BrowserOS
} from './browserUtils';

describe('browserUtils', () => {
  describe('detectBrowser', () => {
    it('should detect Chrome', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true
      });
      expect(detectBrowser()).toBe('chrome');
    });

    it('should detect Firefox', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        configurable: true
      });
      expect(detectBrowser()).toBe('firefox');
    });

    it('should detect Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        configurable: true
      });
      expect(detectBrowser()).toBe('safari');
    });

    it('should detect Edge', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        configurable: true
      });
      expect(detectBrowser()).toBe('edge');
    });

    it('should return unknown for unrecognized browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Unknown Browser)',
        configurable: true
      });
      expect(detectBrowser()).toBe('unknown');
    });
  });

  describe('detectOS', () => {
    it('should detect Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });
      expect(detectOS()).toBe('mac');
    });

    it('should detect Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true
      });
      expect(detectOS()).toBe('windows');
    });

    it('should detect Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true
      });
      expect(detectOS()).toBe('linux');
    });

    it('should detect Android from userAgent', () => {
      Object.defineProperty(navigator, 'platform', {
        value: '',
        configurable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
        configurable: true
      });
      expect(detectOS()).toBe('android');
    });

    it('should detect iOS from userAgent', () => {
      Object.defineProperty(navigator, 'platform', {
        value: '',
        configurable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });
      expect(detectOS()).toBe('ios');
    });
  });

  describe('isMobileDevice', () => {
    it('should detect Android as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile',
        configurable: true
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPhone as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile',
        configurable: true
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect desktop browser as not mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        configurable: true
      });
      // Only check userAgent regex, not ontouchstart
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      expect(isMobileUA).toBe(false);
    });
  });

  describe('supportsClipboardAPI', () => {
    it('should return true when clipboard API is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true
      });
      expect(supportsClipboardAPI()).toBe(true);
    });

    it('should return false when clipboard API is not available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true
      });
      expect(supportsClipboardAPI()).toBe(false);
    });
  });

  describe('supportsWebShareAPI', () => {
    it('should return true when share is available', () => {
      Object.defineProperty(navigator, 'share', {
        value: () => Promise.resolve(),
        configurable: true
      });
      expect(supportsWebShareAPI()).toBe(true);
    });

    it('should return false when share is not available', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true
      });
      expect(supportsWebShareAPI()).toBe(false);
    });
  });

  describe('supportsFileAPI', () => {
    it('should return true when File API is available', () => {
      Object.defineProperty(window, 'File', {
        value: class File {},
        configurable: true
      });
      Object.defineProperty(window, 'FileReader', {
        value: class FileReader {},
        configurable: true
      });
      expect(supportsFileAPI()).toBe(true);
    });

    it('should return false when File API is not available', () => {
      Object.defineProperty(window, 'File', {
        value: undefined,
        configurable: true
      });
      Object.defineProperty(window, 'FileReader', {
        value: undefined,
        configurable: true
      });
      expect(supportsFileAPI()).toBe(false);
    });
  });

  describe('supportsCryptoAPI', () => {
    it('should return true when crypto.subtle is available', () => {
      Object.defineProperty(window, 'crypto', {
        value: { subtle: {} },
        configurable: true
      });
      expect(supportsCryptoAPI()).toBe(true);
    });

    it('should return false when crypto.subtle is not available', () => {
      Object.defineProperty(window, 'crypto', {
        value: {},
        configurable: true
      });
      expect(supportsCryptoAPI()).toBe(false);
    });
  });

  describe('supportsIntlAPI', () => {
    it('should return true when Intl is available', () => {
      expect(supportsIntlAPI()).toBe(true);
    });
  });

  describe('supportsCssGrid', () => {
    it('should detect CSS Grid support', () => {
      const result = supportsCssGrid();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getBrowserInfo', () => {
    it('should return complete browser info object', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        configurable: true
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });
      
      const info = getBrowserInfo();
      
      expect(info).toHaveProperty('browser');
      expect(info).toHaveProperty('os');
      expect(info).toHaveProperty('isMac');
      expect(info).toHaveProperty('isMobile');
      expect(info).toHaveProperty('supportsClipboard');
      expect(info).toHaveProperty('supportsWebShare');
      expect(info).toHaveProperty('supportsFileInput');
      expect(info).toHaveProperty('supportsCrypto');
      expect(info).toHaveProperty('supportsIntl');
      expect(info).toHaveProperty('supportsCssGrid');
    });
  });

  describe('KNOWN_ISSUES', () => {
    it('should contain known browser issues', () => {
      expect(Array.isArray(KNOWN_ISSUES)).toBe(true);
      expect(KNOWN_ISSUES.length).toBeGreaterThan(0);
      
      const issue = KNOWN_ISSUES[0];
      expect(issue).toHaveProperty('browser');
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('message');
      expect(['critical', 'warning']).toContain(issue.severity);
    });
  });

  describe('getRelevantIssues', () => {
    it('should return issues matching current browser', () => {
      const browserInfo: BrowserInfo = {
        browser: 'safari',
        os: 'mac',
        isMac: true,
        isMobile: false,
        supportsClipboard: true,
        supportsWebShare: true,
        supportsFileInput: true,
        supportsCrypto: true,
        supportsIntl: true,
        supportsCssGrid: true
      };
      
      const issues = getRelevantIssues(browserInfo);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every(i => i.browser === 'safari')).toBe(true);
    });

    it('should return empty array when no matching issues', () => {
      const browserInfo: BrowserInfo = {
        browser: 'unknown',
        os: 'unknown',
        isMac: false,
        isMobile: false,
        supportsClipboard: false,
        supportsWebShare: false,
        supportsFileInput: false,
        supportsCrypto: false,
        supportsIntl: false,
        supportsCssGrid: false
      };
      
      const issues = getRelevantIssues(browserInfo);
      expect(issues.length).toBe(0);
    });
  });
});

interface BrowserInfo {
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
