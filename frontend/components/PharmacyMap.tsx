"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  useMap,
} from "@/components/ui/map"
import { MapPin, Navigation } from "lucide-react"

export type Pharmacy = {
  id: number
  name: string
  lat: number
  lng: number
  address: string
  city?: string
  hasDrug?: boolean
  timeOpen?: string
  timeCloses?: string
}

type PharmacyMapProps = {
  pharmacies: Pharmacy[]
  userLocation: [number, number] | null
  userHeadingDeg?: number | null
  navigationBearingDeg?: number | null
  selectedPharmacyId?: number | null
  routePoints?: [number, number][] | null
  followUserLocation?: boolean
  navigationMode?: boolean
  enable3D?: boolean
  onCenterToUser?: () => void
  onToggleFollow?: () => void
  onPharmacyClick?: (pharmacy: Pharmacy) => void
}

const toLngLat = (point: [number, number]): [number, number] => [point[1], point[0]]

function UserMarkerIcon({
  headingDeg,
  navigationMode,
}: {
  headingDeg?: number | null
  navigationMode?: boolean
}) {
  const heading = typeof headingDeg === "number" && Number.isFinite(headingDeg) ? headingDeg : 0

  return (
    <div className="h-[34px] w-[34px]" style={{ transform: `rotate(${heading}deg)` }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
        <circle cx="17" cy="17" r="14" fill="#dbeafe" opacity="0.85" />
        <circle cx="17" cy="17" r="9" fill="#3b82f6" />
        <circle cx="17" cy="17" r="4" fill="#ffffff" />
        <path d="M17 2.8L20.8 11H13.2L17 2.8Z" fill="#1d4ed8" opacity={navigationMode ? 1 : 0.82} />
        <circle cx="17" cy="17" r="15.5" stroke="#1d4ed8" strokeOpacity="0.35" />
      </svg>
    </div>
  )
}

function PharmacyMarkerIcon({ selected }: { selected: boolean }) {
  const fillColor = selected ? "#ea580c" : "#16a34a"
  const strokeColor = selected ? "#9a3412" : "#14532d"

  return (
    <div className="h-[56px] w-[44px]">
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56" fill="none">
        <defs>
          <filter id={`shadow-${selected ? "selected" : "default"}`} x="0" y="0" width="44" height="56" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.2" />
          </filter>
        </defs>
        <g filter={`url(#shadow-${selected ? "selected" : "default"})`}>
          <path
            d="M22 52C22 52 39 33.9 39 21.5C39 11.8 31.2 4 21.5 4C11.8 4 4 11.8 4 21.5C4 33.9 22 52 22 52Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <circle cx="21.5" cy="21" r="9.5" fill="#ffffff" />
          <rect x="19.8" y="15.2" width="3.4" height="11.6" rx="1.2" fill={fillColor} />
          <rect x="15.6" y="19.4" width="11.8" height="3.4" rx="1.2" fill={fillColor} />
        </g>
      </svg>
    </div>
  )
}

function FollowUserView({
  userLocation,
  followUserLocation,
  navigationMode,
  cameraReady,
}: {
  userLocation: [number, number] | null
  followUserLocation?: boolean
  navigationMode?: boolean
  cameraReady?: boolean
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!isLoaded || !map || !followUserLocation || !userLocation) return
    if (navigationMode && !cameraReady) return
    map.flyTo({ center: toLngLat(userLocation), zoom: 16, duration: 600 })
  }, [map, isLoaded, userLocation, followUserLocation, navigationMode, cameraReady])

  return null
}

function NavigationCameraView({
  userLocation,
  userHeadingDeg,
  navigationBearingDeg,
  followUserLocation,
  navigationMode,
  onCameraReady,
}: {
  userLocation: [number, number] | null
  userHeadingDeg?: number | null
  navigationBearingDeg?: number | null
  followUserLocation?: boolean
  navigationMode?: boolean
  onCameraReady?: () => void
}) {
  const { map, isLoaded } = useMap()
  const lastCameraRef = useRef<{ lat: number; lng: number; headingBucket: number } | null>(null)

  useEffect(() => {
    if (!isLoaded || !map || !userLocation || !followUserLocation || !navigationMode) return

    const heading =
      typeof navigationBearingDeg === "number" && Number.isFinite(navigationBearingDeg)
        ? navigationBearingDeg
        : typeof userHeadingDeg === "number" && Number.isFinite(userHeadingDeg)
          ? userHeadingDeg
          : null
    const zoom = Math.max(map.getZoom(), 17)
    const [lng, lat] = toLngLat(userLocation)
    const userPoint = map.project([lng, lat])

    let targetLng = lng
    let targetLat = lat
    let headingBucket = -1

    if (heading != null) {
      const headingRad = (heading * Math.PI) / 180
      const lookAheadPx = 140
      const aheadX = Math.sin(headingRad) * lookAheadPx
      const aheadY = -Math.cos(headingRad) * lookAheadPx
      const centerPoint: [number, number] = [userPoint.x + aheadX, userPoint.y + aheadY]
      const centerLngLat = map.unproject(centerPoint)
      targetLng = centerLngLat.lng
      targetLat = centerLngLat.lat
      headingBucket = Math.round(heading / 8)
    }

    const last = lastCameraRef.current
    const isSmallMove =
      !!last &&
      Math.abs(last.lat - targetLat) < 0.00002 &&
      Math.abs(last.lng - targetLng) < 0.00002 &&
      last.headingBucket === headingBucket

    if (isSmallMove) return

    map.flyTo({
      center: [targetLng, targetLat],
      zoom,
      bearing: heading ?? -20,
      pitch: 60,
      duration: 900,
    })

    lastCameraRef.current = { lat: targetLat, lng: targetLng, headingBucket }

    if (navigationMode) {
      window.setTimeout(() => {
        onCameraReady?.()
      }, 900)
    }
  }, [map, isLoaded, userLocation, userHeadingDeg, followUserLocation, navigationMode])

  return null
}

function ThreeDModeView({
  enabled,
  bearingDeg,
}: {
  enabled?: boolean
  bearingDeg?: number | null
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!isLoaded || !map) return

    // Keep map flat (mercator), only rotate/tilt camera.
    map.setProjection({ type: "mercator" })

    if (enabled) {
      map.easeTo({
        pitch: 60,
        bearing: typeof bearingDeg === "number" && Number.isFinite(bearingDeg) ? bearingDeg : -20,
        duration: 1000,
      })
      return
    }

    map.stop()
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    })
  }, [map, isLoaded, enabled, bearingDeg])

  return null
}

function RouteFitBounds({
  routePoints,
  followUserLocation,
}: {
  routePoints: [number, number][] | null
  followUserLocation?: boolean
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!isLoaded || !map || followUserLocation || !routePoints || routePoints.length < 2) return

    const lngLats = routePoints.map(toLngLat)
    const lngs = lngLats.map(([lng]) => lng)
    const lats = lngLats.map(([, lat]) => lat)

    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 48, duration: 500 },
    )
  }, [map, isLoaded, routePoints, followUserLocation])

  return null
}

function FocusSelectedPharmacy({
  pharmacies,
  selectedPharmacyId,
  followUserLocation,
}: {
  pharmacies: Pharmacy[]
  selectedPharmacyId?: number | null
  followUserLocation?: boolean
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!isLoaded || !map || followUserLocation || !selectedPharmacyId) return

    const selected = pharmacies.find((pharmacy) => pharmacy.id === selectedPharmacyId)
    if (!selected) return

    map.flyTo({ center: [selected.lng, selected.lat], zoom: Math.max(map.getZoom(), 15), duration: 500 })
  }, [map, isLoaded, pharmacies, selectedPharmacyId, followUserLocation])

  return null
}

function RecenterMapControl({
  userLocation,
  followUserLocation,
  onCenterToUser,
  onToggleFollow,
}: {
  userLocation: [number, number] | null
  followUserLocation?: boolean
  onCenterToUser?: () => void
  onToggleFollow?: () => void
}) {
  const { map } = useMap()

  if (!userLocation || !map) return null

  return (
    <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
      <button
        type="button"
        title="Center me"
        onClick={() => {
          onCenterToUser?.()
          map.flyTo({ center: toLngLat(userLocation), zoom: 16, duration: 500 })
          map.resize()
        }}
        className="rounded-lg border border-border/70 bg-background/95 p-2 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background"
      >
        <MapPin className="h-5 w-5" />
      </button>
      <button
        type="button"
        title={followUserLocation ? "Stop following" : "Follow live"}
        onClick={() => {
          onToggleFollow?.()
          map.flyTo({ center: toLngLat(userLocation), zoom: followUserLocation ? map.getZoom() : 16, duration: 500 })
          map.resize()
        }}
        className={`rounded-lg border p-2 shadow-md backdrop-blur-sm transition-colors ${
          followUserLocation
            ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-border/70 bg-background/95 text-foreground hover:bg-background"
        }`}
      >
        <Navigation className={`h-5 w-5 transition-transform ${followUserLocation ? "animate-pulse" : ""}`} />
      </button>
    </div>
  )
}

export default function PharmacyMap({
  pharmacies,
  userLocation,
  userHeadingDeg,
  navigationBearingDeg,
  selectedPharmacyId,
  routePoints,
  followUserLocation,
  navigationMode,
  enable3D,
  onCenterToUser,
  onToggleFollow,
  onPharmacyClick,
}: PharmacyMapProps) {
  const openStreetMap3dStyle = "https://tiles.openfreemap.org/styles/liberty"
  const defaultCenter: [number, number] = [36.7525, 3.04197]
  const [mounted, setMounted] = useState(false)
  const [navigationCameraReady, setNavigationCameraReady] = useState(false)
  const shouldEnable3D = Boolean(enable3D || navigationMode)
  const mapStyles = useMemo(
    () => (
      navigationMode
        ? { light: openStreetMap3dStyle, dark: openStreetMap3dStyle }
        : undefined
    ),
    [navigationMode],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!navigationMode) {
      setNavigationCameraReady(false)
    }
  }, [navigationMode])

  if (!mounted) return <div className="h-full w-full animate-pulse rounded-md bg-muted/20" />

  const center = userLocation || defaultCenter
  const routeLngLat = (routePoints ?? []).map(toLngLat)

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-muted/10">
      <Map
        center={toLngLat(center)}
        zoom={13}
        styles={mapStyles}
        className="absolute inset-0 h-full w-full focus:outline-none"
      >
        <MapControls position="bottom-right" showZoom showCompass />
        <ThreeDModeView enabled={shouldEnable3D} bearingDeg={navigationBearingDeg ?? userHeadingDeg} />

        <FollowUserView
          userLocation={userLocation}
          followUserLocation={followUserLocation}
          navigationMode={navigationMode}
          cameraReady={navigationCameraReady}
        />
        <NavigationCameraView
          userLocation={userLocation}
          userHeadingDeg={userHeadingDeg}
          navigationBearingDeg={navigationBearingDeg}
          followUserLocation={followUserLocation}
          navigationMode={navigationMode}
          onCameraReady={() => setNavigationCameraReady(true)}
        />
        <RouteFitBounds routePoints={routePoints ?? null} followUserLocation={followUserLocation} />
        <FocusSelectedPharmacy
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
          followUserLocation={followUserLocation}
        />
        <RecenterMapControl
          userLocation={userLocation}
          followUserLocation={followUserLocation}
          onCenterToUser={onCenterToUser}
          onToggleFollow={onToggleFollow}
        />

        {userLocation && (
          <MapMarker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
            <MarkerContent>
              <UserMarkerIcon headingDeg={userHeadingDeg} navigationMode={navigationMode} />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600/50 bg-blue-600/10" />
            </MarkerContent>
            <MarkerPopup className="font-sans" closeButton={false}>
              <div className="text-sm">
                <strong className="mb-1 block text-base font-semibold text-blue-700">Your Location</strong>
                <p className="text-xs text-muted-foreground">
                  Lat: {userLocation[0].toFixed(4)}, Lng: {userLocation[1].toFixed(4)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {pharmacies.map((pharmacy) => {
          const isSelected = selectedPharmacyId === pharmacy.id

          return (
            <MapMarker
              key={pharmacy.id}
              longitude={pharmacy.lng}
              latitude={pharmacy.lat}
              anchor="bottom"
              onClick={() => onPharmacyClick?.(pharmacy)}
            >
              <MarkerContent>
                <PharmacyMarkerIcon selected={isSelected} />
              </MarkerContent>
              <MarkerPopup className="font-sans" closeButton={false}>
                <div className="min-w-[250px] max-w-[280px] overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg">
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
                  <div className="space-y-3 p-3.5">
                    <div className="space-y-1.5">
                      <strong className="block line-clamp-2 text-[15px] font-semibold leading-tight text-foreground">
                        {pharmacy.name}
                      </strong>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Pharmacy
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Address</p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-foreground/85">
                        {pharmacy.address || "Address not available"}
                      </p>
                    </div>

                    {pharmacy.hasDrug !== undefined && (
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          pharmacy.hasDrug ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            pharmacy.hasDrug ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {pharmacy.hasDrug ? "Medication available" : "Medication unavailable"}
                      </div>
                    )}
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          )
        })}

        {routeLngLat.length >= 2 && (
          <MapRoute id="medication-route" coordinates={routeLngLat} color="#2563eb" width={5} opacity={0.9} />
        )}
      </Map>
    </div>
  )
}
