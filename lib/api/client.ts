import type {
  DocumentUploadResponse,
  BatchUploadResponse,
  DocumentStatus,
  DocumentDetails,
  DocumentContent,
  AnonymizeResponse,
  AnonymizedDocument,
  SearchResponse,
  IndexJobResponse,
  IndexJobStatus,
  IndexStatistics,
  DocumentChunksResponse,
  QAResponse,
  QueryDetails,
  QueryHistoryResponse,
  ModelInfo,
  HealthStatus,
} from "./types"

const API_CONFIG = {
  docIngestor: process.env.NEXT_PUBLIC_DOC_INGESTOR_URL || "http://localhost:8001",
  deid: process.env.NEXT_PUBLIC_DEID_URL || "http://localhost:8002",
  semanticIndexer: process.env.NEXT_PUBLIC_SEMANTIC_INDEXER_URL || "http://localhost:8003",
  llmqa: process.env.NEXT_PUBLIC_LLMQA_URL || "http://localhost:8004",
}

class APIClient {
  private config: typeof API_CONFIG

  constructor(config: typeof API_CONFIG = API_CONFIG) {
    this.config = config
  }

  private async request<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Unknown error",
        detail: response.statusText,
      }))
      throw new Error(error.detail || error.error || "Request failed")
    }

    return response.json()
  }

  // DocIngestor Service - http://localhost:8001
  async uploadDocument(file: File, sourceSystem?: string): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append("file", file)
    if (sourceSystem) {
      formData.append("source_system", sourceSystem)
    }

    return this.request<DocumentUploadResponse>(this.config.docIngestor, "/v1/documents/upload", {
      method: "POST",
      body: formData,
    })
  }

  async uploadDocumentsBatch(files: File[], sourceSystem?: string): Promise<BatchUploadResponse> {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    if (sourceSystem) {
      formData.append("source_system", sourceSystem)
    }

    return this.request<BatchUploadResponse>(this.config.docIngestor, "/v1/documents/batch", {
      method: "POST",
      body: formData,
    })
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    return this.request<DocumentStatus>(this.config.docIngestor, `/v1/documents/${documentId}/status`)
  }

  async getDocumentDetails(documentId: string, includeText = false): Promise<DocumentDetails> {
    const params = includeText ? "?include_text=true" : ""
    return this.request<DocumentDetails>(this.config.docIngestor, `/v1/documents/${documentId}${params}`)
  }

  async getDocumentContent(documentId: string): Promise<DocumentContent> {
    return this.request<DocumentContent>(this.config.docIngestor, `/v1/documents/${documentId}/content`)
  }

  // DeID Service - http://localhost:8002
  async anonymizeDocument(
    documentId: string,
    text: string,
    method: "redact" | "pseudonymize" | "mask" = "redact",
    preserveMedicalTerms = true,
  ): Promise<AnonymizeResponse> {
    return this.request<AnonymizeResponse>(this.config.deid, "/v1/anonymize/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: documentId,
        text,
        method,
        preserve_medical_terms: preserveMedicalTerms,
      }),
    })
  }

  async getAnonymizedByDocumentId(documentId: string): Promise<AnonymizedDocument> {
    return this.request<AnonymizedDocument>(this.config.deid, `/v1/anonymize/document/${documentId}`)
  }

  async getAnonymizedById(anonId: string): Promise<AnonymizedDocument> {
    return this.request<AnonymizedDocument>(this.config.deid, `/v1/anonymize/${anonId}`)
  }

  // SemanticIndexer Service - http://localhost:8003
  async search(query: string, topK = 5, minScore?: number, documentIds?: string[]): Promise<SearchResponse> {
    return this.request<SearchResponse>(this.config.semanticIndexer, "/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        top_k: topK,
        min_score: minScore,
        document_ids: documentIds,
      }),
    })
  }

  async indexDocument(documentId: string, documentText: string): Promise<IndexJobResponse> {
    return this.request<IndexJobResponse>(this.config.semanticIndexer, "/v1/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: documentId,
        document_text: documentText,
      }),
    })
  }

  async getIndexJobStatus(jobId: string): Promise<IndexJobStatus> {
    return this.request<IndexJobStatus>(this.config.semanticIndexer, `/v1/index/job/${jobId}`)
  }

  async getIndexStatistics(): Promise<IndexStatistics> {
    return this.request<IndexStatistics>(this.config.semanticIndexer, "/v1/statistics")
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunksResponse> {
    return this.request<DocumentChunksResponse>(this.config.semanticIndexer, `/v1/document/${documentId}/chunks`)
  }

  // LLM QA Module - http://localhost:8004
  async submitQuery(queryText: string, userId?: string): Promise<QAResponse> {
    return this.request<QAResponse>(this.config.llmqa, "/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query_text: queryText,
        user_id: userId,
      }),
    })
  }

  async getQueryDetails(queryId: string): Promise<QueryDetails> {
    return this.request<QueryDetails>(this.config.llmqa, `/v1/query/${queryId}`)
  }

  async getQueryHistory(page = 1, pageSize = 20, userId?: string): Promise<QueryHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    if (userId) params.append("user_id", userId)

    return this.request<QueryHistoryResponse>(this.config.llmqa, `/v1/queries?${params.toString()}`)
  }

  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>(this.config.llmqa, "/v1/models")
  }

  // Health Checks
  async checkIngestorHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>(this.config.docIngestor, "/health")
  }

  async checkDeidHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>(this.config.deid, "/health")
  }

  async checkIndexerHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>(this.config.semanticIndexer, "/health")
  }

  async checkQAHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>(this.config.llmqa, "/health")
  }
}

export const apiClient = new APIClient()
export default apiClient
