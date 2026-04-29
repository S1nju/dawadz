import axios from "axios"
import { clearAuthToken, getAuthToken, getAuthTokenAsync } from "@/lib/auth-token"

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const isCapacitorRuntime = () => {
  if (typeof window === "undefined") return false
  const maybeCapacitor = (window as any).Capacitor
  if (!maybeCapacitor) return false
  if (typeof maybeCapacitor.isNativePlatform === "function") {
    return Boolean(maybeCapacitor.isNativePlatform())
  }
  return true
}

const resolveApiBaseUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL

  if (isCapacitorRuntime()) {
    const mobileConfigured =
      process.env.NEXT_PUBLIC_CAPACITOR_API_BASE_URL ||
      process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL

    if (mobileConfigured) {
      return mobileConfigured
    }

    if (configured && isAbsoluteUrl(configured)) {
      return configured
    }

    // Android emulator fallback for local backend when mobile URL is not configured.
    return "https://ee77-105-235-139-110.ngrok-free.app/api"
  }

  if (configured) {
    return configured
  }

  return "/proxy-api"
}

const axiosClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token (client-side)
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthTokenAsync()

    const isFormDataPayload = typeof FormData !== "undefined" && config.data instanceof FormData

    if (isFormDataPayload && config.headers) {
      // Let the browser set multipart boundary automatically.
      delete config.headers["Content-Type"]
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearAuthToken()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default axiosClient
