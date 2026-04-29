"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyInventoriesPage() {
    const fields: CrudField[] = [
        {
            name: "medication_id",
            label: "Medication",
            type: "search-select",
            endpoint: "/medications",
            labelKey: "name",
        },
        { name: "qte", label: "Quantity", type: "number" },
        { name: "prix_achat", label: "Purchase Price (DA)", type: "number" },
        { name: "prix_vente", label: "Selling Price (DA)", type: "number" },
    ]
    return <GenericCrudTable title="Inventory" endpoint="/inventories" fields={fields} />
}
