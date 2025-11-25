"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, MessageSquare, Clock, FileText, ExternalLink } from "lucide-react"
import apiClient from "@/lib/api/client"
import type { QueryDetails } from "@/lib/api/types"

interface Props {
  params: Promise<{ id: string }>
}

export default function QueryDetailPage({ params }: Props) {
  const { id } = use(params)

  const {
    data: query,
    isLoading,
    error,
  } = useSWR<QueryDetails>(`query-${id}`, () => apiClient.getQueryDetails(id), { revalidateOnFocus: false })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <AppLayout title="Query Details" description="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    )
  }

  if (error || !query) {
    return (
      <AppLayout title="Query Not Found" description="The requested query could not be found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Query Not Found</h2>
            <p className="text-muted-foreground mb-4">The query you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/history">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Query Details" description={`Query ID: ${query.query_id}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/history">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Query History
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate max-w-[200px]">{query.query_id.slice(0, 8)}...</span>
        </div>

        {/* Query Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Question</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(query.timestamp)}
                  </span>
                  {query.model_used && <Badge variant="outline">{query.model_used}</Badge>}
                  {query.generation_time_ms && <span className="text-xs">{query.generation_time_ms}ms</span>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{query.query_text}</p>
          </CardContent>
        </Card>

        {/* Answer */}
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent>
            {query.response_text ? (
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">{query.response_text}</p>
            ) : (
              <p className="text-muted-foreground">No answer available</p>
            )}
          </CardContent>
        </Card>

        {/* Citations */}
        {query.citations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Source Citations
              </CardTitle>
              <CardDescription>
                {query.citations.length} relevant document
                {query.citations.length !== 1 ? "s" : ""} referenced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {query.citations.map((citation, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {citation.document_id.slice(0, 8)}...
                          </code>
                          <Badge variant="outline" className="text-xs">
                            Relevance: {(citation.relevance_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        {citation.chunk_text && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{citation.chunk_text}</p>
                        )}
                      </div>
                    </div>
                    <Link href={`/documents/${citation.document_id}`}>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View document</span>
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
