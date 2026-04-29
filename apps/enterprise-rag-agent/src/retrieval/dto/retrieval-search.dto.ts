export interface RetrievalSearchRequest {
  query: string;
  topK?: number;
  documentId?: string;
}

export interface RetrievalSearchChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  metadata: {
    source: string;
    heading?: string;
    pageNumber?: number;
  };
}

export interface RetrievalSearchResponse {
  query: string;
  topK: number;
  filters: {
    documentId?: string;
  };
  chunks: RetrievalSearchChunk[];
}
