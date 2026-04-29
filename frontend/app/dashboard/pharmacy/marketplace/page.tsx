"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Search, ShoppingCart, Package, Info, Loader2 } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

type SupplierPost = {
    id: number
    supplier_id?: number
    title: string
    description: string
    qte_vente: number
    image?: string
    product?: {
        id?: number
        medication?: { name: string; dosage: string }
        prix_vente?: number
    }
    supplier?: {
        id?: number
        name?: string
        company_name?: string
        address?: string
        user?: { name?: string }
    }
}

type SupplierOption = {
    id: number
    label: string
}

export default function PharmacyMarketplacePage() {
    const [posts, setPosts] = useState<SupplierPost[]>([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [city, setCity] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [supplierId, setSupplierId] = useState("all")
    const [orderModalOpen, setOrderModalOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<SupplierPost | null>(null)
    const [orderQty, setOrderQty] = useState(1)
    const [ordering, setOrdering] = useState(false)
    const { toast } = useToast()

    const supplierOptions: SupplierOption[] = posts.reduce<SupplierOption[]>((acc, post) => {
        const id = post.supplier?.id ?? post.supplier_id
        if (!id || acc.some((item) => item.id === id)) return acc

        const label = post.supplier?.company_name || post.supplier?.name || post.supplier?.user?.name || `Supplier #${id}`
        acc.push({ id, label })
        return acc
    }, [])

    const fetchPosts = useCallback(async (filters: { search: string; city: string; companyName: string; supplierId: string }) => {
        setLoading(true)
        setApiError(null)
        try {
            const params: Record<string, string | number> = { per_page: 20 }

            if (filters.search.trim()) params.search = filters.search.trim()
            if (filters.city.trim()) params.city = filters.city.trim()
            if (filters.companyName.trim()) params.company_name = filters.companyName.trim()
            if (filters.supplierId !== "all") params.supplier_id = Number(filters.supplierId)

            const res = await axiosClient.get("/supplier-posts", { params })
            const data: SupplierPost[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
            setPosts(data)
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.message ?? "Failed to load posts."
            setApiError(msg)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts({ search: "", city: "", companyName: "", supplierId: "all" })
    }, [fetchPosts])

    useEffect(() => {
        const t = setTimeout(() => {
            fetchPosts({ search, city, companyName, supplierId })
        }, 500)
        return () => clearTimeout(t)
    }, [search, city, companyName, supplierId, fetchPosts])

    const openOrderModal = (post: SupplierPost) => {
        setSelectedPost(post)
        setOrderQty(1)
        setOrderModalOpen(true)
    }

    const handleOrder = async () => {
        if (!selectedPost) return
        try {
            const medicationName = selectedPost.product?.medication?.name || selectedPost.title
            const unitPrice = Number(selectedPost.product?.prix_vente ?? 0)
            const supplierId = selectedPost.supplier?.id ?? selectedPost.supplier_id ?? null
            const supplierDisplayName = selectedPost.supplier?.company_name
                || selectedPost.supplier?.name
                || selectedPost.supplier?.user?.name
                || "Marketplace Supplier"

            setOrdering(true)

            await axiosClient.post("/commandes", {
                supplier_id: supplierId,
                external_supplier_name: supplierId ? undefined : supplierDisplayName,
                notes: `Order from marketplace post: ${selectedPost.title}`,
                lines: [
                    {
                        product_id: selectedPost.product?.id ?? null,
                        medication_name: medicationName,
                        qte: orderQty,
                        unit_price: unitPrice,
                    },
                ],
            })
            toast({ title: "Order Placed!", description: `Your commande for "${selectedPost.title}" was submitted.` })
            setOrderModalOpen(false)
            setSelectedPost(null)
        } catch (e: any) {
            toast({
                title: "Could not place order",
                description: e.response?.data?.message ?? "Please try again.",
                variant: "destructive",
            })
        } finally {
            setOrdering(false)
        }
    }

    const filtered = search
        ? posts.filter(p => {
            const q = search.toLowerCase()
            return (
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.product?.medication?.name?.toLowerCase().includes(q) ||
                (p.product?.medication as any)?.commercial_name?.toLowerCase().includes(q) ||
                p.supplier?.company_name?.toLowerCase().includes(q) ||
                p.supplier?.name?.toLowerCase().includes(q)
            )
        })
        : posts

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Browse supplier stock offers and place commandes directly.
                </p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="relative">
                    {loading
                        ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-primary animate-spin" />
                        : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    }
                    <Input
                        placeholder="Search posts..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Input
                    placeholder="Filter by city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />

                <Input
                    placeholder="Filter by company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />

                <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All suppliers</SelectItem>
                        {supplierOptions.map((supplier) => (
                            <SelectItem key={supplier.id} value={String(supplier.id)}>
                                {supplier.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* API error banner */}
            {apiError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Could not load marketplace posts</p>
                        <p className="text-xs mt-0.5 opacity-80">{apiError}</p>
                    </div>
                </div>
            )}

            {/* Card grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-52 rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 && !apiError ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                    <Info className="size-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No posts found.</p>
                    <p className="text-sm mt-1">Suppliers haven't posted any offers yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((post) => (
                        <div
                            key={post.id}
                            className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden group"
                        >
                            {/* Image */}
                            {post.image ? (
                                <div className="h-36 bg-muted overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                                    />
                                </div>
                            ) : (
                                <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                    <Package className="size-12 text-primary/30" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex flex-col flex-1 p-4 gap-3">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                            {post.title}
                                        </h3>
                                        {post.qte_vente ? (
                                            <Badge variant="secondary" className="shrink-0 text-xs">
                                                Qty: {post.qte_vente}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    {post.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    {post.product?.medication && (
                                        <span className="font-medium text-foreground">
                                            💊 {post.product.medication.name}
                                            {post.product.medication.dosage ? ` — ${post.product.medication.dosage}` : ""}
                                        </span>
                                    )}
                                    {(post.supplier?.company_name || post.supplier?.name || post.supplier?.user?.name) && (
                                        <span>
                                            Supplier: {post.supplier?.company_name || post.supplier?.name || post.supplier?.user?.name}
                                        </span>
                                    )}
                                    {post.supplier?.address && (
                                        <span className="line-clamp-1">City/Address: {post.supplier.address}</span>
                                    )}
                                    {post.product?.prix_vente !== undefined && (
                                        <span className="font-semibold text-primary text-sm">
                                            {post.product.prix_vente.toLocaleString()} DA / unit
                                        </span>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    className="mt-auto w-full rounded-xl"
                                    onClick={() => openOrderModal(post)}
                                >
                                    <ShoppingCart className="size-4 mr-2" />
                                    Place Order
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Place Order</DialogTitle>
                        <DialogDescription>
                            Confirm your quantity before submitting this order.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPost && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/20 p-3">
                                <p className="text-sm font-semibold">{selectedPost.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedPost.product?.medication?.name || "Medication"}
                                    {selectedPost.product?.medication?.dosage ? ` • ${selectedPost.product.medication.dosage}` : ""}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Available: {selectedPost.qte_vente}
                                </p>
                                <p className="text-sm font-semibold text-primary mt-2">
                                    {Number(selectedPost.product?.prix_vente ?? 0).toLocaleString()} DA / unit
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orderQty">Quantity</Label>
                                <Input
                                    id="orderQty"
                                    type="number"
                                    min={1}
                                    max={Math.max(1, selectedPost.qte_vente || 1)}
                                    value={orderQty}
                                    onChange={(e) => {
                                        const value = Number(e.target.value)
                                        const capped = Math.max(1, Math.min(Math.max(1, selectedPost.qte_vente || 1), value || 1))
                                        setOrderQty(capped)
                                    }}
                                />
                            </div>

                            <div className="rounded-lg border bg-background p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Estimated total</span>
                                    <span className="font-semibold">
                                        {(orderQty * Number(selectedPost.product?.prix_vente ?? 0)).toLocaleString()} DA
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderModalOpen(false)} disabled={ordering}>Cancel</Button>
                        <Button onClick={handleOrder} disabled={ordering || !selectedPost}>
                            {ordering ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShoppingCart className="size-4 mr-2" />}
                            Confirm Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
