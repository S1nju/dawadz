"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/NotificationBell"

export function DashboardHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-3 md:px-6 shrink-0">
      {/* Always-visible sidebar toggle (works on mobile too) */}
      <SidebarTrigger className="shrink-0" />

      <div className="flex flex-1 items-center justify-end gap-2">
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
