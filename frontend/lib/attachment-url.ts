export const normalizeAttachmentUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined

  const raw = String(value).trim()
  if (!raw) return undefined

  if (raw.startsWith('/proxy-api/')) return raw

  if (raw.startsWith('/api/')) {
    return raw.replace(/^\/api\//, '/proxy-api/')
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      const apiPrefix = '/api/'
      const apiIndex = parsed.pathname.indexOf(apiPrefix)

      if (apiIndex >= 0) {
        const apiPath = parsed.pathname.slice(apiIndex + apiPrefix.length)
        return `/proxy-api/${apiPath}${parsed.search}`
      }
    } catch {
      return raw
    }
  }

  return raw
}