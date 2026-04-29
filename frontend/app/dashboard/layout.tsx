"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { ChatbotWidget } from "@/components/ChatbotWidget"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, roles, isLoaded } = useAuth()
  const hasDashboardAccess =
    Boolean(user) &&
    (roles.includes("admin") ||
      roles.includes("supplier_admin") ||
      roles.includes("supplier") ||
      roles.includes("pharmacy_admin") ||
      roles.includes("pharmacy"))

  useEffect(() => {
    if (isLoaded && !hasDashboardAccess) {
      router.replace("/")
    }
  }, [isLoaded, hasDashboardAccess, router])

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasDashboardAccess) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col min-h-screen overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
      <ChatbotWidget />
    </SidebarProvider>
  )
}
