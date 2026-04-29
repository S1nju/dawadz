"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChartIcon, UsersIcon, ActivityIcon, TrendingUpIcon } from "lucide-react"

const stats = [
  {
    title: "Total Users",
    value: "2,543",
    change: "+12.5%",
    icon: UsersIcon,
  },
  {
    title: "Active Sessions",
    value: "1,234",
    change: "+8.2%",
    icon: ActivityIcon,
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+23.1%",
    icon: TrendingUpIcon,
  },
  {
    title: "Performance",
    value: "98.2%",
    change: "+2.4%",
    icon: BarChartIcon,
  },
]

export default function DashboardPage() {
  const { roles, isLoaded } = useAuth()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    if (roles.includes("admin")) {
      router.replace("/dashboard/admin")
    } else if (roles.includes("pharmacy_admin") || roles.includes("pharmacy")) {
      router.replace("/dashboard/pharmacy")
    } else if (roles.includes("supplier_admin") || roles.includes("supplier")) {
      router.replace("/dashboard/supplier")
    } else {
      setShouldRedirect(false)
    }
  }, [roles, isLoaded, router])

  if (shouldRedirect || !isLoaded) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Checking authorization...</span>
      </div>
    )
  }

  // Render original default dashboard if no specific role
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your application.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="size-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Activity item {i}</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["API Calls", "Storage Used", "Bandwidth", "Requests"].map((item, i) => (
                <div key={item} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item}</span>
                  <span className="text-sm font-medium">{85 - i * 10}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
