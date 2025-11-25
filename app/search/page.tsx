"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, ExternalLink, Clock } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"
import type { SearchResponse, SearchResult } from "@/lib/api/types"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [topK, setTopK] = useState(5)
  const [minScore, setMinScore] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setResults(null)

    try {
      const response = await apiClient.search(query.trim(), topK, minScore > 0 ? minScore : undefined)
      setResults(response)
    } catch (error) {
      toast.error("Search failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <AppLayout title="Semantic Search" description="Search across your indexed documents">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Documents
            </CardTitle>
            <CardDescription>Find relevant content across all your indexed medical documents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  placeholder="e.g., patient diagnosis hypertension"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Number of Results</Label>
                    <span className="text-sm font-medium">{topK}</span>
                  </div>
                  <Slider
                    value={[topK]}
                    onValueChange={([value]) => setTopK(value)}
                    min={1}
                    max={20}
                    step={1}
                    disabled={isSearching}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Minimum Score</Label>
                    <span className="text-sm font-medium">{(minScore * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[minScore]}
                    onValueChange={([value]) => setMinScore(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    disabled={isSearching}
                  />
                </div>
              </div>

              <Button type="submit" disabled={!query.trim() || isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {results && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-4">
                    <span>{results.total_results} results found</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {results.processing_time_ms}ms
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {results.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2" />
                  <p>No results found</p>
                  <p className="text-sm">Try adjusting your search query or parameters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.results.map((result, index) => (
                    <SearchResultCard key={result.chunk_id} result={result} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

function SearchResultCard({ result, index }: { result: SearchResult; index: number }) {
  const scorePercentage = (result.similarity_score * 100).toFixed(1)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {result.document_id.slice(0, 8)}...
              </code>
              <Badge variant="outline" className="text-xs">
                Chunk #{result.chunk_position}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.chunk_text}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{scorePercentage}%</p>
            <p className="text-xs text-muted-foreground">Similarity</p>
          </div>
          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${scorePercentage}%` }} />
          </div>
          <Link href={`/documents/${result.document_id}`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
