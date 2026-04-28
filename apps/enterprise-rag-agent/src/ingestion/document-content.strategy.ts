import { UnsupportedMediaTypeException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { DocumentMetadata } from '../document/document.service';

export interface DocumentContentStrategy {
  supports(document: DocumentMetadata): boolean;
  read(document: DocumentMetadata): Promise<string>;
}

export class TextDocumentContentStrategy implements DocumentContentStrategy {
  private readonly supportedExtensions = new Set(['.txt', '.md', '.markdown']);
  private readonly supportedMimeTypes = new Set(['text/plain', 'text/markdown']);

  supports(document: DocumentMetadata): boolean {
    return (
      this.supportedExtensions.has(document.extension) ||
      this.supportedMimeTypes.has(document.mimeType)
    );
  }

  read(document: DocumentMetadata): Promise<string> {
    return readFile(document.storagePath, 'utf8');
  }
}

export class PdfDocumentContentStrategy implements DocumentContentStrategy {
  supports(document: DocumentMetadata): boolean {
    return document.extension === '.pdf' || document.mimeType === 'application/pdf';
  }

  read(): Promise<string> {
    return Promise.reject(new UnsupportedMediaTypeException('PDF parsing is not implemented yet'));
  }
}

export function createDefaultDocumentContentStrategies(): DocumentContentStrategy[] {
  return [new TextDocumentContentStrategy(), new PdfDocumentContentStrategy()];
}
