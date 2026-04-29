"use client"

import { useEffect, useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, Edit, Trash2, Search, Loader2, Check, Eye, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// ─── Field Types ──────────────────────────────────────────────────────────────

export type SelectOption = { value: string | number; label: string }

export type CrudField =
    | { name: string; label: string; type: "text" | "number" | "file"; hideInTable?: boolean; displayPath?: string; required?: boolean }
    | { name: string; label: string; type: "select"; options: { value: string | number; label: string }[]; hideInTable?: boolean; required?: boolean }
    | { name: string; label: string; type: "search-select"; endpoint: string; labelKey: string; valueKey?: string; displayPath?: string; hideInTable?: boolean; required?: boolean }
    | { name: string; label: string; type: "checkbox"; hideInTable?: boolean; required?: boolean }

function snakeToCamel(value: string) {
    return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

// ─── SearchSelect Component ───────────────────────────────────────────────────

function SearchSelect({
    field,
    value,
    onChange,
    initialLabel,
}: {
    field: Extract<CrudField, { type: "search-select" }>
    value: string | number | undefined
    onChange: (v: string | number) => void
    initialLabel?: string
}) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<SelectOption[]>([])
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)

    const fetchOptions = useCallback(
        async (q: string) => {
            setLoading(true)
            try {
                const res = await axiosClient.get(field.endpoint, { params: { search: q, q, per_page: 30 } })
                const data: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                setOptions(
                    data.map((item) => ({
                        value: item[field.valueKey ?? "id"],
                        label: item[field.labelKey] ?? item.company_name ?? item.name ?? item.title ?? String(item[field.valueKey ?? "id"] ?? ""),
                    }))
                )
            } catch {
                setOptions([])
            } finally {
                setLoading(false)
            }
        },
        [field.endpoint, field.labelKey, field.valueKey]
    )

    // When editing: fetch options immediately so the current value resolves to a label
    useEffect(() => {
        if (value !== undefined && value !== "" && value !== null) {
            fetchOptions("")
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (open) fetchOptions(query)
    }, [open, query, fetchOptions])

    // Merge seed option so button label shows before user opens popover
    const allOptions = (() => {
        if (value && initialLabel && !options.find((o) => String(o.value) === String(value))) {
            return [{ value, label: initialLabel }, ...options]
        }
        return options
    })()

    const selected = allOptions.find((o) => String(o.value) === String(value))

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {selected ? selected.label : `Select ${field.label}...`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={`Search ${field.label}...`}
                        value={query}
                        onValueChange={(v) => { setQuery(v); fetchOptions(v) }}
                    />
                    <CommandList>
                        {loading && <CommandEmpty>Loading...</CommandEmpty>}
                        {!loading && allOptions.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
                        <CommandGroup>
                            {allOptions.map((opt) => (
                                <CommandItem
                                    key={opt.value}
                                    value={String(opt.value)}
                                    onSelect={() => {
                                        onChange(opt.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", String(value) === String(opt.value) ? "opacity-100" : "opacity-0")} />
                                    {opt.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function FieldInput({
    field,
    value,
    onChange,
    initialLabel,
}: {
    field: CrudField
    value: any
    onChange: (v: any) => void
    initialLabel?: string
}) {
    if (field.type === "select") {
        return (
            <Select value={String(value ?? "")} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${field.label}...`} />
                </SelectTrigger>
                <SelectContent>
                    {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    if (field.type === "search-select") {
        return <SearchSelect field={field} value={value} onChange={onChange} initialLabel={initialLabel} />
    }

    if (field.type === "checkbox") {
        return (
            <div className="flex items-center gap-3 h-10">
                <button
                    type="button"
                    role="switch"
                    aria-checked={!!value}
                    onClick={() => onChange(!value)}
                    className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
                        value ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                >
                    <span
                        className={cn(
                            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            value ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
                <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
            </div>
        )
    }

    return (
        <Input
            type={field.type}
            required={field.required ?? true}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

// ─── Generic CRUD Table ───────────────────────────────────────────────────────

type GenericCrudTableProps = {
    title: string
    endpoint: string
    fields: CrudField[]
    enablePrint?: boolean
}

export function GenericCrudTable({ title, endpoint, fields, enablePrint = false }: GenericCrudTableProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [searchSelectLabels, setSearchSelectLabels] = useState<Record<string, Record<string, string>>>({})
    const { toast } = useToast()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [detailRow, setDetailRow] = useState<any>(null)
    const [formData, setFormData] = useState<any>({})
    const [editingId, setEditingId] = useState<string | number | null>(null)

    const resolvePathValue = (row: any, path?: string) => {
        if (!path) return undefined
        return path.split(".").reduce((obj: any, key: string) => obj?.[key], row)
    }

    const getSupplierDisplay = (row: any) => {
        if (!row) return "—"

        if (row.external_supplier_name) {
            return row.external_supplier_name
        }

        const supplier = row.supplier
        if (supplier && typeof supplier === "object") {
            return supplier.name ?? supplier.company_name ?? supplier.title ?? supplier.id ?? "—"
        }

        return row.supplier_name ?? row.supplier?.name ?? row.supplier_id ?? "—"
    }

    const getPharmacyDisplay = (row: any) => {
        if (!row) return "—"

        const pharmacy = row.pharmacy
        if (pharmacy && typeof pharmacy === "object") {
            return pharmacy.name ?? pharmacy.title ?? pharmacy.id ?? "—"
        }

        return row.pharmacy_name ?? row.pharmacy_id ?? "—"
    }

    const getLineItems = (row: any) => {
        if (!row) return []
        if (Array.isArray(row.lines)) return row.lines
        if (Array.isArray(row.commande?.lines)) return row.commande.lines
        if (Array.isArray(row.facture?.lines)) return row.facture.lines
        return []
    }

    const getLineProductName = (line: any) => {
        if (!line) return "—"
        return line.medication_name ?? line.product_name ?? line.product?.name ?? line.product?.medication_name ?? `Product #${line.product_id ?? "—"}`
    }

    const getLineQuantity = (line: any) => Number(line?.qte ?? line?.quantity ?? 0)

    const getLineUnitPrice = (line: any) => Number(line?.unit_price ?? line?.prix ?? line?.price ?? 0)

    const getLineTotal = (line: any) => {
        if (!line) return 0
        if (line.total !== undefined && line.total !== null) return Number(line.total)
        return getLineQuantity(line) * getLineUnitPrice(line)
    }

    const getRowTotal = (row: any) => getLineItems(row).reduce((sum, line) => sum + getLineTotal(line), 0)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axiosClient.get(`${endpoint}`, { params: { page, search } })
            if (Array.isArray(res.data?.data)) {
                setData(res.data.data)
            } else if (Array.isArray(res.data)) {
                setData(res.data)
            } else {
                setData([])
            }
        } catch {
            setData([])
        } finally {
            setLoading(false)
        }
    }, [endpoint, page, search])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        let cancelled = false

        const searchSelectFields = fields.filter(
            (field): field is Extract<CrudField, { type: "search-select" }> => field.type === "search-select"
        )

        if (searchSelectFields.length === 0) {
            setSearchSelectLabels({})
            return
        }

        const loadLabels = async () => {
            const entries = await Promise.all(
                searchSelectFields.map(async (field) => {
                    try {
                        const valueKey = field.valueKey ?? "id"
                        const res = await axiosClient.get(field.endpoint, { params: { per_page: 500 } })
                        const items: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                        const labelMap = items.reduce<Record<string, string>>((acc, item) => {
                            const key = item?.[valueKey]
                            const label = item?.[field.labelKey] ?? item?.company_name ?? item?.name ?? item?.title
                            if (key !== undefined && key !== null && label !== undefined && label !== null) {
                                acc[String(key)] = String(label)
                            }
                            return acc
                        }, {})
                        return [field.name, labelMap] as const
                    } catch {
                        return [field.name, {}] as const
                    }
                })
            )

            if (cancelled) return
            setSearchSelectLabels(Object.fromEntries(entries))
        }

        loadLabels()

        return () => {
            cancelled = true
        }
    }, [fields])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                await axiosClient.put(`${endpoint}/${editingId}`, formData)
                toast({ title: "Updated successfully" })
            } else {
                await axiosClient.post(endpoint, formData)
                toast({ title: "Created successfully" })
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (e: any) {
            toast({
                title: "Error saving record",
                description: e.response?.data?.message || "Unknown error",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this record?")) return
        try {
            await axiosClient.delete(`${endpoint}/${id}`)
            toast({ title: "Deleted successfully" })
            fetchData()
        } catch (e: any) {
            toast({
                title: "Delete failed",
                description: e.response?.data?.message || "Unknown error",
                variant: "destructive",
            })
        }
    }

    const openAdd = () => { setFormData({}); setEditingId(null); setIsDialogOpen(true) }
    const openEdit = (row: any) => { setFormData({ ...row }); setEditingId(row.id); setIsDialogOpen(true) }

    // Display value for table cells (resolve label for select and boolean types)
    const displayValue = (field: CrudField, row: any) => {
        const val = row[field.name]

        if (field.type === "select") {
            const found = field.options.find((o) => String(o.value) === String(val))
            return found ? found.label : (val ?? "—")
        }
        if (field.type === "search-select") {
            if (field.name === "supplier_id") {
                const supplierDisplay = getSupplierDisplay(row)
                if (supplierDisplay && supplierDisplay !== "—") {
                    return supplierDisplay
                }
            }

            const pathValue = resolvePathValue(row, (field as any).displayPath)
            if (pathValue !== undefined && pathValue !== null && pathValue !== "") {
                return pathValue
            }

            const relationKey = field.name.replace(/_id$/, "")
            const relationValue = row[relationKey] ?? row[snakeToCamel(relationKey)] ?? val

            if (relationValue && typeof relationValue === "object") {
                return relationValue[field.labelKey] ?? relationValue.name ?? relationValue.title ?? relationValue.id ?? "—"
            }

            const directLabel = row[`${relationKey}_name`] ?? row[`${snakeToCamel(relationKey)}Name`] ?? row[`${relationKey}Name`]
            if (directLabel) return directLabel

            const mappedLabel = searchSelectLabels[field.name]?.[String(val)]
            if (mappedLabel) return mappedLabel

            return val ?? "—"
        }
        if (field.type === "checkbox") {
            return val ? "✓ Yes" : "✗ No"
        }
        const pathValue = resolvePathValue(row, (field as any).displayPath)
        if (pathValue !== undefined && pathValue !== null && pathValue !== "") {
            return pathValue
        }
        return val ?? "—"
    }

    const handlePrintDetail = () => {
        if (!detailRow) return

        const win = window.open("", "_blank", "width=1100,height=800")
        if (!win) return

        const lines: any[] = getLineItems(detailRow)
        const linesRows = lines
            .map((line) => {
                const qty = getLineQuantity(line)
                const unitPrice = getLineUnitPrice(line)
                const total = getLineTotal(line)
                return `
                    <tr>
                        <td>${getLineProductName(line)}</td>
                        <td style="text-align:center;">${qty}</td>
                        <td style="text-align:right;">${unitPrice.toFixed(2)} DA</td>
                        <td style="text-align:right;">${total.toFixed(2)} DA</td>
                    </tr>
                `
            })
            .join("")

        const total = getRowTotal(detailRow)
        const orderedAt = detailRow.ordered_at ? new Date(detailRow.ordered_at).toLocaleString() : "—"
    const supplierDisplay = getSupplierDisplay(detailRow)
    const pharmacyDisplay = getPharmacyDisplay(detailRow)
    const statusDisplay = detailRow.status ?? "—"

        win.document.open()
        win.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Facture #${detailRow.id ?? ""}</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
                        h1 { margin: 0 0 8px 0; }
                        .meta { margin: 0 0 18px 0; color: #444; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                        .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border-bottom: 1px solid #eee; padding: 10px 8px; }
                        th { text-align: left; background: #f7f7f7; }
                        .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
                        .total-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; min-width: 280px; }
                        @media print { body { margin: 8mm; } }
                    </style>
                </head>
                <body>
                    <h1>FACTURE #${detailRow.id ?? ""}</h1>
                    <p class="meta">Generated on ${new Date().toLocaleString()}</p>

                    <div class="grid">
                        <div class="card">
                            <strong>Supplier</strong>
                            <div>${supplierDisplay}</div>
                        </div>
                        <div class="card">
                            <strong>Commande</strong>
                            <div>#${detailRow.commande_id ?? "—"}</div>
                            <div>Status: ${statusDisplay}</div>
                            <div>Pharmacy: ${pharmacyDisplay}</div>
                            <div>Ordered: ${orderedAt}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="text-align:center;">Quantity</th>
                                <th style="text-align:right;">Unit Price</th>
                                <th style="text-align:right;">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linesRows || "<tr><td colspan=\"4\" style=\"text-align:center;\">No line items</td></tr>"}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="total-box"><strong>Total: ${total.toFixed(2)} DA</strong></div>
                    </div>
                </body>
            </html>
        `)
        win.document.close()
        win.focus()
        win.print()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openAdd}>
                            <Plus className="mr-2 size-4" /> Add New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit" : "Add"} {title}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="pt-2 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                {fields.map((field) => (
                                    <div
                                        key={field.name}
                                        className={cn(
                                            "space-y-1.5",
                                            // checkboxes and URL fields go full width
                                            field.type === "checkbox" || field.name.endsWith("_link") || field.name === "conditioning"
                                                ? "sm:col-span-2"
                                                : ""
                                        )}
                                    >
                                        <label className="text-sm font-medium leading-none">{field.label}</label>
                                        <FieldInput
                                            field={field}
                                            value={formData[field.name]}
                                            onChange={(v) => setFormData((prev: any) => ({ ...prev, [field.name]: v }))}
                                            initialLabel={
                                                field.type === "search-select" && (field as any).displayPath
                                                    ? (field as any).displayPath
                                                        .split(".")
                                                        .reduce((obj: any, key: string) => obj?.[key], formData) ?? undefined
                                                    : undefined
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-8 w-full"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            {fields.filter(f => !f.hideInTable).map((f) => <TableHead key={f.name}>{f.label}</TableHead>)}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={fields.filter(f => !f.hideInTable).length + 1} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={fields.filter(f => !f.hideInTable).length + 1} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow key={row.id}>
                                    {fields.filter(f => !f.hideInTable).map((f) => <TableCell key={f.name}>{displayValue(f, row)}</TableCell>)}
                                    <TableCell className="text-right flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setDetailRow(row)}>
                                            <Eye className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                                            <Edit className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!detailRow} onOpenChange={(open) => !open && setDetailRow(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{title} Details</DialogTitle>
                    </DialogHeader>
                    {detailRow && (
                        <div className="space-y-6 pt-2">
                            {/* Optional Image Banner if img_link or image exists */}
                            {(detailRow.img_link || detailRow.image) && (
                                <div className="h-48 w-full rounded-xl overflow-hidden bg-muted border">
                                    <img
                                        src={detailRow.img_link || detailRow.image}
                                        alt="Thumbnail"
                                        className="w-full h-full object-contain bg-white"
                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                {fields.map(field => {
                                    const val = displayValue(field, detailRow)
                                    return (
                                        <div key={field.name} className="space-y-1 border-b pb-3">
                                            <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
                                            <div className="text-sm font-semibold text-foreground">
                                                {field.type === 'file' || field.name.endsWith('_link') ? (
                                                    val && val !== "—" ? <a href={String(val)} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">View Link</a> : "—"
                                                ) : (
                                                    String(val)
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                                {getLineItems(detailRow).length > 0 && (
                                <div className="space-y-3 rounded-xl border p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Line Items</h3>
                                        <span className="text-sm text-muted-foreground">
                                            Supplier: <strong className="text-foreground">{String(getSupplierDisplay(detailRow))}</strong>
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[560px]">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                    <TableHead className="text-right">Prix Commande Line</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                    {getLineItems(detailRow).map((line: any, idx: number) => {
                                                        const qty = getLineQuantity(line)
                                                        const unitPrice = getLineUnitPrice(line)
                                                    const total = getLineTotal(line)
                                                    return (
                                                        <TableRow key={line.id ?? idx}>
                                                            <TableCell>{getLineProductName(line)}</TableCell>
                                                            <TableCell className="text-right">{qty}</TableCell>
                                                            <TableCell className="text-right">{unitPrice.toFixed(2)} DA</TableCell>
                                                            <TableCell className="text-right font-semibold">{total.toFixed(2)} DA</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="flex justify-end text-sm font-semibold">
                                        Total: {getRowTotal(detailRow).toFixed(2)} DA
                                    </div>
                                </div>
                            )}

                            {enablePrint && (
                                <div className="flex justify-end">
                                    <Button type="button" onClick={handlePrintDetail}>Print as PDF</Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page}</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={data.length === 0 || loading}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
