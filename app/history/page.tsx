"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Search, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Loader2, Trash2 } from "lucide-react"
import apiClient from "@/lib/api/client"
import type { QueryHistoryResponse } from "@/lib/api/types"

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState("")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const { toast } = useToast()

  const {
    data,
    isLoading,
    error,
    mutate: refreshHistory,
  } = useSWR<QueryHistoryResponse>(["query-history", page, pageSize], () => apiClient.getQueryHistory(page, pageSize), {
    revalidateOnFocus: false,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleClearHistory = async () => {
    setIsClearing(true)
    try {
      const result = await apiClient.clearQueryHistory()
      toast({
        title: "History cleared",
        description: `Successfully deleted ${result.deleted_count} ${result.deleted_count === 1 ? "query" : "queries"}.`,
      })
      setPage(1)
      refreshHistory()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear query history",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
      setClearDialogOpen(false)
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0

  const filteredQueries =
    data?.queries.filter((q) => q.query_text.toLowerCase().includes(searchQuery.toLowerCase())) ?? []

  return (
    <AppLayout title="Query History" description="View your past questions and answers">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Queries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.total ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {page} / {totalPages || 1}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Page Size</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Query List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Query History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                disabled={isClearing || !data || data.total === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>Failed to load query history</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Question</TableHead>
                        <TableHead>Answer Preview</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No queries found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQueries.map((query) => (
                          <TableRow key={query.query_id}>
                            <TableCell>
                              <p className="font-medium line-clamp-2">{query.query_text}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <p className="line-clamp-2">{query.response_preview ?? "—"}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {formatDate(query.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Link href={`/history/${query.query_id}`}>
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

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data?.total ?? 0)} of{" "}
                    {data?.total ?? 0} queries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="sr-only">First page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                      <span className="sr-only">Last page</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Query History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all query history? This will permanently delete all {data?.total ?? 0}{" "}
              {data?.total === 1 ? "query" : "queries"} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
