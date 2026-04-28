import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  DOCUMENT_UPLOAD_TYPE_ERROR,
  getDocumentStorageRoot,
  isAllowedDocumentFile,
  MAX_DOCUMENT_UPLOAD_SIZE_BYTES,
} from './document-upload.constants';
import { IngestionJobSummary } from '../ingestion/ingestion-queue.constants';
import { IngestionQueueService } from '../ingestion/ingestion-queue.service';
import { DocumentMetadata, DocumentService, UploadedDocumentFile } from './document.service';

export interface UploadFileResult {
  document: DocumentMetadata;
  job: IngestionJobSummary;
}

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly ingestionQueueService: IngestionQueueService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: getDocumentStorageRoot(),
      limits: {
        fileSize: MAX_DOCUMENT_UPLOAD_SIZE_BYTES,
      },
      fileFilter: (_request, file, callback) => {
        if (!isAllowedDocumentFile(file.originalname)) {
          callback(new BadRequestException(DOCUMENT_UPLOAD_TYPE_ERROR), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file?: UploadedDocumentFile): Promise<UploadFileResult> {
    const document = await this.documentService.uploadFile(file);
    const job = await this.ingestionQueueService.enqueueDocument(document.id);

    return { document, job };
  }
}
