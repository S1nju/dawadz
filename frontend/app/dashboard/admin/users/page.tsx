"use client"
import { useEffect, useState } from "react"
import axiosClient from "@/lib/axios-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

type User = {
    id: number
    name: string
    email: string
    roles?: { name: string }[]
    created_at?: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                // Try /api/users — will work if backend exposes it, otherwise falls back
                const res = await axiosClient.get("/users", { params: { search } })
                const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                setUsers(data)
            } catch {
                // Fallback: derive users from approval requests (all authenticated users who made requests)
                try {
                    const res = await axiosClient.get("/approval-requests")
                    const data: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                    // Extract unique users from approval request payloads
                    const unique = new Map<number, User>()
                    data.forEach((r) => {
                        if (r.user && !unique.has(r.user.id)) {
                            unique.set(r.user.id, {
                                id: r.user.id,
                                name: r.user.name,
                                email: r.user.email,
                                created_at: r.created_at,
                            })
                        }
                    })
                    setUsers(Array.from(unique.values()))
                } catch {
                    setUsers([])
                }
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [search])

    const filtered = users.filter(
        (u) =>
            search === "" ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()),
    )

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                <p className="text-sm text-muted-foreground mt-1">All registered users on the platform.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles?.length
                                                ? user.roles.map((r) => (
                                                    <Badge key={r.name} variant="secondary">{r.name}</Badge>
                                                ))
                                                : <span className="text-muted-foreground text-xs">user</span>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
