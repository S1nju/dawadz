"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Users, Building2, Truck, ClipboardList, Activity } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

type GenericStat = { id: number; status?: string }

const toArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[]
    if (Array.isArray(payload?.data)) return payload.data as T[]
    return []
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pharmacies, setPharmacies] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [requests, setRequests] = useState<GenericStat[]>([])
    const [medications, setMedications] = useState<any[]>([])

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            setError(null)
            try {
                const [pharmRes, supRes, reqRes, medRes] = await Promise.all([
                    axiosClient.get("/pharmacies", { params: { per_page: 500 } }),
                    axiosClient.get("/suppliers", { params: { per_page: 500 } }),
                    axiosClient.get("/approval-requests", { params: { per_page: 500 } }),
                    axiosClient.get("/medications", { params: { per_page: 500 } }),
                ])
                setPharmacies(toArray(pharmRes.data))
                setSuppliers(toArray(supRes.data))
                setRequests(toArray(reqRes.data))
                setMedications(toArray(medRes.data))
            } catch {
                setError("Unable to load admin stats right now.")
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    const stats = useMemo(() => {
        const totalPharmacies = pharmacies.length
        const totalSuppliers = suppliers.length
        const totalMedications = medications.length
        const pendingRequests = requests.filter(r => (r.status || "pending") === "pending").length

        return { totalPharmacies, totalSuppliers, pendingRequests, totalMedications }
    }, [pharmacies, suppliers, requests, medications])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-1">Platform overview and registration management.</p>
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
                        <StatCard title="Active Pharmacies" value={stats.totalPharmacies.toString()} subtitle="Registered on platform" icon={Building2} />
                        <StatCard title="Active Suppliers" value={stats.totalSuppliers.toString()} subtitle="Registered on platform" icon={Truck} />
                        <StatCard title="Pending Approvals" value={stats.pendingRequests.toString()} subtitle="Awaiting admin action" icon={ClipboardList} valueClassName={stats.pendingRequests > 0 ? "text-amber-600" : ""} />
                        <StatCard title="Medications Catalog" value={stats.totalMedications.toString()} subtitle="Total known drugs" icon={Activity} />
                    </div>

                    {/* Charts Section */}
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Platform Composition</h3>
                            <div className="h-[300px]">
                                {stats.totalPharmacies > 0 || stats.totalSuppliers > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                { name: 'Pharmacies', users: stats.totalPharmacies },
                                                { name: 'Suppliers', users: stats.totalSuppliers },
                                            ]}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Registered" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No platform users yet</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6">Requests Breakdown by Status</h3>
                            <div className="h-[300px]">
                                {requests.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Pending', value: requests.filter(r => r.status === 'pending').length },
                                                    { name: 'Approved', value: requests.filter(r => r.status === 'approved').length },
                                                    { name: 'Rejected', value: requests.filter(r => r.status === 'rejected').length },
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#fcd34d" /> {/* Pending */}
                                                <Cell fill="#34d399" /> {/* Approved */}
                                                <Cell fill="#f87171" /> {/* Rejected */}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No requests captured</div>
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
                <div className={`text-3xl font-bold ${valueClassName ?? ""}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
            </div>
        </div>
    )
}
