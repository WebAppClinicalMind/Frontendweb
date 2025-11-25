import type React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AppLayout({ children, title, description }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header title={title} description={description} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
