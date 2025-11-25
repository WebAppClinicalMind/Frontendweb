"use client"

import useSWR from "swr"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, FileText, Layers, Cpu, Server, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api/client"
import type { IndexStatistics, ModelInfo, HealthStatus } from "@/lib/api/types"

export default function StatsPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<IndexStatistics>("index-statistics", () => apiClient.getIndexStatistics(), { revalidateOnFocus: false })

  const {
    data: modelInfo,
    isLoading: modelLoading,
    mutate: mutateModel,
  } = useSWR<ModelInfo>("model-info", () => apiClient.getModelInfo(), { revalidateOnFocus: false })

  const { data: ingestorHealth, mutate: mutateIngestor } = useSWR<HealthStatus>(
    "ingestor-health",
    () => apiClient.checkIngestorHealth(),
    { revalidateOnFocus: false, errorRetryCount: 1 },
  )

  const { data: deidHealth, mutate: mutateDeid } = useSWR<HealthStatus>(
    "deid-health",
    () => apiClient.checkDeidHealth(),
    { revalidateOnFocus: false, errorRetryCount: 1 },
  )

  const { data: indexerHealth, mutate: mutateIndexer } = useSWR<HealthStatus>(
    "indexer-health",
    () => apiClient.checkIndexerHealth(),
    { revalidateOnFocus: false, errorRetryCount: 1 },
  )

  const { data: qaHealth, mutate: mutateQA } = useSWR<HealthStatus>("qa-health", () => apiClient.checkQAHealth(), {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  })

  const refreshAll = () => {
    mutateStats()
    mutateModel()
    mutateIngestor()
    mutateDeid()
    mutateIndexer()
    mutateQA()
  }

  const services = [
    { name: "DocIngestor", health: ingestorHealth, description: "Document upload and processing" },
    { name: "DeID", health: deidHealth, description: "Anonymization service" },
    { name: "SemanticIndexer", health: indexerHealth, description: "Search and indexing" },
    { name: "LLM QA", health: qaHealth, description: "Question answering" },
  ]

  return (
    <AppLayout title="System Statistics" description="Monitor system health and performance">
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>

        {/* Index Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_documents ?? "—"}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Chunks</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_chunks?.toLocaleString() ?? "—"}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vectors</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_vectors?.toLocaleString() ?? "—"}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Embedding Dim</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.embedding_dimension ?? "—"}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model & Index Info */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>LLM Model Information</CardTitle>
              <CardDescription>Current question-answering model</CardDescription>
            </CardHeader>
            <CardContent>
              {modelLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : modelInfo ? (
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Model Name</dt>
                    <dd className="font-mono text-sm">{modelInfo.model_name}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Provider</dt>
                    <dd className="font-medium">{modelInfo.provider}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd>
                      {modelInfo.is_available ? (
                        <Badge className="bg-[var(--success)] text-[var(--success-foreground)]">Available</Badge>
                      ) : (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Base URL</dt>
                    <dd className="font-mono text-xs truncate max-w-[200px]">{modelInfo.base_url}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground">Unable to load model information</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Index Configuration</CardTitle>
              <CardDescription>Semantic search index settings</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : stats ? (
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Embedding Model</dt>
                    <dd className="font-mono text-sm">{stats.embedding_model}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Index Type</dt>
                    <dd className="font-medium">{stats.index_type}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Vector Dimension</dt>
                    <dd className="font-medium">{stats.embedding_dimension}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground">Unable to load index configuration</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Health
            </CardTitle>
            <CardDescription>Real-time status of all backend services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      service.health?.status === "healthy" ? "bg-[var(--success)]/10" : "bg-destructive/10"
                    }`}
                  >
                    {service.health?.status === "healthy" ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
