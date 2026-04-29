"use client"

import { useState, useEffect, useCallback } from 'react'
import { useEcho } from './use-echo'
import axiosClient from '@/lib/axios-client'
import { normalizeAttachmentUrl } from '@/lib/attachment-url'

export type PayloadRequest = {
  request_id: string
  user_name: string
  medication: string
  city: string
  created_at: string
  attachment_image?: string
  status?: 'pending' | 'accepted' | 'canceled'
  accepted_at?: string
  canceled_at?: string
}

const slugifyCity = (city: string): string => {
  return city.trim().toLowerCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
}

const legacySlugifyCity = (city: string): string => {
  return city.toLowerCase().replace(/\s+/g, '-')
}

export function usePharmacyRequests(pharmacyCity?: string) {
  const echo = useEcho()
  const [requests, setRequests] = useState<PayloadRequest[]>([])
  const [loading, setLoading] = useState(false)

  const syncFromNotifications = useCallback(async () => {
    if (!pharmacyCity) {
      setRequests([])
      return
    }

    try {
      const { data } = await axiosClient.get('/notifications', {
        params: {
          type: 'medication_request_incoming',
          per_page: 100,
        },
      })

      const items: any[] = Array.isArray(data?.data) ? data.data : []
      const merged = new Map<string, PayloadRequest>()

      items.forEach((item) => {
        let payload: any = null
        try {
          payload = JSON.parse(item.message)
        } catch {
          payload = null
        }

        if (!payload?.request_id) return

        const next: PayloadRequest = {
          request_id: String(payload.request_id),
          user_name: String(payload.user_name ?? merged.get(String(payload.request_id))?.user_name ?? 'Unknown user'),
          medication: String(payload.medication ?? merged.get(String(payload.request_id))?.medication ?? 'Unknown medication'),
          city: String(payload.city ?? pharmacyCity),
          created_at: String(payload.created_at ?? item.created_at ?? new Date().toISOString()),
          attachment_image: normalizeAttachmentUrl(payload.attachment_image),
          status: payload.status === 'accepted' ? 'accepted' : payload.status === 'canceled' ? 'canceled' : 'pending',
          accepted_at: payload.accepted_at ? String(payload.accepted_at) : undefined,
          canceled_at: payload.canceled_at ? String(payload.canceled_at) : undefined,
        }

        const previous = merged.get(next.request_id)
        if (!previous) {
          merged.set(next.request_id, next)
          return
        }

        if (next.status === 'accepted' || next.status === 'canceled' || previous.status === 'pending') {
          merged.set(next.request_id, { ...previous, ...next })
        }
      })

      const sorted = Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRequests(sorted)
    } catch {
      // Keep realtime-only mode if API history fails.
    }
  }, [pharmacyCity])

  useEffect(() => {
    let cancelled = false

    const runSync = async () => {
      if (cancelled) return
      await syncFromNotifications()
    }

    void runSync()

    const interval = window.setInterval(() => {
      if (cancelled) return
      void runSync()
    }, 7000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runSync()
      }
    }

    window.addEventListener('focus', onVisibility)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', onVisibility)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [syncFromNotifications])

  useEffect(() => {
    if (!pharmacyCity) {
      setRequests([])
      return
    }

    // Keep DB-hydrated history visible even if realtime transport isn't ready.
    if (!echo) {
      console.log('[PharmacyRequests] Echo not ready yet for city:', pharmacyCity)
      return
    }

    console.log('[PharmacyRequests] Setting up listeners for city:', pharmacyCity)
    setLoading(true)
    const citySlugs = Array.from(new Set([
      slugifyCity(pharmacyCity),
      legacySlugifyCity(pharmacyCity),
    ])).filter(Boolean)

    console.log('[PharmacyRequests] Subscribing to channels:', citySlugs.map(slug => `pharmacy-requests.${slug}`))

    // Listen for incoming medication requests on all compatible city-specific channels.
    const channels = citySlugs.map((slug) => echo.channel(`pharmacy-requests.${slug}`))
    
    const handleRequest = (data: any) => {
      console.log('[PharmacyRequests] Received medication.requested event:', data)
      const payload = data?.requestData ?? data ?? {}
      const normalized: PayloadRequest = {
        request_id: String(payload.request_id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        user_name: String(payload.user_name ?? 'Unknown user'),
        medication: String(payload.medication ?? payload.medication_name ?? 'Unknown medication'),
        city: String(payload.city ?? pharmacyCity),
        created_at: String(payload.created_at ?? new Date().toISOString()),
        attachment_image: normalizeAttachmentUrl(payload.attachment_image),
        status: 'pending',
      }

      setRequests((prev) => {
        const withoutCurrent = prev.filter((item) => item.request_id !== normalized.request_id)
        return [normalized, ...withoutCurrent]
      })
    }

    const handleCanceledRequest = (data: any) => {
      console.log('[PharmacyRequests] Received request.canceled event:', data)
      const payload = data ?? {}
      const requestId = String(payload.request_id ?? '')
      if (!requestId) return

      setRequests((prev) =>
        prev.map((item) =>
          item.request_id === requestId
            ? {
                ...item,
                status: 'canceled',
                canceled_at: String(payload.canceled_at ?? new Date().toISOString()),
              }
            : item
        )
      )
    }

    // For Laravel broadcastAs(), Echo listens with a leading dot.
    channels.forEach((channel) => {
      console.log('[PharmacyRequests] Attaching listeners to channel:', channel.name)
      channel.listen('.medication.requested', handleRequest)
      channel.listen('medication.requested', handleRequest)
      channel.listen('.request.canceled', handleCanceledRequest)
      channel.listen('request.canceled', handleCanceledRequest)
    })

    setLoading(false)

    return () => {
      console.log('[PharmacyRequests] Cleaning up channels for city:', pharmacyCity)
      channels.forEach((channel) => {
        channel.stopListening('.medication.requested')
        channel.stopListening('medication.requested')
        channel.stopListening('.request.canceled')
        channel.stopListening('request.canceled')
      })
    }
  }, [echo, pharmacyCity])

  const clearRequests = () => setRequests([])
  const markAccepted = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId
          ? { ...r, status: 'accepted', accepted_at: new Date().toISOString() }
          : r
      )
    )
  }

  return {
    requests,
    loading,
    clearRequests,
    markAccepted,
  }
}
