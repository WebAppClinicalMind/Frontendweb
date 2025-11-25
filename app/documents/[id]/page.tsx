"use client"

import { use, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, FileText, Clock, HardDrive, Type, Hash, Shield, Loader2, Copy, Check } from "lucide-react"
import apiClient from "@/lib/api/client"
import type { DocumentDetails, AnonymizedDocument } from "@/lib/api/types"
import { toast } from "sonner"

interface Props {
  params: Promise<{ id: string }>
}

export default function DocumentDetailPage({ params }: Props) {
  const { id } = use(params)
  const [copied, setCopied] = useState(false)

  const {
    data: document,
    isLoading: docLoading,
    error: docError,
  } = useSWR<DocumentDetails>(`document-${id}`, () => apiClient.getDocumentDetails(id, true), {
    revalidateOnFocus: false,
  })

  const { data: anonymized, isLoading: anonLoading } = useSWR<AnonymizedDocument>(
    document?.status === "completed" ? `anonymized-${id}` : null,
    () => apiClient.getAnonymizedByDocumentId(id),
    { revalidateOnFocus: false, errorRetryCount: 1 },
  )

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-[var(--success)] hover:bg-[var(--success)]/90 text-[var(--success-foreground)]">
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge
            variant="secondary"
            className="bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-[var(--warning-foreground)]"
          >
            Processing
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (docLoading) {
    return (
      <AppLayout title="Document Details" description="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    )
  }

  if (docError || !document) {
    return (
      <AppLayout title="Document Not Found" description="The requested document could not be found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The document you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Link href="/documents">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Documents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={document.original_filename} description={`Document ID: ${document.document_id}`}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate max-w-[200px]">{document.original_filename}</span>
        </div>

        {/* Metadata Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>{getStatusBadge(document.status)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">File Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatFileSize(document.file_size)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Word Count</CardTitle>
              <Type className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{document.content?.word_count?.toLocaleString() ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pages</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{document.content?.page_count ?? "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Document ID</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{document.document_id}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(document.document_id)}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">File Type</dt>
                <dd className="mt-1 uppercase font-medium">{document.document_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Uploaded</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDate(document.upload_timestamp)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Source System</dt>
                <dd className="mt-1">{document.source_system ?? "Not specified"}</dd>
              </div>
              {document.content && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Language</dt>
                    <dd className="mt-1">{document.content.language ?? "Unknown"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Extraction Method</dt>
                    <dd className="mt-1">{document.content.extraction_method}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="original" className="space-y-4">
          <TabsList>
            <TabsTrigger value="original">Original Content</TabsTrigger>
            <TabsTrigger value="anonymized" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Anonymized
            </TabsTrigger>
          </TabsList>

          <TabsContent value="original">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
                <CardDescription>Original text content extracted from the document</CardDescription>
              </CardHeader>
              <CardContent>
                {document.content?.raw_text ? (
                  <div className="max-h-[500px] overflow-auto rounded-lg bg-muted p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{document.content.raw_text}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>No text content available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anonymized">
            <Card>
              <CardHeader>
                <CardTitle>Anonymized Text</CardTitle>
                <CardDescription>Text with personal health information redacted</CardDescription>
              </CardHeader>
              <CardContent>
                {anonLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : anonymized?.anonymized_text ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">Method: {anonymized.anonymization_method}</Badge>
                      <Badge variant="outline">{anonymized.entity_count} entities detected</Badge>
                    </div>
                    <div className="max-h-[500px] overflow-auto rounded-lg bg-muted p-4">
                      <pre className="whitespace-pre-wrap font-mono text-sm">{anonymized.anonymized_text}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Shield className="h-8 w-8 mb-2" />
                    <p>Anonymized version not available</p>
                    <p className="text-sm">Document may still be processing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
