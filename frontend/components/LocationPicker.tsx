"use client"

import { useEffect, useRef } from "react"

type LocationPickerProps = {
    lat: number | null
    lng: number | null
    onChange: (lat: number, lng: number) => void
    onCityChange?: (city: string | null) => void
    onAddressChange?: (address: string | null) => void
}

type ReverseGeocodeResponse = {
    display_name?: string
    address?: {
        state?: string
        city?: string
        town?: string
        village?: string
        municipality?: string
        county?: string
    }
}

const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string | null; address: string | null }> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`
        const res = await fetch(url, {
            headers: {
                "Accept": "application/json",
            },
        })

        if (!res.ok) return { city: null, address: null }
        const data: ReverseGeocodeResponse = await res.json()
        const addr = data.address
        const city = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county || addr?.state || null
        return {
            city,
            address: data.display_name ?? null,
        }
    } catch {
        return { city: null, address: null }
    }
}

// Dynamically loads Leaflet only on the client (no SSR issues)
export default function LocationPicker({ lat, lng, onChange, onCityChange, onAddressChange }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const initInProgressRef = useRef(false)

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current || initInProgressRef.current) return

        let cancelled = false
        initInProgressRef.current = true

        // Dynamic import to avoid SSR
        import("leaflet").then((L) => {
            if (cancelled || !mapRef.current || mapInstanceRef.current) {
                initInProgressRef.current = false
                return
            }

            // Fix default icons
            const icon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            })

            const initialCenter: [number, number] = lat && lng ? [lat, lng] : [36.7525, 3.04197]
            const map = L.map(mapRef.current!).setView(initialCenter, 13)
            mapInstanceRef.current = map
            initInProgressRef.current = false

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; OpenStreetMap / CartoDB',
            }).addTo(map)

            // Place initial marker if coords exist
            if (lat && lng) {
                const m = L.marker([lat, lng], { icon }).addTo(map)
                m.bindPopup("📍 Selected location").openPopup()
                markerRef.current = m
            }

            // Click to place / move marker
            map.on("click", async (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng
                onChange(clickLat, clickLng)

                const geocode = await reverseGeocode(clickLat, clickLng)
                onCityChange?.(geocode.city)
                onAddressChange?.(geocode.address)

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng])
                } else {
                    const m = L.marker([clickLat, clickLng], { icon }).addTo(map)
                    m.bindPopup("Selected location").openPopup()
                    markerRef.current = m
                }
                markerRef.current?.openPopup()
            })

            // Invalidate size after mount (fixes map rendering in dialogs)
            setTimeout(() => map.invalidateSize(), 100)
        }).catch(() => {
            initInProgressRef.current = false
        })

        return () => {
            cancelled = true
            mapInstanceRef.current?.remove()
            mapInstanceRef.current = null
            markerRef.current = null
            initInProgressRef.current = false

            // Clear Leaflet container marker to avoid "already initialized" on remount.
            if (mapRef.current && (mapRef.current as any)._leaflet_id) {
                delete (mapRef.current as any)._leaflet_id
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
                Click on the map to set location and auto-fill city + address.
            </p>
            {lat && lng && (
                <p className="text-xs font-mono text-primary">
                    Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                </p>
            )}
            <div
                ref={mapRef}
                className="h-52 w-full rounded-md border overflow-hidden z-0"
                style={{ position: "relative" }}
            />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                // @ts-ignore
                precedence="default"
            />
        </div>
    )
}
