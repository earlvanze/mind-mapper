import { describe, it, expect } from 'vitest';
import {
  MAX_ATTACHMENT_SIZE,
  ALLOWED_MIME_TYPES,
  isAllowedMimeType,
  formatFileSize,
  getFileExtension,
  validateAttachment,
} from './attachments';

describe('attachments utility', () => {
  describe('MAX_ATTACHMENT_SIZE', () => {
    it('is 5MB', () => {
      expect(MAX_ATTACHMENT_SIZE).toBe(5 * 1024 * 1024);
    });
  });

  describe('isAllowedMimeType', () => {
    it('blocks image types', () => {
      expect(isAllowedMimeType('image/png')).toBe(false);
      expect(isAllowedMimeType('image/jpeg')).toBe(false);
      expect(isAllowedMimeType('image/gif')).toBe(false);
    });

    it('allows PDF', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('allows Word docs', () => {
      expect(isAllowedMimeType('application/msword')).toBe(true);
      expect(isAllowedMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('allows spreadsheets', () => {
      expect(isAllowedMimeType('application/vnd.ms-excel')).toBe(true);
      expect(isAllowedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    });

    it('allows text files', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true);
      expect(isAllowedMimeType('text/csv')).toBe(true);
    });

    it('allows audio/video', () => {
      expect(isAllowedMimeType('audio/mpeg')).toBe(true);
      expect(isAllowedMimeType('video/mp4')).toBe(true);
    });

    it('rejects unknown types', () => {
      expect(isAllowedMimeType('application/octet-stream')).toBe(false);
      expect(isAllowedMimeType('application/x-custom')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('file.DOCX')).toBe('docx');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('returns empty string for no extension', () => {
      expect(getFileExtension('README')).toBe('');
    });
  });

  describe('validateAttachment', () => {
    it('accepts valid small file', () => {
      const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      expect(validateAttachment(file)).toEqual({ ok: true });
    });

    it('rejects oversized file', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      const result = validateAttachment(file);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toContain('File too large');
    });

    it('rejects disallowed mime type', () => {
      const file = new File(['data'], 'virus.exe', { type: 'application/x-msdownload' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateAttachment(file);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toContain('not supported');
    });
  });
});
