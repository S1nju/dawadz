"use client"

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/Navbar"
import { MobileSidebar } from "@/components/MobileSidebar"
import { Input } from "@/components/ui/input"
import { Search, Info, MapPin, Loader2, Pill, CircleCheckBig, Clock3, Paperclip, X, Navigation, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import axiosClient from "@/lib/axios-client"
import { ChatbotWidget } from "@/components/ChatbotWidget"
import { MedicationRequestPharmacyCard } from "@/components/MedicationRequestPharmacyCard"
import { useMedicationRequests } from "@/hooks/use-medication-requests"
import { useToast } from "@/hooks/use-toast"

const HOME_UI_STORAGE_KEY = "home-request-map-state"

// Dynamically import the map to avoid SSR issues with Leaflet
const PharmacyMap = dynamic(() => import("@/components/PharmacyMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/20 border rounded-md min-h-[400px]">Loading Map...</div>
})

import type { Pharmacy } from "@/components/PharmacyMap"

type RouteStep = {
  instruction: string
  distanceKm: number
  durationMin: number
  lat: number
  lng: number
}

const normalizeHeading = (heading?: number | null): number | null => {
  if (typeof heading !== "number" || Number.isNaN(heading) || !Number.isFinite(heading)) {
    return null
  }

  const normalized = ((heading % 360) + 360) % 360
  return Number.isFinite(normalized) ? normalized : null
}

const calculateBearing = (from: [number, number], to: [number, number]): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const [fromLat, fromLng] = from
  const [toLat, toLng] = to
  const lat1 = toRad(fromLat)
  const lat2 = toRad(toLat)
  const dLon = toRad(toLng - fromLng)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360
}

const toKm = (meters: number) => Math.max(0, meters / 1000)
const toMin = (seconds: number) => Math.max(0, seconds / 60)

const buildStepInstruction = (step: any): string => {
  const maneuver = step?.maneuver ?? {}
  const type = String(maneuver?.type ?? "continue")
  const modifier = String(maneuver?.modifier ?? "")
  const roadName = String(step?.name ?? "").trim()
  const direction = modifier ? ` ${modifier}` : ""
  const onRoad = roadName ? ` on ${roadName}` : ""

  if (type === "arrive") return "You have arrived at destination"
  if (type === "depart") return `Head${direction}${onRoad}`
  if (type === "turn") return `Turn${direction}${onRoad}`
  if (type === "new name") return `Continue${onRoad}`
  if (type === "roundabout") return `Enter roundabout${onRoad}`
  if (type === "end of road") return `At end of road, turn${direction}${onRoad}`
  return `Continue${direction}${onRoad}`
}

// Map API pharmacy response to our Pharmacy type
function mapApiPharmacy(p: any): Pharmacy {
  const parseCoordinate = (value: unknown): number | null => {
    const num = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
    return Number.isFinite(num) ? num : null
  }

  const parseCoordinatesFromLocation = (location: unknown): { lat: number | null; lng: number | null } => {
    if (!location) {
      return { lat: null, lng: null }
    }

    // GeoJSON shape: { type: "Point", coordinates: [lng, lat] }
    if (typeof location === "object" && location !== null) {
      const maybeCoordinates = (location as any).coordinates
      if (Array.isArray(maybeCoordinates) && maybeCoordinates.length >= 2) {
        return {
          lng: parseCoordinate(maybeCoordinates[0]),
          lat: parseCoordinate(maybeCoordinates[1]),
        }
      }
    }

    // WKT shape: "POINT(lng lat)"
    if (typeof location === "string") {
      const match = location.match(/POINT\s*\(\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s*\)/i)
      if (match) {
        return {
          lng: parseCoordinate(match[1]),
          lat: parseCoordinate(match[2]),
        }
      }
    }

    return { lat: null, lng: null }
  }

  const parsedFromLocation = parseCoordinatesFromLocation(p?.location)
  const mappedLat = parseCoordinate(p?.latitude ?? p?.lat) ?? parsedFromLocation.lat ?? 36.7525
  const mappedLng = parseCoordinate(p?.longitude ?? p?.lng) ?? parsedFromLocation.lng ?? 3.04197

  const hasMedication =
    typeof p?.has_medication === "boolean"
      ? p.has_medication
      : typeof p?.inventory_count === "number"
        ? p.inventory_count > 0
        : undefined

  return {
    id: p.id,
    name: p.name,
    lat: mappedLat,
    lng: mappedLng,
    address: p.address ?? p.location ?? "",
    city: p.city ?? "",
    hasDrug: hasMedication,
    timeOpen: p.time_open ?? p.timeOpen ?? undefined,
    timeCloses: p.time_closes ?? p.timeCloses ?? undefined,
  }
}

type Medication = {
  id: number
  name: string
  commercial_name?: string
  dosage?: string
}

function mapApiMedication(m: any): Medication {
  return {
    id: m.id,
    name: m.name ?? "Unknown",
    commercial_name: m.commercial_name ?? "",
    dosage: m.dosage ?? "",
  }
}

function extractMedicationsFromPharmacyPayload(payload: any, query: string): Medication[] {
  const items: any[] = Array.isArray(payload) ? payload : (payload?.data ?? [])
  const byId = new Map<number, Medication>()
  const q = query.trim().toLowerCase()

  items.forEach((pharmacy) => {
    const inventories = Array.isArray(pharmacy?.inventories) ? pharmacy.inventories : []
    inventories.forEach((inventory: any) => {
      const medication = inventory?.medication
      if (!medication?.id) return

      const mapped = mapApiMedication(medication)
      if (!q) {
        byId.set(mapped.id, mapped)
        return
      }

      const haystack = `${mapped.name} ${mapped.commercial_name ?? ""} ${mapped.dosage ?? ""}`.toLowerCase()
      if (haystack.includes(q)) {
        byId.set(mapped.id, mapped)
      }
    })
  })

  return Array.from(byId.values()).slice(0, 12)
}

type ReverseGeocodeResponse = {
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    county?: string
  }
}

type LocationDetails = {
  state: string | null
  city: string | null
}

const detectCityFromCoords = async (lat: number, lng: number): Promise<LocationDetails> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return { state: null, city: null }
    const data: ReverseGeocodeResponse = await res.json()
    const addr = data.address
    return {
      state: addr?.state || addr?.county || null,
      city: addr?.city || addr?.town || addr?.village || addr?.municipality || null,
    }
  } catch {
    return { state: null, city: null }
  }
}

export default function HomePage() {
 // Update the MAX_VH to 75 so it can't be dragged past 75% of the viewport
  const MOBILE_SHEET_OPEN_VH = 75
  const MOBILE_SHEET_COLLAPSED_VH = 16
  const MOBILE_SHEET_MIN_VH = 14
  const MOBILE_SHEET_MAX_VH = 75 // <-- Change this from 100 to 75

  const [searchQuery, setSearchQuery] = useState("")
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userHeadingDeg, setUserHeadingDeg] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [routePharmacyId, setRoutePharmacyId] = useState<number | null>(null)
  const [followUserLocation, setFollowUserLocation] = useState(true)
  const [routePoints, setRoutePoints] = useState<[number, number][] | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [isNavigationActive, setIsNavigationActive] = useState(false)
  const [navigationSteps, setNavigationSteps] = useState<RouteStep[]>([])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [routeLoading, setRouteLoading] = useState(false)
  const [cityFilter, setCityFilter] = useState("")
  const [detectedCity, setDetectedCity] = useState("")
  const [detectedState, setDetectedState] = useState("")
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [mobileSheetHeightVh, setMobileSheetHeightVh] = useState(MOBILE_SHEET_COLLAPSED_VH)
  const [mobileDragStart, setMobileDragStart] = useState<{ y: number; heightVh: number } | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastAutoStartedRequestIdRef = useRef<number | string | null>(null)
  const bestAccuracyRef = useRef<number>(Number.POSITIVE_INFINITY)
  const locationRequestCooldownRef = useRef(0)
  const lastLocationRef = useRef<[number, number] | null>(null)
  const lastHeadingRef = useRef<number | null>(null)
  
  const { toast } = useToast()
  const apiCity = cityFilter.trim() || detectedCity.trim() || detectedState.trim()
  const {
    pendingRequest,
    acceptedRequest,
    sendRequest: sendMedicationRequest,
    cancelRequest: cancelMedicationRequest,
    dismissAcceptedRequest,
  } = useMedicationRequests()
  const [selectedMedicationId, setSelectedMedicationId] = useState<number | null>(null)
  const [selectedMedicationName, setSelectedMedicationName] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isRequestSending, setIsRequestSending] = useState(false)
  const [isRequestCancelling, setIsRequestCancelling] = useState(false)
  const [isRequestLocked, setIsRequestLocked] = useState(false)
  const [requestAttachmentFile, setRequestAttachmentFile] = useState<File | null>(null)
  const [requestAttachmentPreviewUrl, setRequestAttachmentPreviewUrl] = useState<string | null>(null)
  const [requestAttachmentName, setRequestAttachmentName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const customMedicationName = searchQuery.trim()
  const requestMedicationName = (selectedMedicationName?.trim() || customMedicationName || null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HOME_UI_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)

      if (parsed?.isRequestLocked === true) {
        setIsRequestLocked(true)
      }

      if (Array.isArray(parsed?.userLocation) && parsed.userLocation.length === 2) {
        const lat = Number(parsed.userLocation[0])
        const lng = Number(parsed.userLocation[1])
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setUserLocation([lat, lng])
        }
      }

      if (parsed?.selectedPharmacy) {
        const p = parsed.selectedPharmacy
        const lat = Number(p.lat)
        const lng = Number(p.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setSelectedPharmacy({
            id: Number(p.id),
            name: String(p.name ?? "Pharmacy"),
            lat,
            lng,
            address: String(p.address ?? ""),
            city: String(p.city ?? ""),
            hasDrug: Boolean(p.hasDrug),
          })
          setSelectedPharmacyId(Number(p.id))
        }
      }
    } catch {
      // Ignore invalid local storage payload.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HOME_UI_STORAGE_KEY,
        JSON.stringify({
          isRequestLocked,
          userLocation,
          selectedPharmacy,
        })
      )
    } catch {
      // Ignore storage write failures.
    }
  }, [isRequestLocked, userLocation, selectedPharmacy])

  useEffect(() => {
    setIsRequestLocked(Boolean(pendingRequest))
  }, [pendingRequest])

  const mapApiList = (payload: any): Pharmacy[] => {
    const items: any[] = Array.isArray(payload) ? payload : (payload?.data ?? [])
    return items.map(mapApiPharmacy)
  }

  const loadRouteToPharmacy = useCallback(async (
    pharmacy: Pharmacy,
    options?: { keepFollow?: boolean; originLocation?: [number, number] },
  ) => {
    setSelectedPharmacyId(pharmacy.id)
    setSelectedPharmacy(pharmacy)
    setRoutePharmacyId(pharmacy.id)
    if (!options?.keepFollow) {
      setFollowUserLocation(false)
    }

    const originLocation = options?.originLocation ?? userLocation

    if (!originLocation) {
      setRoutePoints(null)
      setRouteInfo(null)
      setNavigationSteps([])
      setActiveStepIndex(0)
      return
    }

    setRouteLoading(true)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLocation[1]},${originLocation[0]};${pharmacy.lng},${pharmacy.lat}?overview=full&geometries=geojson&steps=true`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Routing service failed with status ${response.status}`)
      }
      const data = await response.json()
      const route = data?.routes?.[0]

      if (route?.geometry?.coordinates?.length > 1) {
        const points = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
        const steps: RouteStep[] = (route?.legs ?? [])
          .flatMap((leg: any) => Array.isArray(leg?.steps) ? leg.steps : [])
          .map((step: any) => {
            const location = Array.isArray(step?.maneuver?.location) ? step.maneuver.location : [pharmacy.lng, pharmacy.lat]
            return {
              instruction: buildStepInstruction(step),
              distanceKm: toKm(Number(step?.distance ?? 0)),
              durationMin: toMin(Number(step?.duration ?? 0)),
              lat: Number(location[1]),
              lng: Number(location[0]),
            }
          })

        setRoutePoints(points)
        setRouteInfo({
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
        })
        setNavigationSteps(steps)
        setActiveStepIndex((prev) => Math.min(prev, Math.max(steps.length - 1, 0)))
        return
      }

      throw new Error("No drivable road route returned")
    } catch {
      setRoutePoints(null)
      setRouteInfo(null)
      setNavigationSteps([])
      setActiveStepIndex(0)
      toast({
        title: "Route unavailable",
        description: "Could not compute a road route right now. Please try another pharmacy or retry.",
        variant: "destructive",
      })
    } finally {
      setRouteLoading(false)
    }
  }, [toast, userLocation])

  const handlePharmacyMapSelect = useCallback((pharmacy: Pharmacy) => {
    setFollowUserLocation(false)
    setSelectedPharmacyId(pharmacy.id)
    setSelectedPharmacy(pharmacy)
  }, [])

  const handlePharmacyCardSelect = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacyId(pharmacy.id)
    setSelectedPharmacy(pharmacy)
  }, [])

  const stopInAppNavigation = useCallback(() => {
    setIsNavigationActive(false)
    setNavigationSteps([])
    setActiveStepIndex(0)
  }, [])

  const routePharmacy = routePharmacyId
    ? (pharmacies.find((pharmacy) => pharmacy.id === routePharmacyId) ?? selectedPharmacy)
    : null
  const routePharmacyBearing = routePharmacy && (lastLocationRef.current ?? userLocation)
    ? calculateBearing((lastLocationRef.current ?? userLocation) as [number, number], [routePharmacy.lat, routePharmacy.lng])
    : userHeadingDeg

  const activeNavigationStep = navigationSteps[activeStepIndex] ?? null
  const remainingStepsCount = Math.max(navigationSteps.length - activeStepIndex - 1, 0)

  const goToNextStep = useCallback(() => {
    if (navigationSteps.length === 0) return
    setActiveStepIndex((prev) => Math.min(prev + 1, navigationSteps.length - 1))
  }, [navigationSteps.length])

  const goToPreviousStep = useCallback(() => {
    if (navigationSteps.length === 0) return
    setActiveStepIndex((prev) => Math.max(prev - 1, 0))
  }, [navigationSteps.length])

  const exitNavigationView = useCallback(() => {
    stopInAppNavigation()
    setIsSidebarOpen(true)
    if (isMobileViewport) {
      setMobileSheetHeightVh(MOBILE_SHEET_OPEN_VH)
    }
  }, [isMobileViewport, stopInAppNavigation, MOBILE_SHEET_OPEN_VH])

  const fetchPharmacies = useCallback(async (lat: number, lng: number, query: string, city?: string) => {
    setLoading(true)
    try {
      const cityValue = city?.trim()
      const q = query.trim()
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
      const baseNearbyParams = hasCoords
        ? {
            latitude: lat,
            longitude: lng,
            radius_km: 15,
          }
        : null

      if (!q && !cityValue && !baseNearbyParams) {
        setPharmacies([])
        setMedications([])
        return
      }

      const [cityResponse, medicinesResponse] = await Promise.allSettled([
        cityValue && !baseNearbyParams
          ? axiosClient.get("/pharmacies", {
              params: { city: cityValue, per_page: 200 },
            })
          : axiosClient.get("/pharmacies", {
              params: q ? { q, per_page: 200 } : { per_page: 200 },
            }),
        baseNearbyParams || cityValue
          ? axiosClient.get("/pharmacies/nearby", {
              params: baseNearbyParams
                ? (q ? { ...baseNearbyParams, medication_name: q, per_page: 200 } : { ...baseNearbyParams, per_page: 200 })
                : (q ? { city: cityValue, radius_km: 100, medication_name: q, per_page: 200 } : { city: cityValue, radius_km: 100, per_page: 200 }),
            })
          : Promise.resolve({ data: { data: [] } }),
      ])

      const cityPharmacies = cityResponse.status === "fulfilled" ? mapApiList(cityResponse.value.data) : []
      const medicationScopedPharmacies = medicinesResponse.status === "fulfilled" ? mapApiList(medicinesResponse.value.data) : []

      const cityMedicines = medicinesResponse.status === "fulfilled"
        ? extractMedicationsFromPharmacyPayload(medicinesResponse.value.data, q)
        : []
      setMedications(cityMedicines)

      if (!q) {
        setPharmacies(baseNearbyParams ? medicationScopedPharmacies : cityPharmacies)
        return
      }

      // For medicine search, prefer pharmacies returned by medication-aware endpoint.
      if (medicationScopedPharmacies.length > 0) {
        setPharmacies(medicationScopedPharmacies)
        return
      }

      const qLower = q.toLowerCase()
      setPharmacies(cityPharmacies.filter((p) => p.name.toLowerCase().includes(qLower) || p.address.toLowerCase().includes(qLower)))
    } catch {
      setPharmacies([])
      setMedications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const requestDeviceLocation = useCallback(async (): Promise<[number, number] | null> => {
    const now = Date.now()
    if (now - locationRequestCooldownRef.current < 1000) {
      return lastLocationRef.current
    }
    locationRequestCooldownRef.current = now

    setLocationError(null)

    const applyPosition = (lat: number, lng: number, accuracy?: number | null, heading?: number | null) => {
      const resolvedAccuracy = accuracy ?? Number.POSITIVE_INFINITY
      const isSignificantlyBetter = resolvedAccuracy + 5 < bestAccuracyRef.current
      const isGoodEnough = resolvedAccuracy <= 60

      if (isSignificantlyBetter || isGoodEnough || !Number.isFinite(bestAccuracyRef.current)) {
        bestAccuracyRef.current = resolvedAccuracy
        const nextLocation: [number, number] = [lat, lng]
        const directHeading = normalizeHeading(heading)
        let computedHeading: number | null = directHeading

        if (computedHeading == null && lastLocationRef.current) {
          const prev = lastLocationRef.current
          const deltaLat = Math.abs(prev[0] - nextLocation[0])
          const deltaLng = Math.abs(prev[1] - nextLocation[1])
          const movedEnough = (deltaLat + deltaLng) > 0.00008

          if (movedEnough) {
            computedHeading = calculateBearing(prev, nextLocation)
          }
        }

        setUserLocation(nextLocation)
        if (computedHeading != null) {
          lastHeadingRef.current = computedHeading
          setUserHeadingDeg(computedHeading)
        } else if (lastHeadingRef.current != null) {
          setUserHeadingDeg(lastHeadingRef.current)
        }

        lastLocationRef.current = nextLocation
        return nextLocation
      }

      return lastLocationRef.current
    }

    const isNativePlatform = typeof window !== 'undefined'
      && Boolean((window as any).Capacitor?.isNativePlatform?.())

    // In Capacitor mobile builds, use native geolocation only.
    if (isNativePlatform) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation')

        const initialPermission = await Geolocation.checkPermissions()
        const hasInitialFine = initialPermission.location === 'granted'
        const hasInitialCoarse = initialPermission.coarseLocation === 'granted'

        if (!hasInitialFine && !hasInitialCoarse) {
          await Geolocation.requestPermissions()
        }

        const finalPermission = await Geolocation.checkPermissions()
        const hasFine = finalPermission.location === 'granted'
        const hasCoarse = finalPermission.coarseLocation === 'granted'

        if (!hasFine && !hasCoarse) {
          setLocationError('Location permission is denied for this app. Enable location permission in Android app settings, then try again.')
          return null
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        })

        applyPosition(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
          position.coords.heading ?? null
        )
        return [position.coords.latitude, position.coords.longitude]
      } catch (error: any) {
        const message = String(error?.message || '').toLowerCase()
        if (message.includes('denied')) {
          setLocationError('Location permission is denied for this app. Enable it in Android settings and retry.')
          return null
        }

        setLocationError('Unable to get native device location. Make sure GPS/location services are enabled and try again.')
        return null
      }
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setLocationError(`Location prompt is blocked on ${window.location.origin}. On phone web, use HTTPS (for example an ngrok/cloudflare tunnel) to allow geolocation prompts.`)
      return null
    }

    if (!navigator.geolocation) {
      setLocationError("Device location is unavailable in this browser.")
      return null
    }

    const navAny = navigator as any
    if (navAny.permissions?.query) {
      try {
        const permission = await navAny.permissions.query({ name: 'geolocation' })
        if (permission?.state === 'denied') {
          setLocationError('Location permission is denied in browser settings. Enable location permission for this site, then try again.')
          return null
        }
      } catch {
        // Continue to getCurrentPosition when Permissions API is unavailable.
      }
    }

    return await new Promise<[number, number] | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationError(null)
          const resolvedLocation = applyPosition(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
            position.coords.heading ?? null
          )
          resolve(resolvedLocation ?? [position.coords.latitude, position.coords.longitude])
        },
        () => {
          setLocationError("Unable to read the device location. Please allow location access and try again.")
          setUserLocation(null)
          setUserHeadingDeg(null)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        }
      )
    })
  }, [])

  const startInAppNavigation = useCallback(async (pharmacy: Pharmacy) => {
    const originLocation = lastLocationRef.current ?? userLocation ?? await requestDeviceLocation()

    if (!originLocation) {
      toast({
        title: "Location required",
        description: "Allow device location to start in-app navigation.",
        variant: "destructive",
      })
      return
    }

    setUserLocation(originLocation)
    await loadRouteToPharmacy(pharmacy, { keepFollow: true, originLocation })
    setFollowUserLocation(true)
    setIsNavigationActive(true)

    if (isMobileViewport) {
      setIsSidebarOpen(false)
      setMobileSheetHeightVh(MOBILE_SHEET_COLLAPSED_VH)
    }
  }, [isMobileViewport, loadRouteToPharmacy, requestDeviceLocation, toast, userLocation])

  useEffect(() => {
    if (!userLocation) return
    let cancelled = false

    const resolveCity = async () => {
      const location = await detectCityFromCoords(userLocation[0], userLocation[1])
      if (!cancelled) {
        setDetectedCity(location.city ?? "")
        setDetectedState(location.state ?? "")
      }
    }

    resolveCity()
    return () => {
      cancelled = true
    }
  }, [userLocation])

  useEffect(() => {
    if (!routePharmacyId || !userLocation) return

    const routePharmacy = pharmacies.find((pharmacy) => pharmacy.id === routePharmacyId)

    if (!routePharmacy) return
    loadRouteToPharmacy(routePharmacy, { keepFollow: isNavigationActive })
  }, [userLocation, routePharmacyId, pharmacies, loadRouteToPharmacy, isNavigationActive])

  useEffect(() => {
    if (!isNavigationActive) return

    const interval = window.setInterval(() => {
      requestDeviceLocation()
    }, 8000)

    return () => window.clearInterval(interval)
  }, [isNavigationActive, requestDeviceLocation])

  useEffect(() => {
    if (!isNavigationActive || !userLocation || navigationSteps.length === 0) return

    const [userLat, userLng] = userLocation
    let nearestIdx = 0
    let nearestScore = Number.POSITIVE_INFINITY

    navigationSteps.forEach((step, index) => {
      const dy = step.lat - userLat
      const dx = step.lng - userLng
      const score = (dy * dy) + (dx * dx)
      if (score < nearestScore) {
        nearestScore = score
        nearestIdx = index
      }
    })

    setActiveStepIndex((prev) => Math.max(prev, nearestIdx))
  }, [isNavigationActive, navigationSteps, userLocation])

  useEffect(() => {
    if (!acceptedRequest?.pharmacy) return
    if (acceptedRequest.requestId != null && lastAutoStartedRequestIdRef.current === acceptedRequest.requestId) {
      return
    }

    const fromAccepted = acceptedRequest.pharmacy
    const acceptedPharmacy: Pharmacy = {
      id: fromAccepted.id ?? -1,
      name: fromAccepted.name,
      lat: Number(fromAccepted.lat),
      lng: Number(fromAccepted.lng),
      address: fromAccepted.address ?? '',
      city: fromAccepted.city ?? '',
      hasDrug: true,
    }

    if (!Number.isFinite(acceptedPharmacy.lat) || !Number.isFinite(acceptedPharmacy.lng)) {
      return
    }

    setPharmacies((prev) => {
      if (prev.some((p) => p.id === acceptedPharmacy.id)) return prev
      return [acceptedPharmacy, ...prev]
    })

    if (acceptedRequest.requestId != null) {
      lastAutoStartedRequestIdRef.current = acceptedRequest.requestId
    }

    toast({
      title: "Request accepted",
      description: "Starting navigation to the accepted pharmacy.",
    })

    void startInAppNavigation(acceptedPharmacy)
  }, [acceptedRequest, startInAppNavigation, toast])

  useEffect(() => {
    if (!acceptedRequest || !isMobileViewport || isNavigationActive) return

    setIsSidebarOpen(true)
    setMobileSheetHeightVh(MOBILE_SHEET_OPEN_VH)
  }, [acceptedRequest, isMobileViewport, MOBILE_SHEET_OPEN_VH, isNavigationActive])

  const centerToMyLocation = useCallback(() => {
    setIsNavigationActive(false)
    setSelectedPharmacyId(null)
    setSelectedPharmacy(null)
    setRoutePharmacyId(null)
    setRoutePoints(null)
    setRouteInfo(null)
    setNavigationSteps([])
    setActiveStepIndex(0)
    setFollowUserLocation(true)
  }, [])

  const handleResetAfterAccepted = useCallback(() => {
    centerToMyLocation()
    dismissAcceptedRequest(acceptedRequest?.requestId)
  }, [centerToMyLocation, dismissAcceptedRequest, acceptedRequest])

  const toggleFollowUserLocation = useCallback(() => {
    setFollowUserLocation((current) => !current)
  }, [])

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth < 768)
    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  useEffect(() => {
    if (!isMobileViewport) return
    setMobileSheetHeightVh(isSidebarOpen ? MOBILE_SHEET_OPEN_VH : MOBILE_SHEET_COLLAPSED_VH)
  }, [isSidebarOpen, isMobileViewport])

  const onMobileHandleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport) return
    setMobileDragStart({
      y: event.touches[0]?.clientY ?? 0,
      heightVh: mobileSheetHeightVh,
    })
  }

  const onMobileHandleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport || !mobileDragStart) return

    event.preventDefault()

    const currentY = event.touches[0]?.clientY ?? mobileDragStart.y
    const deltaPx = mobileDragStart.y - currentY
    const deltaVh = (deltaPx / window.innerHeight) * 100
    const nextHeight = Math.max(
      MOBILE_SHEET_MIN_VH,
      Math.min(MOBILE_SHEET_MAX_VH, mobileDragStart.heightVh + deltaVh),
    )

    setMobileSheetHeightVh(nextHeight)
    if (nextHeight > MOBILE_SHEET_COLLAPSED_VH + 6) {
      setIsSidebarOpen(true)
    }
  }

  const onMobileHandleTouchEnd = () => {
    if (!isMobileViewport) return

    const shouldOpen = mobileSheetHeightVh >= 50
    setIsSidebarOpen(shouldOpen)
    setMobileSheetHeightVh(shouldOpen ? MOBILE_SHEET_OPEN_VH : MOBILE_SHEET_COLLAPSED_VH)
    setMobileDragStart(null)
  }

  const toggleMobileSheet = () => {
    const nextOpen = !isSidebarOpen
    setIsSidebarOpen(nextOpen)
    if (isMobileViewport) {
      setMobileSheetHeightVh(nextOpen ? MOBILE_SHEET_OPEN_VH : MOBILE_SHEET_COLLAPSED_VH)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleSendRequest = useCallback(async () => {
    if (isRequestLocked || isRequestSending) return
    if (!requestMedicationName) {
      toast({
        title: "Select a medication",
        description: "Type or choose a medicine name before sending a request.",
        variant: "destructive",
      })
      return
    }
    if (!apiCity) {
      toast({
        title: "City required",
        description: "Please set or detect a city before sending.",
        variant: "destructive",
      })
      return
    }

    setRequestError(null)
    setIsRequestSending(true)
    try {
      await sendMedicationRequest(requestMedicationName, apiCity, requestAttachmentFile)
      setIsRequestLocked(true)
      setRequestAttachmentFile(null)
      setRequestAttachmentPreviewUrl(null)
      setRequestAttachmentName(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      toast({
        title: "Request Sent!",
        description: `${requestMedicationName} requested in ${apiCity} for all pharmacies in that city.`,
      })
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to send request"
      setRequestError(errMsg)
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setIsRequestSending(false)
    }
  }, [isRequestLocked, isRequestSending, requestMedicationName, apiCity, requestAttachmentFile, sendMedicationRequest, toast])

  const handleRequestAttachmentChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 10 * 1024 * 1024

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Image required",
        description: "Please choose an image file for the attachment.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (file.size > maxSizeBytes) {
      toast({
        title: "Image too large",
        description: "Please choose an image smaller than 10 MB.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRequestAttachmentFile(file)
        setRequestAttachmentPreviewUrl(reader.result)
        setRequestAttachmentName(file.name)
      }
    }
    reader.onerror = () => {
      toast({
        title: "Attachment failed",
        description: "The image could not be read. Please try another file.",
        variant: "destructive",
      })
    }
    reader.readAsDataURL(file)
  }, [toast])

  const clearRequestAttachment = useCallback(() => {
    setRequestAttachmentFile(null)
    setRequestAttachmentPreviewUrl(null)
    setRequestAttachmentName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleCancelRequest = useCallback(async () => {
    if (!pendingRequest?.requestId || isRequestCancelling) return

    setIsRequestCancelling(true)
    try {
      await cancelMedicationRequest(pendingRequest.requestId)
      setRequestError(null)
      toast({
        title: "Request canceled",
        description: "Your medication request was canceled successfully.",
      })
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to cancel request"
      setRequestError(errMsg)
      toast({
        title: "Cancel failed",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setIsRequestCancelling(false)
    }
  }, [pendingRequest, isRequestCancelling, cancelMedicationRequest, toast])

  // Debounced search - re-fetch when user types
  useEffect(() => {
    const effectiveCity = cityFilter.trim() || detectedCity.trim() || detectedState.trim()
    if (!searchQuery.trim() && !effectiveCity && !userLocation) return

    const timer = setTimeout(() => {
      const lat = userLocation?.[0] ?? 0
      const lng = userLocation?.[1] ?? 0
      fetchPharmacies(lat, lng, searchQuery, effectiveCity)
    }, 600)

    return () => clearTimeout(timer)
  }, [searchQuery, cityFilter, detectedCity, detectedState, userLocation, fetchPharmacies])

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <Navbar onMenuClick={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-muted/10 min-h-0">

        {/* Map Area */}
        <div className="order-1 md:order-2 flex-1 relative min-h-[60vh] md:min-h-0 z-0">
          <PharmacyMap
            pharmacies={pharmacies}
            userLocation={userLocation}
            userHeadingDeg={userHeadingDeg}
            selectedPharmacyId={selectedPharmacyId}
            routePoints={routePoints}
            followUserLocation={followUserLocation}
            navigationMode={isNavigationActive}
            enable3D={isNavigationActive}
            navigationBearingDeg={routePharmacyBearing}
            onCenterToUser={centerToMyLocation}
            onToggleFollow={toggleFollowUserLocation}
            onPharmacyClick={handlePharmacyMapSelect}
          />

          {isNavigationActive && routePharmacy && (
            <div className="pointer-events-none absolute inset-0 z-[1200] flex flex-col justify-between p-3 sm:p-4">
              <div className="pointer-events-auto rounded-2xl border border-primary/20 bg-background/95 shadow-xl backdrop-blur-md p-3 sm:p-4 space-y-2 max-w-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Navigation</p>
                    <p className="text-sm font-semibold truncate">{routePharmacy.name}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={exitNavigationView}>
                    Stop
                  </Button>
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">Next maneuver</p>
                  <p className="text-sm font-semibold mt-1">{activeNavigationStep?.instruction ?? "Follow the highlighted route"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {routeInfo ? `${routeInfo.distanceKm.toFixed(1)} km • ${Math.round(routeInfo.durationMin)} min` : "Updating route..."}
                    {navigationSteps.length > 0 ? ` • Step ${activeStepIndex + 1}/${navigationSteps.length}` : ""}
                  </p>
                </div>
              </div>

              <div className="pointer-events-auto self-center rounded-full border border-border/70 bg-background/95 shadow-lg backdrop-blur-md px-2 py-1.5 flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={activeStepIndex <= 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="px-2 text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
                  <Navigation className="size-3.5 text-primary" />
                  {remainingStepsCount} steps left
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={goToNextStep}
                  disabled={activeStepIndex >= navigationSteps.length - 1}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
       {/* Sidebar */}
        <aside className={`
          order-2 md:order-1 
          w-full md:w-[420px] 
          flex flex-col 
          bg-background/90 md:bg-background/95 
          backdrop-blur-2xl 
          border-t md:border-t-0 md:border border-border/50
          shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] md:shadow-lg
          transition-all duration-500 cubic-bezier(0.32,0.72,0,1)
          rounded-t-3xl md:rounded-3xl
          pt-2 md:pt-0
          md:mx-auto
          z-20 
          md:h-auto md:max-h-[85vh]
          min-h-0
          /* NEW: These classes make it float on top of the map on mobile */
          absolute bottom-0 left-0 md:relative md:bottom-auto md:left-auto
          ${isNavigationActive ? 'hidden' : ''}
        `}
        style={isMobileViewport ? { height: `${mobileSheetHeightVh}vh` } : undefined}
        >
          {/* Drag Handle for Mobile */}
          <div
            className="w-full flex justify-center md:hidden pb-2 pt-1 cursor-pointer touch-none select-none"
            onClick={toggleMobileSheet}
            onTouchStart={onMobileHandleTouchStart}
            onTouchMove={onMobileHandleTouchMove}
            onTouchEnd={onMobileHandleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="px-5 pb-4 md:p-6 md:border-b space-y-4 shrink-0 bg-transparent z-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent md:text-foreground">
                  Find Pharmacies
                </h2>
                <p className="text-sm text-muted-foreground mt-1 hidden md:block">Search by medication or pharmacy name.</p>
              </div>
            </div>

            {!userLocation && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground space-y-2">
                <p className="font-medium text-primary">Use your device location</p>
                <p className="text-xs text-muted-foreground">
                  Tap below so the app can use your phone position and show pharmacies near you.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={requestDeviceLocation}>
                  Allow device location
                </Button>
              </div>
            )}

            {locationError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 space-y-2">
                <p>{locationError}</p>
                <Button type="button" variant="outline" size="sm" onClick={requestDeviceLocation}>
                  Allow device location
                </Button>
              </div>
            )}

            {routePharmacyId && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                <p className="font-medium text-primary">
                  {isNavigationActive ? "Navigation active" : "Route selected"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {routeLoading
                    ? 'Loading directions...'
                    : routeInfo
                      ? `${routeInfo.distanceKm.toFixed(1)} km • ${Math.round(routeInfo.durationMin)} min drive`
                      : 'Road route will appear here when available.'}
                </p>
                {isNavigationActive && activeNavigationStep && (
                  <p className="text-xs text-foreground mt-2 rounded-lg border border-primary/20 bg-background/60 px-2 py-1.5">
                    Next: {activeNavigationStep.instruction}
                  </p>
                )}
                {routePharmacy && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => startInAppNavigation(routePharmacy)}
                    >
                      {isNavigationActive ? "Refresh navigation" : "Start navigation"}
                    </Button>
                    {isNavigationActive && (
                      <Button type="button" size="sm" variant="outline" onClick={stopInAppNavigation}>
                        Stop
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="relative group">
              {loading
                ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              }
              <Input
                type="search"
                placeholder="Search medication or pharmacy (e.g. Paracetamol, Central Pharma)..."
                className="w-full pl-10 bg-background/80 focus-visible:ring-primary/50 shadow-inner rounded-xl h-12 transition-all border-muted-foreground/20 text-base md:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSidebarOpen(true)}
              />
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder={detectedState ? `State (detected: ${detectedState})` : "State (optional)"}
                className="w-full bg-background/80 focus-visible:ring-primary/50 shadow-inner rounded-xl h-11 transition-all border-muted-foreground/20 text-base md:text-sm"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
              {detectedState && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Detected state: {detectedState}</span>
                  <button
                    type="button"
                    className="text-primary hover:underline cursor-pointer"
                    onClick={() => setCityFilter( detectedState)}
                  >
                    Use detected location
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`
            flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-5 pb-6 md:p-6 space-y-4 bg-transparent z-10
            ${isSidebarOpen ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden md:block'}
          `}>
            <h3 className="font-semibold text-sm text-foreground/80 tracking-wide flex items-center justify-between">
              {searchQuery ? `Results for "${searchQuery}"` : 'Nearby Pharmacies'}
              <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {loading ? '...' : `${pharmacies.length} pharmacies${searchQuery ? ` • ${medications.length} meds` : ''}`}
              </span>
            </h3>

            {medications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                  {searchQuery ? "Matching Medications" : "Medicines In This City"}
                </h4>
                <div className="space-y-2">
                  {medications.map((medication) => (
                    <button
                      key={medication.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(medication.name)
                        setSelectedMedicationId(medication.id)
                        setSelectedMedicationName(medication.name)
                      }}
                      className={`w-full text-left rounded-xl border px-3 py-2 transition-all cursor-pointer ${
                        selectedMedicationId === medication.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card/50 hover:bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Pill className={`size-4 mt-0.5 shrink-0 ${selectedMedicationId === medication.id ? "text-primary" : "text-primary"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{medication.name}</p>
                          {(medication.commercial_name || medication.dosage) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[medication.commercial_name, medication.dosage].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Medication Request Section - Show always when search query exists */}
            {searchQuery && (
              <div className="space-y-2">
                {medications.length === 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-xs text-amber-900 font-medium">
                      No medications found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-amber-800 mt-1">
                      You can still request this medication below - pharmacies can respond with alternatives or exact matches.
                    </p>
                  </div>
                )}
                
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase">Medication Request</p>
                  <p className="text-xs text-foreground/80">
                    Send a request for: <span className="font-semibold text-primary">{customMedicationName || searchQuery}</span>
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleSendRequest}
                    disabled={isRequestLocked || isRequestSending || !apiCity}
                  >
                    {isRequestLocked
                      ? "Request already sent (locked)"
                      : isRequestSending
                        ? "Sending request..."
                        : `Send request to all pharmacies in ${apiCity || "city"}`}
                  </Button>
                </div>
              </div>
            )}

            {!searchQuery && requestMedicationName && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs text-primary font-medium">
                  {selectedMedicationId ? `✓ ${selectedMedicationName} selected` : `Custom medicine: ${requestMedicationName}`}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSendRequest}
                  disabled={isRequestLocked || isRequestSending || !apiCity}
                >
                  {isRequestLocked
                    ? "Request already sent (locked)"
                    : isRequestSending
                      ? "Sending request..."
                      : `Send request to all pharmacies in ${apiCity || "city"}`}
                </Button>
              </div>
            )}

            {requestMedicationName && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optional attachment</p>
                    <p className="text-xs text-muted-foreground">Add a photo of the package, prescription, or product label.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="mr-2 size-4" />
                    Attach image
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRequestAttachmentChange} />
                {requestAttachmentPreviewUrl && (
                  <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{requestAttachmentName || "Attached image"}</p>
                        <p className="text-xs text-muted-foreground">Image will be sent with the request.</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={clearRequestAttachment}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    <img
                      src={requestAttachmentPreviewUrl}
                      alt="Request attachment preview"
                      className="max-h-48 w-full rounded-lg object-contain bg-background"
                    />
                  </div>
                )}
              </div>
            )}

            {pendingRequest && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
                  <Clock3 className="size-4" />
                  Waiting for pharmacy approval
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Request for <strong>{pendingRequest.medicationName}</strong> in <strong>{pendingRequest.city}</strong> is being reviewed.
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.2s]" />
                  <span className="size-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.1s]" />
                  <span className="size-2 rounded-full bg-amber-500 animate-bounce" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleCancelRequest}
                  disabled={isRequestCancelling}
                >
                  {isRequestCancelling ? "Cancelling..." : "Cancel request"}
                </Button>
              </div>
            )}

            {acceptedRequest && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm">
                  <CircleCheckBig className="size-4" />
                  Request accepted
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  <strong>{acceptedRequest.pharmacyName}</strong> accepted your request at {new Date(acceptedRequest.acceptedAt).toLocaleString()}.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleResetAfterAccepted}
                >
                  Reset route and clear accepted request
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 text-muted-foreground rounded-2xl border border-dashed border-muted-foreground/20">
                <Info className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No pharmacies found in your current city.</p>
                <p className="text-xs mt-1">Allow location access so we can use your device position and show only nearby city pharmacies.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pharmacies.map(pharmacy => (
                  <MedicationRequestPharmacyCard
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    isSelected={selectedPharmacyId === pharmacy.id}
                    isRouteActive={routePharmacyId === pharmacy.id}
                    searchQuery={searchQuery}
                    onSelect={handlePharmacyCardSelect}
                    onGetDirections={loadRouteToPharmacy}
                    error={requestError || undefined}
                    isPending={Boolean(pendingRequest)}
                  />
                ))}
              </div>
            )}
          </div>

        </aside>

      </main>
      <ChatbotWidget />
    </div>
  )
}
