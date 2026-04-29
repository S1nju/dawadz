"use client"

import { useRef, useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, CheckCircle2, FileText, ImageIcon, X, Upload } from "lucide-react"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"

// API.md: POST /api/approval-requests (multipart/form-data)
// Fields: type (pharmacy|supplier), documents[] (files), images[] (files)

type RequestType = "pharmacy" | "supplier"

function FileDropZone({
    label,
    icon: Icon,
    accept,
    files,
    onChange,
    hint,
}: {
    label: string
    icon: React.ElementType
    accept: string
    files: File[]
    onChange: (files: File[]) => void
    hint: string
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    const remove = (index: number) => {
        const updated = [...files]
        updated.splice(index, 1)
        onChange(updated)
    }

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? [])
        onChange([...files, ...selected])
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div
                className="rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 transition-colors p-4 cursor-pointer bg-muted/10"
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon className="size-8 opacity-50" />
                    <div className="text-center">
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs mt-0.5">{hint}</p>
                    </div>
                    <Button variant="outline" size="sm" type="button" className="mt-1 pointer-events-none">
                        <Upload className="size-3.5 mr-1.5" /> Browse Files
                    </Button>
                </div>
            </div>
            {files.length > 0 && (
                <ul className="space-y-1.5 mt-2">
                    {files.map((file, i) => (
                        <li key={i} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                            <span className="truncate max-w-[240px] text-foreground">{file.name}</span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); remove(i) }}
                                className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            >
                                <X className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export function JoinRequestSheet({ triggerClassName }: { triggerClassName?: string }) {
    const [open, setOpen] = useState(false)
    const [success, setSuccess] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [type, setType] = useState<RequestType>("pharmacy")
    const [documents, setDocuments] = useState<File[]>([])
    const [images, setImages] = useState<File[]>([])
    const { toast } = useToast()

    const defaultTriggerClassName = "hidden sm:flex rounded-full px-4 border-primary/20 hover:border-primary/50 text-foreground"

    const reset = () => {
        setType("pharmacy")
        setDocuments([])
        setImages([])
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Use FormData so files are uploaded as multipart
            const form = new FormData()
            form.append("type", type)
            documents.forEach((f) => form.append("documents[]", f))
            images.forEach((f) => form.append("images[]", f))

            await axiosClient.post("/approval-requests", form, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            setSuccess(true)
            setTimeout(() => {
                setOpen(false)
                setSuccess(false)
                reset()
            }, 2800)
        } catch (err: any) {
            const data = err.response?.data
            // Handle Laravel validation errors (422)
            if (data?.errors) {
                const first = Object.values(data.errors as Record<string, string[]>)[0]?.[0]
                toast({ title: "Validation Error", description: first, variant: "destructive" })
            } else {
                toast({
                    title: "Submission Failed",
                    description: data?.message ?? "Could not submit your request. Are you logged in?",
                    variant: "destructive",
                })
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className={triggerClassName ?? defaultTriggerClassName}>
                    <UserPlus className="mr-2 size-4 text-primary" />
                    Join as Pharmacy / Supplier
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader className="mb-6 mt-4">
                    <SheetTitle className="text-xl">Request Access</SheetTitle>
                    <SheetDescription>
                        Submit your request to join as a pharmacy or supplier. An admin will review and approve it.
                    </SheetDescription>
                </SheetHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Request Submitted!</h3>
                            <p className="text-muted-foreground text-sm">
                                Your request is <strong>pending review</strong>. You'll be notified once an admin
                                approves or rejects it.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-6 px-1 pb-6">
                        {/* Type selector */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Account Type</Label>
                            <select
                                id="type"
                                value={type}
                                onChange={(e) => setType(e.target.value as RequestType)}
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            >
                                <option value="pharmacy">Pharmacy</option>
                                <option value="supplier">Distributor / Supplier</option>
                            </select>
                        </div>

                        {/* Documents upload */}
                        <FileDropZone
                            label="Supporting Documents"
                            icon={FileText}
                            accept=".pdf,.doc,.docx"
                            files={documents}
                            onChange={setDocuments}
                            hint="License, registration, or official documents (PDF, DOC)"
                        />

                        {/* Images upload */}
                        <FileDropZone
                            label="Images (Optional)"
                            icon={ImageIcon}
                            accept="image/*"
                            files={images}
                            onChange={setImages}
                            hint="Storefront photos or ID scans (JPG, PNG)"
                        />

                        {/* Info box */}
                        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 bg-muted/10 text-sm text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">What happens next</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Your request goes to admin for review</li>
                                <li>If approved → you get <strong>pharmacy_admin</strong> or <strong>supplier_admin</strong> access</li>
                                <li>You can then fully manage your dashboard</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full text-base font-medium h-11" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    )
}
