"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyFacturesPage() {
    const fields: CrudField[] = [
        {
            name: "commande_id",
            label: "Commande",
            type: "search-select",
            endpoint: "/commandes?status=confirmed",
            labelKey: "notes", // show notes as label; fallback to id
            valueKey: "id",
            required: false,
        },
        {
            name: "supplier_id",
            label: "Supplier",
            type: "search-select",
            endpoint: "/suppliers",
            labelKey: "company_name",
            displayPath: "supplier.company_name",
            required: false,
        },
    ]
    return <GenericCrudTable title="Factures (Invoices)" endpoint="/factures" fields={fields} enablePrint />
}
