"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Truck } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// API.md: PUT /api/suppliers/{id}
// Fields: company_name, address

type SupplierProfile = {
    id: number
    user: {
        id: number
        name: string
        email: string
        phone_number: string
        avatar_url: string
    }
    company_name: string
    address: string
}

export default function SupplierSetupPage() {
    const { toast } = useToast()
    const [supplier, setSupplier] = useState<SupplierProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Form fields
    const [companyName, setCompanyName] = useState("")
    const [address, setAddress] = useState("")

    const fetchSupplier = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axiosClient.get("/suppliers")
            const list: SupplierProfile[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
            const mine = list[0] ?? null
            if (mine) {
                setSupplier(mine)
                setCompanyName(mine.company_name ?? "")
                setAddress(mine.address ?? "")
            }
        } catch {
            setSupplier(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSupplier() }, [fetchSupplier])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supplier) return
        setSaving(true)
        try {
            await axiosClient.put(`/suppliers/${supplier.id}`, {
                company_name: companyName,
                address,
            })
            toast({ title: "Profile updated!", description: "Your supplier profile has been saved." })
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
                    Loading supplier profile...
                </div>
            </div>
        )
    }

    if (!supplier) {
        return (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-card/40">
                <Truck className="size-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No supplier profile found.</p>
                <p className="text-sm mt-1">Your approval request may still be pending.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Truck className="size-4" />
                    </span>
                    Supplier Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Keep your supplier details current so pharmacies can discover and contact you from the dashboard.
                </p>
            </div>

            {saved && (
                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3 text-green-700 dark:text-green-400 text-sm">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <p>Profile saved successfully!</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
                <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" className="h-11" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Pharmaceuticals" required />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" className="h-11" value={address} onChange={e => setAddress(e.target.value)} placeholder="Industrial Zone, Algiers" required />
                </div>

                <Button type="submit" className="w-full h-11" disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                    Save Profile
                </Button>
            </form>
        </div>
    )
}
