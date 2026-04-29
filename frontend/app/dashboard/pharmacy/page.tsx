"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Package, AlertTriangle, ShoppingCart, Receipt, BarChart3, Wallet } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

type Inventory = {
    qte?: number
    prix_achat?: number
    prix_vente?: number
}

type Commande = {
    status?: string
}

type Facture = {
    status?: string
    total_ttc?: number
}

const toArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[]
    if (Array.isArray(payload?.data)) return payload.data as T[]
    return []
}

const toNumber = (value: unknown): number => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export default function PharmacyDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [inventories, setInventories] = useState<Inventory[]>([])
    const [commandes, setCommandes] = useState<Commande[]>([])
    const [factures, setFactures] = useState<Facture[]>([])

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            setError(null)

            try {
                const [inventoriesRes, commandesRes, facturesRes] = await Promise.all([
                    axiosClient.get("/inventories", { params: { per_page: 500 } }),
                    axiosClient.get("/commandes", { params: { per_page: 500 } }),
                    axiosClient.get("/factures", { params: { per_page: 500 } }),
                ])

                setInventories(toArray<Inventory>(inventoriesRes.data))
                setCommandes(toArray<Commande>(commandesRes.data))
                setFactures(toArray<Facture>(facturesRes.data))
            } catch {
                setError("Unable to load dashboard stats right now.")
                setInventories([])
                setCommandes([])
                setFactures([])
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [])

    const stats = useMemo(() => {
        const totalProducts = inventories.length
        const totalUnits = inventories.reduce((acc, item) => acc + toNumber(item.qte), 0)
        const lowStock = inventories.filter((item) => {
            const qte = toNumber(item.qte)
            return qte > 0 && qte <= 10
        }).length
        const outOfStock = inventories.filter((item) => toNumber(item.qte) === 0).length

        const purchaseValue = inventories.reduce(
            (acc, item) => acc + (toNumber(item.qte) * toNumber(item.prix_achat)),
            0,
        )
        const saleValue = inventories.reduce(
            (acc, item) => acc + (toNumber(item.qte) * toNumber(item.prix_vente)),
            0,
        )

        const pendingOrders = commandes.filter((c) => {
            const status = (c.status ?? "").toLowerCase()
            return status === "pending" || status === "processing"
        }).length

        const paidInvoices = factures.filter((f) => (f.status ?? "").toLowerCase() === "paid")
        const paidRevenue = paidInvoices.reduce((acc, f) => acc + toNumber(f.total_ttc), 0)

        return {
            totalProducts,
            totalUnits,
            lowStock,
            outOfStock,
            purchaseValue,
            saleValue,
            pendingOrders,
            paidRevenue,
        }
    }, [inventories, commandes, factures])

    const money = (value: number) => `${Math.round(value).toLocaleString()} DA`

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-1">Live performance snapshot for inventory, orders, and invoices.</p>
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Products in Inventory" value={stats.totalProducts.toString()} subtitle="Active medication lines" icon={Package} />
                        <StatCard title="Total Units in Stock" value={stats.totalUnits.toLocaleString()} subtitle="Across all inventory items" icon={BarChart3} />
                        <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} subtitle="Pending + processing commandes" icon={ShoppingCart} />
                        <StatCard title="Paid Revenue" value={money(stats.paidRevenue)} subtitle="From paid invoices" icon={Wallet} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Low Stock Alerts" value={stats.lowStock.toString()} subtitle="Items with 10 units or less" icon={AlertTriangle} valueClassName="text-amber-600" />
                        <StatCard title="Out of Stock" value={stats.outOfStock.toString()} subtitle="Need immediate restock" icon={AlertTriangle} valueClassName="text-red-600" />
                        <StatCard title="Inventory Cost Value" value={money(stats.purchaseValue)} subtitle="Based on purchase prices" icon={Receipt} />
                        <StatCard title="Potential Sales Value" value={money(stats.saleValue)} subtitle="Based on selling prices" icon={Receipt} />
                    </div>

                    {/* Charts Section */}
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Top Inventory Levels</h3>
                            <div className="h-[300px]">
                                {inventories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={
                                                inventories
                                                    .sort((a, b) => toNumber(b.qte) - toNumber(a.qte))
                                                    .slice(0, 7)
                                                    .map(item => ({
                                                        name: (item as any).product?.medication?.name || `Item #${(item as any).id}`,
                                                        stock: toNumber(item.qte)
                                                    }))
                                            }
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0, 10) + "..."} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="stock" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Stock Qty" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Orders Setup by Status</h3>
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
                                                <Cell fill="#fcd34d" /> {/* Pending */}
                                                <Cell fill="#60a5fa" /> {/* Confirmed */}
                                                <Cell fill="#818cf8" /> {/* Processing */}
                                                <Cell fill="#34d399" /> {/* Delivered */}
                                                <Cell fill="#f87171" /> {/* Cancelled */}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough orders</div>
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
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
                <Icon className="size-4 text-primary" />
            </div>
            <div className="p-6 pt-0">
                <div className={`text-2xl font-bold ${valueClassName ?? ""}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
        </div>
    )
}
