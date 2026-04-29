import { useState, useCallback, useEffect } from 'react'
import { useEcho } from './use-echo'
import axiosClient from '@/lib/axios-client'
import { normalizeAttachmentUrl } from '@/lib/attachment-url'

export type PendingUserRequest = {
  requestId: string
  medicationName: string
  city: string
  created_at: string
  attachmentImage?: string
}

export type AcceptedUserRequest = {
  requestId: string
  pharmacyName: string
  acceptedAt: string
  attachmentImage?: string
  pharmacy?: {
    id?: number
    name: string
    lat?: number
    lng?: number
    address?: string
    city?: string
  }
}

type StoredNotification = {
  id: number
  type: string
  message: string
  created_at: string
}

const parseNotificationMessage = (message: string): any | null => {
  try {
    return JSON.parse(message)
  } catch {
    return null
  }
}

const STORAGE_KEY = 'medication-request-state'
const DISMISSED_ACCEPTED_KEY = 'medication-request-dismissed-accepted-ids'

const readDismissedAcceptedIds = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(DISMISSED_ACCEPTED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : []
  } catch {
    return []
  }
}

const writeDismissedAcceptedIds = (ids: string[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DISMISSED_ACCEPTED_KEY, JSON.stringify(ids))
  } catch {
    // Ignore storage write failures.
  }
}

export function useMedicationRequests() {
  const echo = useEcho()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] = useState<PendingUserRequest | null>(null)
  const [acceptedRequest, setAcceptedRequest] = useState<AcceptedUserRequest | null>(null)

  const applyAcceptedPayload = useCallback((data: any, fallbackRequestId?: string) => {
    console.log('[MedicationRequests] applyAcceptedPayload called with:', {
      data,
      fallbackRequestId,
    })
    
    const requestId = String(data?.request_id ?? fallbackRequestId ?? '')
    const pharmacyName = String(data?.pharmacy_name ?? data?.pharmacy?.name ?? 'Pharmacy')
    const acceptedAt = String(data?.accepted_at ?? new Date().toISOString())

    const processedData = {
      requestId,
      pharmacyName,
      acceptedAt,
      attachmentImage: normalizeAttachmentUrl(data?.attachment_image),
      pharmacy: data?.pharmacy
        ? {
            id: Number(data.pharmacy.id ?? 0) || undefined,
            name: String(data.pharmacy.name ?? pharmacyName),
            lat: data.pharmacy.latitude != null
              ? Number(data.pharmacy.latitude)
              : data.pharmacy.lat != null
                ? Number(data.pharmacy.lat)
                : undefined,
            lng: data.pharmacy.longitude != null
              ? Number(data.pharmacy.longitude)
              : data.pharmacy.lng != null
                ? Number(data.pharmacy.lng)
                : undefined,
            address: data.pharmacy.address ? String(data.pharmacy.address) : undefined,
            city: data.pharmacy.city ? String(data.pharmacy.city) : undefined,
          }
        : undefined,
    }

    console.log('[MedicationRequests] Setting acceptedRequest state:', processedData)

    setAcceptedRequest(processedData)
    setPendingRequest(null)
  }, [])

  const syncRequestStateFromNotifications = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/notifications', {
        params: {
          type: 'medication_request_status',
          per_page: 30,
        },
      })

      const items: StoredNotification[] = Array.isArray(data?.data) ? data.data : []
      if (!items.length) return

      const parsed = items
        .map((item) => ({ raw: item, parsed: parseNotificationMessage(item.message) }))
        .filter((item) => item.parsed && item.parsed.request_id)

      if (!parsed.length) return

      const latest = parsed[0]
      const payload = latest.parsed

      if (payload.status === 'accepted') {
        const dismissedIds = readDismissedAcceptedIds()
        if (dismissedIds.includes(String(payload.request_id))) {
          setPendingRequest(null)
          setAcceptedRequest(null)
          return
        }

        setPendingRequest(null)
        setAcceptedRequest({
          requestId: String(payload.request_id),
          pharmacyName: String(payload.pharmacy_name ?? 'Pharmacy'),
          acceptedAt: String(payload.accepted_at ?? latest.raw.created_at),
          attachmentImage: normalizeAttachmentUrl(payload.attachment_image),
          pharmacy: payload.pharmacy
            ? {
                id: Number(payload.pharmacy.id ?? 0) || undefined,
                name: String(payload.pharmacy.name ?? payload.pharmacy_name ?? 'Pharmacy'),
                lat: payload.pharmacy.lat != null ? Number(payload.pharmacy.lat) : undefined,
                lng: payload.pharmacy.lng != null ? Number(payload.pharmacy.lng) : undefined,
                address: payload.pharmacy.address ? String(payload.pharmacy.address) : undefined,
                city: payload.pharmacy.city ? String(payload.pharmacy.city) : undefined,
              }
            : undefined,
        })
        return
      }

      if (payload.status === 'pending') {
        setAcceptedRequest(null)
        setPendingRequest({
          requestId: String(payload.request_id),
          medicationName: String(payload.medication_name ?? 'Medication'),
          city: String(payload.city ?? ''),
          created_at: String(payload.created_at ?? latest.raw.created_at),
          attachmentImage: normalizeAttachmentUrl(payload.attachment_image),
        })
        return
      }

      if (payload.status === 'canceled') {
        setAcceptedRequest(null)
        setPendingRequest(null)
      }
    } catch {
      // Keep UI functional even if notifications cannot be loaded.
    }
  }, [])

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (parsed?.pendingRequest) {
        setPendingRequest(parsed.pendingRequest)
      }
      if (parsed?.acceptedRequest) {
        setAcceptedRequest(parsed.acceptedRequest)
      }
    } catch {
      // Ignore broken local storage payload.
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pendingRequest,
          acceptedRequest,
        })
      )
    } catch {
      // Ignore storage write failures.
    }
  }, [pendingRequest, acceptedRequest])

  useEffect(() => {
    let cancelled = false

    void syncRequestStateFromNotifications()

    return () => {
      cancelled = true
    }
  }, [syncRequestStateFromNotifications])

  useEffect(() => {
    if (!pendingRequest?.requestId) return

    let cancelled = false
    const interval = window.setInterval(() => {
      if (cancelled) return
      void syncRequestStateFromNotifications()
    }, 8000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pendingRequest?.requestId, syncRequestStateFromNotifications])

  useEffect(() => {
    if (!echo || !pendingRequest?.requestId) {
      if (!echo) console.log('[MedicationRequests] Echo not ready yet')
      if (pendingRequest?.requestId) console.log('[MedicationRequests] No pending request to listen for')
      return
    }

    const channelName = `user-notifications.${pendingRequest.requestId}`
    console.log('[MedicationRequests] Setting up user request listener', {
      channelName,
      requestId: pendingRequest.requestId,
    })
    const requestChannel = echo.channel(channelName)

    const onAccepted = (data: any) => {
      console.log('[MedicationRequests] Received request.accepted event:', {
        data,
        requestId: pendingRequest.requestId,
      })
      applyAcceptedPayload(data, pendingRequest.requestId)
    }

    console.log('[MedicationRequests] Attaching listeners for both dot and non-dot event names')
    requestChannel.listen('.request.accepted', onAccepted)
    // Compatibility: some Echo setups deliver custom names without the leading dot.
    requestChannel.listen('request.accepted', onAccepted)

    return () => {
      console.log('[MedicationRequests] Cleaning up user request listener', { requestId: pendingRequest.requestId })
      requestChannel.stopListening('.request.accepted')
      requestChannel.stopListening('request.accepted')
    }
  }, [echo, pendingRequest, applyAcceptedPayload])

  const sendRequest = useCallback(
    async (medicationName: string, city: string, attachmentFile?: File | null) => {
      console.log('[MedicationRequests] Sending request:', { medicationName, city, hasAttachment: Boolean(attachmentFile) })
      setLoading(true)
      setError(null)
      try {
        const form = new FormData()
        form.append('medication_name', medicationName)
        form.append('city', city)
        if (attachmentFile) {
          form.append('attachment_image', attachmentFile)
        }

        const response = await axiosClient.post('/medication-requests', form)
        const requestId = String(response.data?.request_id ?? '')
        const attachmentImage = normalizeAttachmentUrl(response.data?.attachment_image)
        console.log('[MedicationRequests] Request sent successfully:', { requestId })
        if (requestId) {
          setAcceptedRequest(null)
          setPendingRequest({
            requestId,
            medicationName,
            city,
            created_at: new Date().toISOString(),
            attachmentImage,
          })
        }
        return response.data
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to send request'
        console.error('[MedicationRequests] Failed to send request:', message)
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const acceptRequest = useCallback(
    async (requestId: number | string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await axiosClient.post('/accepte-request', {
          request_id: String(requestId),
        })
        return response.data
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to accept request'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const cancelRequest = useCallback(
    async (requestId: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await axiosClient.post('/medication-requests/cancel', {
          request_id: String(requestId),
        })
        setPendingRequest(null)
        setAcceptedRequest(null)
        return response.data
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to cancel request'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const dismissAcceptedRequest = useCallback((requestId?: string) => {
    if (requestId) {
      const ids = readDismissedAcceptedIds()
      if (!ids.includes(requestId)) {
        writeDismissedAcceptedIds([...ids, requestId])
      }
    }

    setPendingRequest(null)
    setAcceptedRequest(null)
  }, [])

  return {
    loading,
    error,
    pendingRequest,
    acceptedRequest,
    sendRequest,
    acceptRequest,
    cancelRequest,
    dismissAcceptedRequest,
  }
}
