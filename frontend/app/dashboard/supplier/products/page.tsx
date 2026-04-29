"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

// API.md: product has { medication_id, medication: { id, name, ... }, qte, prix_achat, prix_vente }
export default function SupplierProductsPage() {
    const fields: CrudField[] = [
        {
            name: "medication_id",
            label: "Medication",
            type: "search-select",
            endpoint: "/medications",
            labelKey: "name",
            // Shows medication.name in the table column instead of the raw ID
            displayPath: "medication.name",
        },
        { name: "qte", label: "Quantity", type: "number" },
        { name: "prix_achat", label: "Purchase Price (DA)", type: "number" },
        { name: "prix_vente", label: "Selling Price (DA)", type: "number" },
    ]
    return <GenericCrudTable title="Products" endpoint="/products" fields={fields} />
}
