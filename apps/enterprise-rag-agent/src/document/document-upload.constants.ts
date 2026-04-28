import { extname, resolve } from 'path';

export const DEFAULT_DOCUMENT_STORAGE_DIR = 'storage/documents';
export const MAX_DOCUMENT_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.pdf']);
export const DOCUMENT_UPLOAD_TYPE_ERROR = 'only txt, md, markdown, and pdf files are supported';

export function getDocumentStorageRoot(
  storageDir = process.env.DOCUMENT_STORAGE_DIR ?? DEFAULT_DOCUMENT_STORAGE_DIR,
): string {
  return resolve(process.cwd(), storageDir);
}

export function getDocumentExtension(originalName: string): string {
  return extname(originalName).toLowerCase();
}

export function isAllowedDocumentFile(originalName: string): boolean {
  return ALLOWED_DOCUMENT_EXTENSIONS.has(getDocumentExtension(originalName));
}
