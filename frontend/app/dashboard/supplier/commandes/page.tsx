"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X, Printer, Eye, Package } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type CommandeLine = {
    id: number
    medication_name: string
    qte: number
    unit_price: number
    total: number
}

type Commande = {
    id: number
    status: string
    ordered_at: string
    confirmed_at?: string
    notes?: string
    pharmacy?: { name: string }
    lines: CommandeLine[]
}

export default function SupplierCommandesPage() {
    const { toast } = useToast()
    const [commandes, setCommandes] = useState<Commande[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<number | null>(null)
    const [printCommande, setPrintCommande] = useState<Commande | null>(null)
    const [printType, setPrintType] = useState<"bon" | "facture" | null>(null)

    const fetchCommandes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axiosClient.get("/commandes", { params: { per_page: 50 } })
            const data: Commande[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
            setCommandes(data)
        } catch (err: any) {
            toast({ title: "Error", description: "Failed to load commandes.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { fetchCommandes() }, [fetchCommandes])

    const handleAccept = async (id: number) => {
        setActionLoading(id)
        try {
            await axiosClient.patch(`/commandes/${id}/confirm`)
            toast({ title: "Commande accepted." })
            fetchCommandes()
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to accept.", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
    }

    const handleRefuse = async (commande: Commande) => {
        setActionLoading(commande.id)
        try {
            await axiosClient.put(`/commandes/${commande.id}`, {
                status: "cancelled",
                lines: commande.lines.map(l => ({
                    product_id: (l as any).product_id,
                    medication_name: l.medication_name,
                    qte: l.qte,
                    unit_price: l.unit_price,
                    total: l.total,
                })) // Required by update validation
            })
            toast({ title: "Commande refused." })
            fetchCommandes()
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to refuse.", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
    }

    const openPrint = (commande: Commande, type: "bon" | "facture") => {
        setPrintCommande(commande)
        setPrintType(type)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
                <p className="text-sm text-muted-foreground mt-1">Review, accept, or refuse incoming pharmacy orders.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
            ) : commandes.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                    <Package className="size-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No orders yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {commandes.map(cmd => {
                        const total = cmd.lines.reduce((acc, l) => acc + Number(l.total), 0)
                        return (
                            <div key={cmd.id} className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-base shrink-0">Order #{cmd.id}</h3>
                                        <Badge
                                            variant={cmd.status === "confirmed" ? "default" : cmd.status === "cancelled" ? "destructive" : "secondary"}
                                            className="px-2 py-0.5 mt-0.5 text-xs font-medium"
                                        >
                                            {cmd.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1.5 space-y-0.5">
                                        <p><strong>Pharmacy:</strong> {cmd.pharmacy?.name ?? "Unknown"}</p>
                                        <p><strong>Date:</strong> {new Date(cmd.ordered_at).toLocaleDateString()}</p>
                                        <p><strong>Total:</strong> {total.toLocaleString()} DA</p>
                                        <p className="text-xs mt-1">({cmd.lines.length} items)</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    {cmd.status === "pending" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                                size="sm"
                                                disabled={actionLoading === cmd.id}
                                                onClick={() => handleRefuse(cmd)}
                                            >
                                                {actionLoading === cmd.id ? <Loader2 className="size-4 animate-spin mr-1" /> : <X className="size-4 mr-1" />}
                                                Refuse
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={actionLoading === cmd.id}
                                                onClick={() => handleAccept(cmd.id)}
                                            >
                                                {actionLoading === cmd.id ? <Loader2 className="size-4 animate-spin mr-1" /> : <Check className="size-4 mr-1" />}
                                                Accept
                                            </Button>
                                        </>
                                    )}

                                    {cmd.status === "confirmed" && (
                                        <>
                                            <Button variant="secondary" size="sm" onClick={() => openPrint(cmd, "bon")}>
                                                <Printer className="size-3.5 mr-1.5" /> Bon de Commande
                                            </Button>
                                            <Button variant="default" size="sm" onClick={() => openPrint(cmd, "facture")}>
                                                <Printer className="size-3.5 mr-1.5" /> Facture
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Print Dialog */}
            <PrintDialog
                commande={printCommande}
                type={printType}
                isOpen={!!printCommande}
                onClose={() => { setPrintCommande(null); setPrintType(null) }}
            />
        </div>
    )
}

function PrintDialog({
    commande,
    type,
    isOpen,
    onClose
}: {
    commande: Commande | null
    type: "bon" | "facture" | null
    isOpen: boolean
    onClose: () => void
}) {
    if (!commande || !type) return null
    const printRef = useRef<HTMLDivElement>(null)

    const handleActualPrint = () => {
        if (!printRef.current) return

        const printContent = printRef.current.innerHTML

        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) return

        doc.open()
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    ${document.head.innerHTML}
                    <style>
                        body { background: white !important; -webkit-print-color-adjust: exact; padding: 20px; }
                        @media print {
                            @page { margin: 0.5cm; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `)
        doc.close()

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 1000)
            }
        }, 500)
    }

    const total = commande.lines.reduce((acc, l) => acc + Number(l.total), 0)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="print:hidden">
                    <DialogTitle>Print {type === "bon" ? "Bon de Commande" : "Facture"}</DialogTitle>
                </DialogHeader>

                <div ref={printRef} className="print-container bg-white text-black p-8 rounded-md font-sans">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {type === "bon" ? "BON DE COMMANDE" : "FACTURE"}
                            </h1>
                            <p className="text-gray-500 mt-1">ID: #{commande.id}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-lg">DawaDz Marketplace</p>
                            <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Info block */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">Pharmacy</p>
                            <p className="font-medium text-lg">{commande.pharmacy?.name ?? "Unknown Pharmacy"}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-500 uppercase">Order Details</p>
                            <p className="text-sm">Status: <strong>{commande.status.toUpperCase()}</strong></p>
                            <p className="text-sm">Ordered: {new Date(commande.ordered_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left border-collapse mb-8">
                        <thead>
                            <tr className="border-b-2 font-medium text-gray-700">
                                <th className="pb-2">Medication</th>
                                <th className="pb-2 text-center">Qty</th>
                                <th className="pb-2 text-right">Unit Price</th>
                                <th className="pb-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commande.lines.map((line) => (
                                <tr key={line.id} className="border-b border-gray-100">
                                    <td className="py-3 font-medium">{line.medication_name}</td>
                                    <td className="py-3 text-center">{line.qte}</td>
                                    <td className="py-3 text-right">{Number(line.unit_price).toLocaleString()} DA</td>
                                    <td className="py-3 text-right font-semibold">{Number(line.total).toLocaleString()} DA</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-1/2 rounded-lg bg-gray-50 p-4">
                            <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                                <span>TOTAL:</span>
                                <span>{total.toLocaleString()} DA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleActualPrint}>
                        <Printer className="size-4 mr-2" /> Print Document
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
