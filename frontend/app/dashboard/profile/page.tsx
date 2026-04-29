"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { AxiosError } from "axios"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import axiosClient from "@/lib/axios-client"

interface UserProfile {
  name: string
  email: string
  avatarUrl: string
  role: string
}

export default function ProfilePage() {
  const { user, isLoaded, refreshUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    avatarUrl: "",
    role: "",
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        avatarUrl: user.avatar_url || "",
        role: user.roles?.[0]?.name || "user",
      })
    }
    setSelectedAvatar(null)
    setAvatarPreview(null)
  }, [user])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const initials = useMemo(() => {
    if (!profile.name) {
      return "U"
    }

    return profile.name
      .split(" ")
      .map((namePart) => namePart[0])
      .join("")
      .toUpperCase()
  }, [profile.name])

  const displayAvatar = avatarPreview || profile.avatarUrl || "/placeholder.svg"

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image that is 2 MB or smaller.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }

    setSelectedAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAvatar) {
      toast({
        title: "Choose an image",
        description: "Pick a new profile picture before saving.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", selectedAvatar)

      const { data } = await axiosClient.post("/auth/avatar", formData)

      setProfile({
        name: data.name || "",
        email: data.email || "",
        avatarUrl: data.avatar_url || "",
        role: data.roles?.[0]?.name || "user",
      })
      setSelectedAvatar(null)

      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarPreview(null)

      await refreshUser()

      toast({
        title: "Profile photo updated",
        description: "Your new profile picture is now live.",
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
      const fieldMessage = axiosError.response?.data?.errors?.avatar?.[0]
      const message = fieldMessage || axiosError.response?.data?.message || "Failed to update your profile photo. Please try again."

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Update your profile picture and account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a new avatar to use across the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarImage src={displayAvatar} alt={profile.name || "User"} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Choose a new profile picture</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 2 MB.</p>
                {selectedAvatar ? <p className="mt-1 text-xs text-muted-foreground">Selected: {selectedAvatar.name}</p> : null}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarPick}
            />

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose image
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Save photo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Read-only information from your signed-in account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{profile.name || "User"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">{profile.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
