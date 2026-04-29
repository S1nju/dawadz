"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Menu, X, LogOut } from "lucide-react"
import { JoinRequestSheet } from "./JoinRequestSheet"
import { useAuth } from "@/hooks/use-auth"

interface NavbarProps {
    onMenuClick?: () => void;
    isMenuOpen?: boolean;
}

export function Navbar({ onMenuClick, isMenuOpen }: NavbarProps = {}) {
    const { isSignedIn, isLoaded, roles, signOut } = useAuth()
    const router = useRouter()

    const hasRole =
        roles.includes("admin") ||
        roles.includes("supplier_admin") ||
        roles.includes("supplier") ||
        roles.includes("pharmacy_admin") ||
        roles.includes("pharmacy")

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container px-4 md:px-6 flex h-14 items-center justify-between">
                <div className="flex items-center gap-6 md:gap-10">
                    <Link href="/" className="flex items-center gap-1.5 whitespace-nowrap">
                        <img src="/logo.png" alt="DawaDZ" className="h-11 w-auto object-contain" />
                        <p className="text-lg font-bold leading-none sm:text-xl">DawaDz</p>
                    </Link>
                  
                </div>

                <div className="flex items-center gap-2">
                    {/* Join button — only for signed-in users with no role yet */}
                    {isLoaded && isSignedIn && !hasRole && <JoinRequestSheet />}

                    {/* Dashboard button — for users with a role */}
                    {isLoaded && isSignedIn && hasRole && (
                        <Button variant="outline" size="sm" className="hidden sm:flex rounded-full px-4 border-primary/20 hover:border-primary/50" asChild>
                            <Link href="/dashboard">
                                <LayoutDashboard className="mr-2 size-4 text-primary" />
                                Dashboard
                            </Link>
                        </Button>
                    )}

                    {/* Logout button — any signed-in user */}
                    {isLoaded && isSignedIn && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden sm:flex rounded-full px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                                signOut()
                                router.push("/login")
                            }}
                        >
                            <LogOut className="size-4 mr-1.5" />
                            Logout
                        </Button>
                    )}

                    {onMenuClick && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-full hover:bg-muted/80 bg-background/50 backdrop-blur-md"
                            onClick={onMenuClick}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
