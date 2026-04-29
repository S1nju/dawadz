const TOKEN_KEY = "auth_token"

const isNativeCapacitor = () => {
  if (typeof window === "undefined") return false
  const cap = (window as any).Capacitor
  return Boolean(cap?.isNativePlatform?.())
}

const getApiOrigins = () => {
  if (typeof window === "undefined") return [] as string[]

  const origins = new Set<string>()

  const configured =
    process.env.NEXT_PUBLIC_CAPACITOR_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL

  const addOrigin = (value?: string) => {
    if (!value || !/^https?:\/\//i.test(value)) {
      return
    }

    try {
      origins.add(new URL(value).origin)
    } catch {
      // Ignore malformed URL values.
    }
  }

  if (isNativeCapacitor()) {
    addOrigin(configured)
    return Array.from(origins)
  }

  origins.add(window.location.origin)
  addOrigin(configured)

  return Array.from(origins)
}

const setNativeCookies = async (token: string) => {
  try {
    const { CapacitorCookies } = await import("@capacitor/core")
    const origins = getApiOrigins()

    await Promise.all(
      origins.map((url) =>
        CapacitorCookies.setCookie({
          url,
          key: TOKEN_KEY,
          value: token,
          path: "/",
          expires: (60 * 60 * 24 * 30).toString(),
        }),
      ),
    )
  } catch {
    // Keep localStorage as source of truth if cookie bridge is unavailable.
  }
}

const clearNativeCookies = async () => {
  try {
    const { CapacitorCookies } = await import("@capacitor/core")
    const origins = getApiOrigins()

    await Promise.all(
      origins.map((url) =>
        CapacitorCookies.deleteCookie({
          url,
          key: TOKEN_KEY,
        }),
      ),
    )
  } catch {
    // Ignore cleanup failures.
  }
}

const getNativeCookies = async (): Promise<string | null> => {
  try {
    const { CapacitorCookies } = await import("@capacitor/core")
    const origins = getApiOrigins()

    for (const url of origins) {
      const result = await CapacitorCookies.getCookies({
        url,
      })
      let tokenFromMap: string | undefined

      if (typeof result?.cookies === "string") {
        const tokenPair = result.cookies
          .split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${TOKEN_KEY}=`))
        tokenFromMap = tokenPair ? tokenPair.slice(TOKEN_KEY.length + 1) : undefined
      } else if (result?.cookies && typeof result.cookies === "object") {
        tokenFromMap = (result.cookies as Record<string, string>)[TOKEN_KEY]
      }

      if (typeof tokenFromMap === "string" && tokenFromMap.length > 0) {
        return tokenFromMap
      }
    }
    return null
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const localToken = localStorage.getItem(TOKEN_KEY)
  return localToken || null
}

export async function getAuthTokenAsync(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  if (isNativeCapacitor()) {
    const nativeToken = await getNativeCookies()
    if (nativeToken) {
      return nativeToken
    }
  }

  return localStorage.getItem(TOKEN_KEY)
}

export async function setAuthToken(token: string): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; samesite=lax`

  if (isNativeCapacitor()) {
    await setNativeCookies(token)
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`

  if (isNativeCapacitor()) {
    void clearNativeCookies()
  }
}
