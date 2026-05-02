// Binary file attachment support for mind map nodes
// Files are stored as base64 data URLs alongside node data

import type { Attachment } from '../store/useMindMapStore';

export { type Attachment } from '../store/useMindMapStore';

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',
  'application/xml',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
]);

export function isAllowedMimeType(mimeType: string): boolean {
  if (mimeType.startsWith('image/')) return false;
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const meta = parts[0];
  const raw = atob(parts[1]);
  const mimeMatch = meta.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    binary[i] = raw.charCodeAt(i);
  }
  return new Blob([binary], { type: mimeType });
}

export function downloadAttachment(attachment: Attachment): void {
  const blob = base64ToBlob(attachment.data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = attachment.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAttachment(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      ok: false,
      error: `File too large. Max size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`,
    };
  }
  if (file.type && !isAllowedMimeType(file.type) && !file.type.startsWith('image/')) {
    return {
      ok: false,
      error: `File type "${file.type}" is not supported.`,
    };
  }
  return { ok: true };
}

export function buildAttachment(file: File, dataUrl: string): Attachment {
  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    data: dataUrl,
    size: file.size,
  };
}
