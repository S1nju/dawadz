import axios from "axios"

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const resolveBaseUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL

  if (configured) {
    return configured
  }

  if (typeof window !== "undefined" && isAbsoluteUrl(window.location.origin)) {
    return "/proxy-api"
  }

  return "/proxy-api"
}

const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => config,
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on 401 - only in browser
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
