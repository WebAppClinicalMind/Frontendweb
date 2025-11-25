"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Copy, Check, FileText, Clock, Sparkles, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"
import type { QAResponse, Citation } from "@/lib/api/types"
import Link from "next/link"

export default function QAPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<QAResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResponse(null)

    try {
      const result = await apiClient.submitQuery(query.trim())
      setResponse(result)
    } catch (error) {
      toast.error("Failed to get answer", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [query])

  const exampleQuestions = [
    "What medications were prescribed to the patient?",
    "What are the main diagnoses mentioned?",
    "Are there any allergies documented?",
    "What laboratory values are abnormal?",
  ]

  return (
    <AppLayout title="Ask a Question" description="Get AI-powered answers from your medical documents">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Your Question
            </CardTitle>
            <CardDescription>Enter a question about your uploaded medical documents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your question here... (e.g., What medications are prescribed?)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[120px] resize-none pr-12 text-base"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmit(e)
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3">
                  <Button type="submit" size="icon" disabled={!query.trim() || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Submit question</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Cmd</kbd>
                  {" + "}
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd>
                  {" to submit"}
                </p>
                {query.length > 0 && (
                  <p className="text-xs text-muted-foreground">{query.length.toLocaleString()} characters</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Example Questions */}
        {!response && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(question)}
                    className="text-left h-auto py-2"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="h-16 w-16 animate-pulse rounded-full bg-primary/20" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium">Analyzing documents...</p>
              <p className="text-sm text-muted-foreground">This may take up to 60 seconds for complex queries</p>
            </CardContent>
          </Card>
        )}

        {/* Answer Response */}
        {response && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Answer</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {response.generation_time_ms}ms
                      </span>
                      <span>Model: {response.model_used}</span>
                      {response.token_count && <span>{response.token_count} tokens</span>}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(response.answer)}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">{response.answer}</p>
                </div>
              </CardContent>
            </Card>

            {/* Citations */}
            {response.citations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Source Citations
                  </CardTitle>
                  <CardDescription>
                    {response.citations.length} relevant document
                    {response.citations.length !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {response.citations.map((citation, index) => (
                      <CitationCard key={index} citation={citation} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
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
              <div className="mt-2">
                <p className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-3" : ""}`}>
                  {citation.chunk_text}
                </p>
                {citation.chunk_text.length > 200 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </Button>
                )}
              </div>
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
    </div>
  )
}
