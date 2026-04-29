"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Building2, MapPin, LayoutDashboard } from "lucide-react"
import { JoinRequestSheet } from "./JoinRequestSheet"
import { Separator } from "@/components/ui/separator"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user, isLoaded, isSignedIn, signOut, roles } = useAuth()
  const router = useRouter()

  if (!isOpen) return null

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const hasRole =
    roles.includes("admin") ||
    roles.includes("supplier_admin") ||
    roles.includes("supplier") ||
    roles.includes("pharmacy_admin") ||
    roles.includes("pharmacy")

  const handleLogout = async () => {
    await signOut()
    onClose()
    router.push("/login")
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border shadow-lg overflow-y-auto transition-all duration-500 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* User Info Section */}
          {isLoaded && isSignedIn && user && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary/10">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {user.roles && user.roles.length > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {user.roles.map((r) => r.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 space-y-3">
            {/* Join as Supplier / Pharmacy - only for signed-in users without role */}
            {isLoaded && isSignedIn && !hasRole && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Get Started
                </p>
                <JoinRequestSheet triggerClassName="flex w-full justify-start rounded-lg px-3 border-primary/20 hover:border-primary/50 text-foreground" />
              </div>
            )}

            {/* Dashboard button - for users with role */}
            {isLoaded && isSignedIn && hasRole && (
              <Button
                className="w-full justify-start"
                asChild
                onClick={onClose}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logout Button - only for signed in users */}
          {isLoaded && isSignedIn && (
            <div className="p-6 space-y-3 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}

          {/* Sign Up button - only for not signed in */}
          {isLoaded && !isSignedIn && (
            <div className="p-6 space-y-3 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                asChild
                onClick={onClose}
              >
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
