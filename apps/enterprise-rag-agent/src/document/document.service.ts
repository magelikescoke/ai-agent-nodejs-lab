import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createReadStream } from 'fs';
import { createHash } from 'crypto';
import { stat } from 'fs/promises';
import { Model } from 'mongoose';
import { isAbsolute, relative, resolve } from 'path';
import { DocumentMongoModelName, DocumentRecord, DocumentStatus } from './document.model';
import {
  DOCUMENT_UPLOAD_TYPE_ERROR,
  getDocumentExtension,
  getDocumentStorageRoot,
  isAllowedDocumentFile,
  MAX_DOCUMENT_UPLOAD_SIZE_BYTES,
} from './document-upload.constants';

export interface UploadedDocumentFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface DocumentMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  extension: string;
  size: number;
  checksum: string;
  storagePath: string;
  storageKey: string;
  status: DocumentStatus;
  chunkCount: number;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedFile {
  filename: string;
  storagePath: string;
  storageKey: string;
}

type NewDocumentMetadata = Omit<DocumentMetadata, 'id'>;
type PersistedDocumentRecord = DocumentRecord & {
  _id: { toString(): string };
};

@Injectable()
export class DocumentService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(DocumentMongoModelName)
    private readonly documentModel: Model<DocumentRecord>,
  ) {}

  public async uploadFile(file?: UploadedDocumentFile): Promise<DocumentMetadata> {
    this.validateFile(file);

    const savedFile = this.getSavedFile(file);
    const documentMetadata = await this.getFileMetadata(file, savedFile);
    const createdDocument = await this.documentModel.create(
      this.toDocumentRecord(documentMetadata),
    );
    const document = this.toDocumentMetadata(createdDocument);

    return document;
  }

  public async getDocument(id: string): Promise<DocumentMetadata | null> {
    const document = await this.documentModel.findById(id).lean<PersistedDocumentRecord>().exec();

    return document ? this.toDocumentMetadata(document) : null;
  }

  public async updateChunkCount(id: string, chunkCount: number): Promise<void> {
    await this.documentModel.findByIdAndUpdate(id, { chunkCount }).exec();
  }

  public async updateStatus(
    id: string,
    status: DocumentStatus,
    errorMsg: string | null = null,
  ): Promise<void> {
    await this.documentModel.findByIdAndUpdate(id, { status, errorMsg }).exec();
  }

  private getSavedFile(file: UploadedDocumentFile): SavedFile {
    return {
      filename: file.filename,
      storagePath: resolve(file.path),
      storageKey: file.filename,
    };
  }

  private async getFileMetadata(
    file: UploadedDocumentFile,
    savedFile: SavedFile,
  ): Promise<NewDocumentMetadata> {
    const fileStat = await stat(savedFile.storagePath);
    const now = new Date().toISOString();

    return {
      originalName: file.originalname,
      filename: savedFile.filename,
      mimeType: file.mimetype,
      extension: getDocumentExtension(file.originalname),
      size: fileStat.size,
      checksum: await this.calculateChecksum(savedFile.storagePath),
      storagePath: savedFile.storagePath,
      storageKey: savedFile.storageKey,
      status: 'uploaded',
      chunkCount: 0,
      errorMsg: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private validateFile(file?: UploadedDocumentFile): asserts file is UploadedDocumentFile {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (!file.path || !file.filename) {
      throw new BadRequestException('uploaded file path is required');
    }

    this.validateStoragePath(file.path);

    if (file.size === 0) {
      throw new BadRequestException('uploaded file is empty');
    }

    if (file.size > MAX_DOCUMENT_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('uploaded file exceeds 10MB limit');
    }

    if (!isAllowedDocumentFile(file.originalname)) {
      throw new BadRequestException(DOCUMENT_UPLOAD_TYPE_ERROR);
    }
  }

  private getStorageRoot(): string {
    const configuredStorageDir = this.configService.get<string>('app.documentStorageDir');

    return getDocumentStorageRoot(configuredStorageDir);
  }

  private validateStoragePath(storagePath: string): void {
    const relativePath = relative(this.getStorageRoot(), resolve(storagePath));

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BadRequestException('uploaded file is outside document storage directory');
    }
  }

  private async calculateChecksum(storagePath: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = createReadStream(storagePath) as AsyncIterable<Buffer>;

    for await (const chunk of stream) {
      hash.update(chunk);
    }

    return hash.digest('hex');
  }

  private toDocumentRecord(document: NewDocumentMetadata): DocumentRecord {
    return {
      originalName: document.originalName,
      filename: document.filename,
      mimeType: document.mimeType,
      extension: document.extension,
      size: document.size,
      checksum: document.checksum,
      storagePath: document.storagePath,
      storageKey: document.storageKey,
      status: document.status,
      chunkCount: document.chunkCount,
      errorMsg: document.errorMsg,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
    };
  }

  private toDocumentMetadata(document: PersistedDocumentRecord): DocumentMetadata {
    return {
      id: document._id.toString(),
      originalName: document.originalName,
      filename: document.filename,
      mimeType: document.mimeType,
      extension: document.extension,
      size: document.size,
      checksum: document.checksum,
      storagePath: document.storagePath,
      storageKey: document.storageKey,
      status: document.status,
      chunkCount: document.chunkCount,
      errorMsg: document.errorMsg,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
