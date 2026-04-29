"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyCommandesPage() {
    const fields: CrudField[] = [
        {
            name: "supplier_id",
            label: "Supplier",
            type: "search-select",
            endpoint: "/suppliers",
            labelKey: "name",
            displayPath: "supplier.name",
            required: false,
        },
        { name: "external_supplier_name", label: "External Supplier Name", type: "text", required: false },
        { name: "notes", label: "Notes / Observations", type: "text", required: false },
        { name: "status", label: "Status", type: "text", required: false },
    ]
    return <GenericCrudTable title="Commandes" endpoint="/commandes" fields={fields} />
}
