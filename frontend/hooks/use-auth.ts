"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import axiosClient from "@/lib/axios-client"
import { clearAuthToken, getAuthTokenAsync, setAuthToken } from "@/lib/auth-token"

type Role = { name: string }

type Pharmacy = {
  id: number
  name: string
  city: string
  address: string
  latitude: number
  longitude: number
}

type AuthUser = {
  id: number
  name: string
  email: string
  avatar_url?: string | null
  roles?: Role[]
  pharmacy?: Pharmacy | null
}

type AuthResponse = {
  token: string
  token_type: string
  user: AuthUser
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = await getAuthTokenAsync()

    if (!token) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const { data } = await axiosClient.get<AuthUser>("/auth/me")
      setUser(data)
      return data
    } catch {
      clearAuthToken()
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const { data } = await axiosClient.post<AuthResponse>("/auth/login", payload)
    await setAuthToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; password_confirmation: string }) => {
      const { data } = await axiosClient.post<AuthResponse>("/auth/register", payload)
      await setAuthToken(data.token)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const signOut = useCallback(async () => {
    try {
      await axiosClient.post("/auth/logout")
    } catch {
      // Clear local auth state even if API token is already invalid.
    }

    clearAuthToken()
    setUser(null)
  }, [])

  const getToken = useCallback(async () => getAuthTokenAsync(), [])

  const roles = useMemo(() => {
    if (user?.roles) return user.roles.map((role) => role.name.toLowerCase())

    return []
  }, [user])

  return {
    user,
    roles,
    isLoaded: !loading,
    isSignedIn: Boolean(user),
    getToken,
    login,
    register,
    refreshUser: fetchMe,
    signOut,
  }
}
