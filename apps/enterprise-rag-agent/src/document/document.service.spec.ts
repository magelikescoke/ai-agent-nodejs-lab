import type { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocumentRecord } from './document.model';
import { DocumentService, UploadedDocumentFile } from './document.service';

describe('DocumentService', () => {
  let storageDir: string;
  let service: DocumentService;
  let createDocument: jest.Mock<
    Promise<DocumentRecord & { _id: Types.ObjectId }>,
    [DocumentRecord]
  >;
  let mongoDocumentId: Types.ObjectId;

  beforeEach(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'enterprise-rag-docs-'));
    const configService = {
      get: jest.fn(() => storageDir),
    } as unknown as ConfigService;
    mongoDocumentId = new Types.ObjectId();
    createDocument = jest.fn((document: DocumentRecord) =>
      Promise.resolve({
        _id: mongoDocumentId,
        ...document,
      }),
    );
    const documentModel = {
      create: createDocument,
    } as unknown as Model<DocumentRecord>;

    service = new DocumentService(configService, documentModel);
  });

  afterEach(async () => {
    await rm(storageDir, { force: true, recursive: true });
  });

  it('stores the uploaded file and metadata', async () => {
    const content = Buffer.from('# Handbook\n\nInternal onboarding notes.');
    const storagePath = join(storageDir, 'stored-handbook.md');
    await writeFile(storagePath, content);

    const file = createUploadFile({
      filename: 'stored-handbook.md',
      mimetype: 'text/markdown',
      originalname: 'handbook.md',
      path: storagePath,
      size: content.length,
    });

    const document = await service.uploadFile(file);

    await expect(readFile(document.storagePath)).resolves.toEqual(content);
    expect(document).toMatchObject({
      originalName: 'handbook.md',
      mimeType: 'text/markdown',
      extension: '.md',
      size: content.length,
      status: 'uploaded',
      chunkCount: 0,
      errorMsg: null,
    });
    expect(document.checksum).toHaveLength(64);
    expect(document.id).toBe(mongoDocumentId.toString());
    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: 'handbook.md',
        status: 'uploaded',
      }),
    );
    expect(createDocument.mock.calls[0][0]).not.toHaveProperty('_id');
  });

  it('rejects unsupported file extensions', async () => {
    const storagePath = join(storageDir, 'stored-installer');
    await writeFile(storagePath, Buffer.from('binary'));

    const file = createUploadFile({
      filename: 'stored-installer',
      mimetype: 'application/octet-stream',
      originalname: 'installer.exe',
      path: storagePath,
      size: 6,
    });

    await expect(service.uploadFile(file)).rejects.toThrow(
      'only txt, md, markdown, and pdf files are supported',
    );
    expect(createDocument).not.toHaveBeenCalled();
  });

  function createUploadFile(overrides: {
    filename: string;
    mimetype: string;
    originalname: string;
    path: string;
    size: number;
  }): UploadedDocumentFile {
    return {
      fieldname: 'file',
      destination: storageDir,
      encoding: '7bit',
      ...overrides,
    };
  }
});
