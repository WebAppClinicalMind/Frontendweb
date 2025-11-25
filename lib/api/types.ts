// Document types
export interface DocumentUploadResponse {
  document_id: string
  filename: string
  status: "processing" | "completed" | "failed"
  message: string
  upload_timestamp: string
}

export interface BatchUploadResponse {
  total_documents: number
  successful_uploads: number
  failed_uploads: number
  documents: DocumentUploadResponse[]
}

export interface DocumentStatus {
  document_id: string
  filename: string
  status: "processing" | "completed" | "failed"
  upload_timestamp: string
  document_type: "pdf" | "docx" | "txt"
  file_size: number
  error_message: string | null
}

export interface DocumentContent {
  content_id: string
  document_id: string
  extraction_method: string
  page_count: number | null
  language: string | null
  character_count: number | null
  word_count: number | null
  extraction_timestamp: string
  raw_text: string | null
}

export interface DocumentDetails {
  document_id: string
  original_filename: string
  upload_timestamp: string
  document_type: string
  source_system: string | null
  file_size: number
  mime_type: string | null
  status: "processing" | "completed" | "failed"
  content: DocumentContent | null
}

// DeID types
export interface DetectedEntity {
  entity_type: string
  text: string
  start: number
  end: number
  score: number
}

export interface AnonymizeResponse {
  anon_id: string
  document_id: string
  anonymized_text: string
  entities_detected: DetectedEntity[]
  entity_count: number
  processing_time_seconds: number
  method: string
  timestamp: string
}

export interface AnonymizedDocument {
  anon_id: string
  document_id: string
  anonymized_text: string
  anonymization_method: string
  entity_count: number
  processed_timestamp: string
}

// Search types
export interface SearchResult {
  chunk_id: string
  document_id: string
  chunk_text: string
  chunk_position: number
  similarity_score: number
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  total_results: number
  processing_time_ms: number
}

export interface IndexJobResponse {
  job_id: string
  document_id: string
  status: "pending" | "processing" | "completed" | "failed"
  chunks_created: number
  message: string
}

export interface IndexJobStatus {
  job_id: string
  document_id: string
  status: "pending" | "processing" | "completed" | "failed"
  chunks_created: number
  chunks_indexed: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

export interface IndexStatistics {
  total_documents: number
  total_chunks: number
  total_vectors: number
  embedding_model: string
  embedding_dimension: number
  index_type: string
}

export interface DocumentChunk {
  chunk_id: string
  chunk_position: number
  chunk_text: string
  token_count: number
  embedding_id: number | null
}

export interface DocumentChunksResponse {
  document_id: string
  total_chunks: number
  chunks: DocumentChunk[]
}

// QA types
export interface Citation {
  document_id: string
  chunk_id: string
  relevance_score: number
  chunk_text: string | null
}

export interface QAResponse {
  query_id: string
  response_id: string
  answer: string
  citations: Citation[]
  model_used: string
  generation_time_ms: number
  token_count: number | null
  created_at: string
}

export interface QueryDetails {
  query_id: string
  user_id: string | null
  query_text: string
  timestamp: string
  response_text: string | null
  citations: Citation[]
  model_used: string | null
  generation_time_ms: number | null
}

export interface QueryHistoryItem {
  query_id: string
  query_text: string
  timestamp: string
  response_preview: string | null
}

export interface QueryHistoryResponse {
  queries: QueryHistoryItem[]
  total: number
  page: number
  page_size: number
}

export interface ModelInfo {
  model_name: string
  provider: string
  base_url: string
  is_available: boolean
  parameters: Record<string, unknown>
}

// Health types
export interface HealthStatus {
  status: "healthy" | "unhealthy"
  service: string
  timestamp: string
}

// Error types
export interface APIError {
  error: string
  detail: string | null
  timestamp: string
}
