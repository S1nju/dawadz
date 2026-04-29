"use client"

import { useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, CheckCircle2, XCircle, FileText, ImageIcon, Loader2, Eye } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// API.md: GET /api/approval-requests
// PATCH /api/approval-requests/{id}/status
// Body for accept: { status: "accepted", review_notes, pharmacy:{...} | supplier:{...} }

// Documents/images can arrive as strings or objects from the API
const toPath = (entry: any): string => {
    if (typeof entry === "string") return entry
    return entry?.path ?? entry?.url ?? entry?.name ?? String(entry)
}

const fileUrl = (entry: any): string => `/proxy-api/files/${toPath(entry)}`

type ApprovalRequest = {
    id: number
    type: "pharmacy" | "supplier"
    status: "pending" | "accepted" | "rejected"
    review_notes?: string
    documents?: string[]
    images?: string[]
    created_at: string
    user?: { id: number; name: string; email: string }
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
            {status}
        </span>
    )
}

// ─── Accept Dialog ─────────────────────────────────────────────────────────────
// The admin just confirms acceptance. The backend auto-creates the pharmacy/supplier
// profile and assigns the role. The user then fills in their own profile via their dashboard.
function AcceptDialog({
    request,
    onDone,
    onClose,
}: {
    request: ApprovalRequest
    onDone: () => void
    onClose: () => void
}) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [reviewNotes, setReviewNotes] = useState("")

    const handleAccept = async () => {
        setLoading(true)
        try {
            await axiosClient.patch(`/approval-requests/${request.id}/status`, {
                status: "accepted",
                review_notes: reviewNotes || undefined,
            })
            toast({ title: "Request accepted!", description: "The user has been notified and can now complete their profile." })
            onDone()
        } catch (e: any) {
            toast({ title: "Error", description: e.response?.data?.message ?? "Failed to accept.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-1.5 text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">✅ What happens when you accept:</p>
                <ul className="list-disc list-inside text-green-700 dark:text-green-400 space-y-1">
                    <li>A <strong>{request.type}</strong> profile is automatically created for this user</li>
                    <li>The user is assigned the <strong>{request.type}_admin</strong> role</li>
                    <li>They will be prompted to complete their profile on next login</li>
                </ul>
            </div>

            <div className="space-y-1.5">
                <Label>Review Notes (optional)</Label>
                <Input
                    placeholder="e.g. All documents verified, approved."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                />
            </div>

            <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                    Confirm Accept
                </Button>
            </div>
        </div>
    )
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<ApprovalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<ApprovalRequest | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [acceptOpen, setAcceptOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [rejectNotes, setRejectNotes] = useState("")
    const [rejecting, setRejecting] = useState(false)
    const { toast } = useToast()

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axiosClient.get("/approval-requests")
            const data: ApprovalRequest[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
            setRequests(data)
        } catch {
            setRequests([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchRequests() }, [fetchRequests])

    const handleReject = async () => {
        if (!selected) return
        setRejecting(true)
        try {
            await axiosClient.patch(`/approval-requests/${selected.id}/status`, {
                status: "rejected",
                review_notes: rejectNotes,
            })
            toast({ title: "Request rejected." })
            setRejectOpen(false)
            setRejectNotes("")
            fetchRequests()
        } catch (e: any) {
            toast({ title: "Error", description: e.response?.data?.message ?? "Failed.", variant: "destructive" })
        } finally {
            setRejecting(false)
        }
    }

    const filtered = requests.filter(r =>
        search === "" ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase()) ||
        r.status.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Approval Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">Review pharmacy and supplier join requests.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by user, type, status..."
                    className="pl-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Images</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="size-5 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No requests found.</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.user?.name ?? "—"}</div>
                                        <div className="text-xs text-muted-foreground">{req.user?.email ?? ""}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{req.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={req.status} />
                                    </TableCell>
                                    <TableCell>
                                        {req.documents && req.documents.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {req.documents.map((doc, i) => (
                                                    <a key={i} href={fileUrl(doc)} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                        <FileText className="size-3" /> {toPath(doc).split("/").pop()}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {req.images && req.images.length > 0 ? (
                                            <div className="flex gap-1">
                                                {req.images.map((img, i) => (
                                                    <a key={i} href={fileUrl(img)} target="_blank" rel="noreferrer"
                                                        className="block size-10 rounded overflow-hidden border hover:ring-2 ring-primary">
                                                        <img src={fileUrl(img)} alt={`img-${i}`} className="size-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* View details */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="View Details"
                                                onClick={() => { setSelected(req); setDetailOpen(true) }}
                                            >
                                                <Eye className="size-4" />
                                            </Button>

                                            {/* Accept — only for pending */}
                                            {req.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Accept"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    onClick={() => { setSelected(req); setAcceptOpen(true) }}
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                </Button>
                                            )}

                                            {/* Reject — only for pending */}
                                            {req.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Reject"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => { setSelected(req); setRejectNotes(""); setRejectOpen(true) }}
                                                >
                                                    <XCircle className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Detail Dialog */}
            {selected && (
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Request #{selected.id} Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-muted-foreground">Applicant:</span><p className="font-medium">{selected.user?.name}</p></div>
                                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selected.user?.email}</p></div>
                                <div><span className="text-muted-foreground">Type:</span><p className="font-medium capitalize">{selected.type}</p></div>
                                <div><span className="text-muted-foreground">Status:</span><p><StatusBadge status={selected.status} /></p></div>
                                {selected.review_notes && (
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Review Notes:</span>
                                        <p className="font-medium mt-0.5">{selected.review_notes}</p>
                                    </div>
                                )}
                                <div><span className="text-muted-foreground">Submitted:</span><p>{new Date(selected.created_at).toLocaleString()}</p></div>
                            </div>

                            {selected.documents && selected.documents.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-2 flex items-center gap-1.5"><FileText className="size-4" /> Documents</p>
                                    <div className="space-y-1">
                                        {selected.documents.map((doc, i) => (
                                            <a key={i} href={fileUrl(doc)} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 text-primary text-xs">
                                                <FileText className="size-3.5 shrink-0" />
                                                {toPath(doc).split("/").pop()}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selected.images && selected.images.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-2 flex items-center gap-1.5"><ImageIcon className="size-4" /> Images</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selected.images.map((img, i) => (
                                            <a key={i} href={fileUrl(img)} target="_blank" rel="noreferrer"
                                                className="block rounded overflow-hidden border aspect-square hover:ring-2 ring-primary">
                                                <img src={fileUrl(img)} alt={`img-${i}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Accept Dialog */}
            {selected && (
                <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Accept Request — Create {selected.type === "pharmacy" ? "Pharmacy" : "Supplier"}</DialogTitle>
                        </DialogHeader>
                        <AcceptDialog
                            request={selected}
                            onDone={() => { setAcceptOpen(false); fetchRequests() }}
                            onClose={() => setAcceptOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}
            {/* Reject Dialog */}
            {selected && (
                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Reject Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-1">
                            <p className="text-sm text-muted-foreground">
                                Rejecting request from <strong>{selected.user?.name}</strong> ({selected.type}).
                                Optionally provide a reason that will be saved as review notes.
                            </p>
                            <div className="space-y-1.5">
                                <Label htmlFor="rejectNotes">Rejection Reason</Label>
                                <textarea
                                    id="rejectNotes"
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    placeholder="e.g. Missing documents, incomplete information..."
                                    value={rejectNotes}
                                    onChange={e => setRejectNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)} disabled={rejecting}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    onClick={handleReject}
                                    disabled={rejecting}
                                >
                                    {rejecting ? <Loader2 className="size-4 animate-spin mr-2" /> : <XCircle className="size-4 mr-2" />}
                                    Confirm Reject
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
