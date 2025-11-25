"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"

export default function UploadPage() {
  const [sourceSystem, setSourceSystem] = useState("")

  const handleUpload = async (files: File[]) => {
    try {
      if (files.length === 1) {
        const result = await apiClient.uploadDocument(files[0], sourceSystem || undefined)
        toast.success(`Document uploaded successfully`, {
          description: `ID: ${result.document_id}`,
        })
      } else {
        const result = await apiClient.uploadDocumentsBatch(files, sourceSystem || undefined)
        toast.success(`Batch upload complete`, {
          description: `${result.successful_uploads}/${result.total_documents} documents uploaded`,
        })
      }
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
      throw error
    }
  }

  return (
    <AppLayout title="Upload Documents" description="Upload medical documents for processing">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Medical Documents</CardTitle>
            <CardDescription>
              Upload PDF, DOCX, or TXT files for automatic processing, anonymization, and indexing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="source-system">Source System (Optional)</Label>
              <Input
                id="source-system"
                placeholder="e.g., EMR, Lab, Radiology"
                value={sourceSystem}
                onChange={(e) => setSourceSystem(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Identify the source of these documents for better organization
              </p>
            </div>
            <FileDropzone onUpload={handleUpload} sourceSystem={sourceSystem} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supported File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  PDF
                </div>
                <div>
                  <p className="text-sm font-medium">PDF Documents</p>
                  <p className="text-xs text-muted-foreground">Up to 50MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  DOC
                </div>
                <div>
                  <p className="text-sm font-medium">Word Documents</p>
                  <p className="text-xs text-muted-foreground">DOCX format</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  TXT
                </div>
                <div>
                  <p className="text-sm font-medium">Plain Text</p>
                  <p className="text-xs text-muted-foreground">UTF-8 encoded</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
