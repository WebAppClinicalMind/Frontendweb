"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, RefreshCw, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import apiClient from "@/lib/api/client"
import type { IndexStatistics } from "@/lib/api/types"

// Mock data for document list (in real app, this would come from API)
interface Document {
  document_id: string
  filename: string
  status: "processing" | "completed" | "failed"
  upload_timestamp: string
  document_type: string
  file_size: number
}

const mockDocuments: Document[] = [
  {
    document_id: "d1a2b3c4-5678-90ab-cdef-1234567890ab",
    filename: "patient_report_2024.pdf",
    status: "completed",
    upload_timestamp: "2024-01-15T10:30:00Z",
    document_type: "pdf",
    file_size: 2457600,
  },
  {
    document_id: "e2b3c4d5-6789-01bc-def0-2345678901bc",
    filename: "lab_results_jan.docx",
    status: "processing",
    upload_timestamp: "2024-01-15T11:00:00Z",
    document_type: "docx",
    file_size: 156000,
  },
  {
    document_id: "f3c4d5e6-7890-12cd-ef01-3456789012cd",
    filename: "clinical_notes.txt",
    status: "completed",
    upload_timestamp: "2024-01-14T09:15:00Z",
    document_type: "txt",
    file_size: 45000,
  },
  {
    document_id: "g4d5e6f7-8901-23de-f012-4567890123de",
    filename: "radiology_scan.pdf",
    status: "failed",
    upload_timestamp: "2024-01-14T08:45:00Z",
    document_type: "pdf",
    file_size: 8900000,
  },
]

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents] = useState<Document[]>(mockDocuments)

  const { data: stats, isLoading: statsLoading } = useSWR<IndexStatistics>(
    "indexer-stats",
    () => apiClient.getIndexStatistics(),
    { revalidateOnFocus: false, errorRetryCount: 2 },
  )

  const filteredDocuments = documents.filter((doc) => doc.filename.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: Document["status"]) => {
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
    }
  }

  return (
    <AppLayout title="Document Library" description="View and manage your uploaded documents">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  (stats?.total_documents ?? documents.length)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Chunks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.total_chunks ?? "—")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--warning)]">
                {documents.filter((d) => d.status === "processing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {documents.filter((d) => d.status === "failed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No documents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.document_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{doc.filename}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="uppercase text-xs font-medium text-muted-foreground">
                            {doc.document_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(doc.upload_timestamp)}</TableCell>
                        <TableCell>
                          <Link href={`/documents/${doc.document_id}`}>
                            <Button variant="ghost" size="icon">
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
