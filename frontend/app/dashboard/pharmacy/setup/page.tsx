"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Building2 } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// Leaflet map picker — loaded client-side only
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false })

// API.md: POST /api/pharmacies, PUT /api/pharmacies/{id}
// Fields: name, city, address, latitude, longitude, registre_commerce_number, time_open, time_closes

type PharmacyProfile = {
    id: number
    name: string
    city?: string | null
    address: string
    latitude?: number | null
    longitude?: number | null
    registre_commerce_number?: string
    time_open?: string
    time_closes?: string
    owner_id?: number
    owner?: { id?: number }
}

export default function PharmacySetupPage() {
    const { toast } = useToast()
    const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [lastAction, setLastAction] = useState<"created" | "updated" | null>(null)

    // Form fields
    const [name, setName] = useState("")
    const [city, setCity] = useState("")
    const [address, setAddress] = useState("")
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [rc, setRc] = useState("")
    const [timeOpen, setTimeOpen] = useState("08:00")
    const [timeClose, setTimeClose] = useState("20:00")

    const handleLocationChange = useCallback((nextLat: number, nextLng: number, nextCity: string | null, nextAddress: string | null) => {
        setLat(nextLat)
        setLng(nextLng)
        setCity(nextCity ?? "")
        setAddress(nextAddress ?? "")
    }, [])

    // Load current pharmacy profile (belongs to this user)
    const fetchPharmacy = useCallback(async () => {
        setLoading(true)
        try {
            // Resolve the signed-in user first, then load their specific pharmacy.
            const meRes = await axiosClient.get("/auth/me")
            const me = meRes.data ?? {}
            let mine: PharmacyProfile | null = null

            if (me?.pharmacy?.id) {
                const pharmacyRes = await axiosClient.get(`/pharmacies/${me.pharmacy.id}`)
                mine = pharmacyRes.data ?? null
            } else {
                const res = await axiosClient.get("/pharmacies")
                const list: PharmacyProfile[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                mine = list.find((item) => Number(item.owner_id) === Number(me?.id) || Number(item.owner?.id) === Number(me?.id)) ?? null
            }

            if (mine) {
                setPharmacy(mine)
                setName(mine.name ?? "")
                setCity(mine.city ?? "")
                setAddress(mine.address ?? "")
                setLat(mine.latitude ?? null)
                setLng(mine.longitude ?? null)
                setRc(mine.registre_commerce_number ?? "")
                // Strip seconds from HH:mm:ss for <input type="time">
                setTimeOpen((mine.time_open ?? "08:00:00").slice(0, 5))
                setTimeClose((mine.time_closes ?? "20:00:00").slice(0, 5))
            } else {
                setPharmacy(null)
                setName("")
                setCity("")
                setAddress("")
                setLat(null)
                setLng(null)
                setRc("")
                setTimeOpen("08:00")
                setTimeClose("20:00")
            }
        } catch {
            setPharmacy(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchPharmacy() }, [fetchPharmacy])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!lat || !lng) {
            toast({ title: "Location required", description: "Please pick your pharmacy location on the map.", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            const payload = {
                name,
                city: city || null,
                address,
                latitude: lat,
                longitude: lng,
                registre_commerce_number: rc,
                time_open: timeOpen ? `${timeOpen}:00` : null,
                time_closes: timeClose ? `${timeClose}:00` : null,
            }

            if (pharmacy) {
                await axiosClient.put(`/pharmacies/${pharmacy.id}`, payload)
                setLastAction("updated")
                toast({ title: "Profile updated!", description: "Your pharmacy profile has been saved." })
            } else {
                const created = await axiosClient.post("/pharmacies", payload)
                setPharmacy(created.data ?? null)
                setLastAction("created")
                toast({ title: "Profile created!", description: "Your pharmacy profile has been created." })
            }

            setSaved(true)
        } catch (e: any) {
            toast({ title: "Save failed", description: e.response?.data?.message ?? "Unknown error", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border bg-card p-10 flex items-center justify-center min-h-[260px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    Loading pharmacy profile...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                    </span>
                    Pharmacy Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                    {pharmacy
                        ? "Keep your pharmacy details up to date so your dashboard and map listing stay accurate."
                        : "You can create your pharmacy profile now. This is required to activate your pharmacy workspace."}
                </p>
            </div>

            {saved && (
                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3 text-green-700 dark:text-green-400 text-sm">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <p>{lastAction === "created" ? "Profile created successfully! Your pharmacy is now visible on the map." : "Profile saved successfully! Your pharmacy is now visible on the map."}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="name">Pharmacy Name *</Label>
                        <Input id="name" className="h-11" value={name} onChange={e => setName(e.target.value)} placeholder="Health Corner Pharmacy" required />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" className="h-11" value={city} onChange={e => setCity(e.target.value)} placeholder="Algiers" />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input id="address" className="h-11" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street, Algiers" required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="rc">Commerce Register #</Label>
                        <Input id="rc" className="h-11" value={rc} onChange={e => setRc(e.target.value)} placeholder="RC-1001" />
                    </div>

                    <div className="space-y-1.5" />

                    <div className="space-y-1.5">
                        <Label htmlFor="timeOpen">Opens At</Label>
                        <Input id="timeOpen" className="h-11" type="time" value={timeOpen} onChange={e => setTimeOpen(e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="timeClose">Closes At</Label>
                        <Input id="timeClose" className="h-11" type="time" value={timeClose} onChange={e => setTimeClose(e.target.value)} />
                    </div>
                </div>

                {/* Map location picker */}
                <div className="space-y-1.5">
                    <Label>Location on Map *</Label>
                    <div className="rounded-xl border overflow-hidden">
                        <LocationPicker
                            lat={lat}
                            lng={lng}
                            onChange={(la, lo) => handleLocationChange(la, lo, city, address)}
                            onCityChange={(detectedCity) => {
                                setCity(detectedCity ?? "")
                            }}
                            onAddressChange={(detectedAddress) => {
                                setAddress(detectedAddress ?? "")
                            }}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                    {pharmacy ? "Save Profile" : "Create Profile"}
                </Button>
            </form>
        </div>
    )
}
