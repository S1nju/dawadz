"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Package, ShoppingCart, TrendingUp, Store } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

type GenericModel = { id: number; status?: string }
type PostModel = { qte_vente?: number; product?: { prix_vente?: number } }
type CommandeLine = { qte?: number; total?: number }
type CommandeModel = GenericModel & { lines?: CommandeLine[] }

const toArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[]
    if (Array.isArray(payload?.data)) return payload.data as T[]
    return []
}

const toNumber = (value: unknown): number => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export default function SupplierDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [products, setProducts] = useState<any[]>([])
    const [posts, setPosts] = useState<PostModel[]>([])
    const [commandes, setCommandes] = useState<CommandeModel[]>([])

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            setError(null)
            try {
                const [prodRes, postRes, cmdRes] = await Promise.all([
                    axiosClient.get("/products", { params: { per_page: 500 } }),
                    axiosClient.get("/supplier-posts", { params: { per_page: 500 } }),
                    axiosClient.get("/commandes", { params: { per_page: 500 } }),
                ])
                setProducts(toArray(prodRes.data))
                setPosts(toArray(postRes.data))
                setCommandes(toArray(cmdRes.data))
            } catch {
                setError("Unable to load supplier stats right now.")
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    const stats = useMemo(() => {
        const totalProducts = products.length

        let activePostsQty = 0
        let activePostsValue = 0

        posts.forEach(post => {
            const q = toNumber(post.qte_vente)
            const p = toNumber(post.product?.prix_vente)
            activePostsQty += q
            activePostsValue += (q * p)
        })

        let pendingOrders = 0
        let totalRevenue = 0

        commandes.forEach(c => {
            const status = (c.status ?? "").toLowerCase()
            if (status === "pending" || status === "processing") {
                pendingOrders++
            }
            if (status === "confirmed" || status === "delivered") {
                if (Array.isArray(c.lines)) {
                    totalRevenue += c.lines.reduce((acc, l) => acc + toNumber(l.total), 0)
                }
            }
        })

        return { totalProducts, activePostsQty, activePostsValue, pendingOrders, totalRevenue }
    }, [products, posts, commandes])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your catalog, orders, and marketplace offers.</p>
                </div>
            </div>

            {loading && (
                <div className="rounded-2xl border bg-card p-10 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mr-2" /> Loading stats...
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Pending Orders"
                            value={stats.pendingOrders.toString()}
                            subtitle="Require your approval"
                            icon={ShoppingCart}
                            valueClassName={stats.pendingOrders > 0 ? "text-amber-600" : ""}
                        />
                        <StatCard
                            title="Catalog Products"
                            value={stats.totalProducts.toString()}
                            subtitle="Total items offered"
                            icon={Package}
                        />
                        <StatCard
                            title="Confirmed Revenue"
                            value={`${Math.round(stats.totalRevenue).toLocaleString()} DA`}
                            subtitle="From accepted orders"
                            icon={TrendingUp}
                        />
                        <StatCard
                            title="Marketplace Offers"
                            value={stats.activePostsQty.toLocaleString()}
                            subtitle={`Est. value: ${Math.round(stats.activePostsValue).toLocaleString()} DA`}
                            icon={Store}
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Marketplace Stock Available</h3>
                            <div className="h-[300px]">
                                {posts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={
                                                posts
                                                    .sort((a, b) => toNumber(b.qte_vente) - toNumber(a.qte_vente))
                                                    .slice(0, 6)
                                                    .map(item => ({
                                                        name: (item as any).title || (item as any).product?.medication?.name || `Post #${(item as any).id}`,
                                                        qty: toNumber(item.qte_vente)
                                                    }))
                                            }
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0, 10) + "..."} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="qty" fill="#10b981" radius={[4, 4, 0, 0]} name="Offered Qty" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No marketplace offers yet</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Orders Pipeline</h3>
                            <div className="h-[300px]">
                                {commandes.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Pending', value: commandes.filter(c => c.status === 'pending').length },
                                                    { name: 'Confirmed', value: commandes.filter(c => c.status === 'confirmed').length },
                                                    { name: 'Processing', value: commandes.filter(c => c.status === 'processing').length },
                                                    { name: 'Delivered', value: commandes.filter(c => c.status === 'delivered').length },
                                                    { name: 'Cancelled', value: commandes.filter(c => c.status === 'cancelled').length },
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#fcd34d" />
                                                <Cell fill="#60a5fa" />
                                                <Cell fill="#818cf8" />
                                                <Cell fill="#34d399" />
                                                <Cell fill="#f87171" />
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    valueClassName,
}: {
    title: string
    value: string
    subtitle: string
    icon: React.ComponentType<{ className?: string }>
    valueClassName?: string
}) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/30 transition-colors">
            <div className="p-6 flex flex-row items-center justify-between pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
                <Icon className="size-4 text-primary" />
            </div>
            <div className="p-6 pt-0">
                <div className={`text-3xl font-bold ${valueClassName ?? ""}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
            </div>
        </div>
    )
}
