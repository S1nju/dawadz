"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Package, Loader2, Search } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// API.md: POST/PUT /api/supplier-posts
// { supplier_id, product_id, title, description, image, qte_vente }

type SupplierPost = {
    id: number
    title: string
    description?: string
    image?: string
    qte_vente?: number
    product_id?: number
    product?: { id: number; medication?: { name: string; commercial_name?: string } }
    supplier_id?: number
    supplier?: { company_name?: string; name?: string }
}

const EMPTY: Omit<SupplierPost, "id"> = {
    title: "",
    description: "",
    image: "",
    qte_vente: undefined,
    product_id: undefined,
}

export default function SupplierPostsPage() {
    const { toast } = useToast()
    const [posts, setPosts] = useState<SupplierPost[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editPost, setEditPost] = useState<SupplierPost | null>(null)
    const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [apiError, setApiError] = useState<string | null>(null)

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        setApiError(null)
        try {
            const res = await axiosClient.get("/supplier-posts")
            // Handle: array | { data: [...] } | { posts: [...] } | paginated
            let data: SupplierPost[] = []
            if (Array.isArray(res.data)) {
                data = res.data
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data
            } else if (Array.isArray(res.data?.posts)) {
                data = res.data.posts
            }
            setPosts(data)
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.message ?? "Failed to load posts."
            setApiError(msg)
            // Keep existing posts visible so the UI isn't wiped on a transient error
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchPosts() }, [fetchPosts])

    const openAdd = () => {
        setForm({ ...EMPTY })
        setEditPost(null)
        setDialogOpen(true)
    }

    const openEdit = (post: SupplierPost) => {
        setForm({
            title: post.title ?? "",
            description: post.description ?? "",
            image: post.image ?? "",
            qte_vente: post.qte_vente,
            product_id: post.product_id,
        })
        setEditPost(post)
        setDialogOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editPost) {
                const res = await axiosClient.put(`/supplier-posts/${editPost.id}`, form)
                const updated: SupplierPost = res.data?.data ?? res.data
                // Update optimistically in local list
                setPosts(prev => prev.map(p => p.id === editPost.id ? { ...p, ...updated, ...form } : p))
                toast({ title: "Post updated." })
            } else {
                const res = await axiosClient.post("/supplier-posts", form)
                const created: SupplierPost = res.data?.data ?? res.data
                // Optimistically prepend to local list — avoids relying on GET being supplier-accessible
                setPosts(prev => [created ?? { id: Date.now(), ...form }, ...prev])
                toast({ title: "Post created." })
            }
            setDialogOpen(false)
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message ?? "Failed to save.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setDeleting(true)
        try {
            await axiosClient.delete(`/supplier-posts/${deleteId}`)
            toast({ title: "Post deleted." })
            // Remove from local list optimistically
            setPosts(prev => prev.filter(p => p.id !== deleteId))
            setDeleteId(null)
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message ?? "Failed.", variant: "destructive" })
        } finally {
            setDeleting(false)
        }
    }

    const filtered = posts.filter(p => {
        if (!search) return true
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

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">Supplier Posts</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your product listings visible to pharmacies.</p>
                </div>
                <Button onClick={openAdd}>
                    <Plus className="size-4 mr-2" /> Add Post
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search posts..."
                    className="pl-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* API error banner */}
            {apiError && (
                <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <div>
                        <p className="font-medium">Could not load posts from server</p>
                        <p className="text-xs mt-0.5 opacity-80">{apiError}</p>
                        <p className="text-xs mt-1">Posts you create here will still appear above. The list will refresh on the next page load.</p>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-52">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">
                    <Package className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No posts yet.</p>
                    <p className="text-sm mt-1">Click "Add Post" to create your first listing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(post => (
                        <div
                            key={post.id}
                            className="rounded-xl border bg-card overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Image */}
                            {post.image ? (
                                <div className="h-40 bg-muted overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                                    />
                                </div>
                            ) : (
                                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                    <Package className="size-12 text-primary/30" />
                                </div>
                            )}

                            {/* Body */}
                            <div className="p-4 flex flex-col gap-2 flex-1">
                                <h3 className="font-semibold text-base line-clamp-1">{post.title}</h3>
                                {post.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
                                )}

                                <div className="mt-auto pt-3 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        {post.product?.medication?.name && (
                                            <p className="text-xs text-muted-foreground">
                                                💊 {post.product.medication.name}
                                            </p>
                                        )}
                                        {post.qte_vente !== undefined && (
                                            <p className="text-xs font-medium text-primary">
                                                Qty: {post.qte_vente}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => openEdit(post)}
                                        >
                                            <Edit className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteId(post.id)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editPost ? "Edit Post" : "New Post"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Product</Label>
                            <SearchSelectField
                                endpoint="/products"
                                labelKey="medication.name"
                                value={form.product_id}
                                onChange={v => setForm(f => ({ ...f, product_id: Number(v) }))}
                                placeholder="Select product..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="desc">Description</Label>
                            <textarea
                                id="desc"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                value={form.description ?? ""}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="qty">Qty for Sale</Label>
                                <Input id="qty" type="number" value={form.qte_vente ?? ""} onChange={e => setForm(f => ({ ...f, qte_vente: Number(e.target.value) || undefined }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="img">Image URL</Label>
                                <Input id="img" value={form.image ?? ""} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            {editPost ? "Save Changes" : "Create Post"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Post?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── Inline SearchSelect for this page ──────────────────────────────────────
function SearchSelectField({
    endpoint,
    labelKey,
    value,
    onChange,
    placeholder = "Select...",
}: {
    endpoint: string
    labelKey: string
    value: number | undefined
    onChange: (v: number) => void
    placeholder?: string
}) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<{ value: number; label: string }[]>([])
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)

    const fetch = useCallback(async (q: string) => {
        setLoading(true)
        try {
            const res = await axiosClient.get(endpoint, { params: { search: q, per_page: 30 } })
            const data: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
            setOptions(data.map(item => {
                // Support dot-notation labelKey like "medication.name"
                const label = labelKey.split(".").reduce((o: any, k) => o?.[k], item) ?? `#${item.id}`
                return { value: item.id, label: String(label) }
            }))
        } catch {
            setOptions([])
        } finally {
            setLoading(false)
        }
    }, [endpoint, labelKey])

    useEffect(() => { if (value) fetch("") }, []) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (open) fetch(query) }, [open, query, fetch])

    const selected = options.find(o => o.value === value)

    return (
        <div className="relative">
            <button
                type="button"
                className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent"
                onClick={() => setOpen(o => !o)}
            >
                <span className={selected ? "" : "text-muted-foreground"}>{selected?.label ?? placeholder}</span>
                <svg className="size-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M16 15l-4 4-4-4" /></svg>
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    <div className="p-2">
                        <Input
                            autoFocus
                            placeholder="Search..."
                            value={query}
                            onChange={e => { setQuery(e.target.value); fetch(e.target.value) }}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                        {loading && <p className="px-3 py-2 text-xs text-muted-foreground">Loading...</p>}
                        {!loading && options.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No results.</p>}
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${opt.value === value ? "font-medium text-primary" : ""}`}
                                onClick={() => { onChange(opt.value); setOpen(false) }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
