"use client"

import { useCallback, useState } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  file: File
  id: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  documentId?: string
  error?: string
}

interface FileDropzoneProps {
  onUpload: (files: File[]) => Promise<void>
  sourceSystem?: string
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function FileDropzone({ onUpload, sourceSystem }: FileDropzoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
      status: "pending" as const,
      progress: 0,
    }))

    rejectedFiles.forEach((rejection) => {
      const errorMessage = rejection.errors.map((e) => e.message).join(", ")
      newFiles.push({
        file: rejection.file,
        id: `${rejection.file.name}-${Date.now()}`,
        status: "error" as const,
        progress: 0,
        error: errorMessage,
      })
    })

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    // Update all pending files to uploading
    setFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" as const, progress: 10 } : f)),
    )

    try {
      await onUpload(pendingFiles.map((f) => f.file))

      // Mark all uploading as success
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "success" as const, progress: 100 } : f)),
      )
    } catch (error) {
      // Mark all uploading as error
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "error" as const, error: "Upload failed" } : f)),
      )
    } finally {
      setIsUploading(false)
    }
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const successCount = files.filter((f) => f.status === "success").length
  const errorCount = files.filter((f) => f.status === "error").length

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragActive ? "bg-primary/10" : "bg-muted",
            )}
          >
            <Upload
              className={cn("h-8 w-8 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")}
            />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse. PDF, DOCX, TXT up to 50MB</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
              {successCount > 0 && <span className="text-[var(--success)]">{successCount} uploaded</span>}
              {errorCount > 0 && <span className="text-destructive">{errorCount} failed</span>}
            </div>
            {pendingCount > 0 && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {files.map((uploadedFile) => (
              <div key={uploadedFile.id} className="flex items-center gap-4 p-4">
                {getFileIcon(uploadedFile.status)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{uploadedFile.file.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                    {uploadedFile.error && <p className="text-xs text-destructive">{uploadedFile.error}</p>}
                    {uploadedFile.documentId && (
                      <p className="font-mono text-xs text-muted-foreground">
                        ID: {uploadedFile.documentId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                  {uploadedFile.status === "uploading" && (
                    <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(uploadedFile.id)}
                  disabled={uploadedFile.status === "uploading"}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
