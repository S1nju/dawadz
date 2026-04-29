"use client"

import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyPostsPage() {
    const fields: CrudField[] = [
        {
            name: "medication_id",
            label: "Medication",
            type: "search-select",
            endpoint: "/medications",
            labelKey: "name",
        },
        { name: "title", label: "Title", type: "text" },
        { name: "description", label: "Description", type: "text" },
        { name: "image", label: "Image URL", type: "text" },
        { name: "qte_vente", label: "Quantity for Sale", type: "number" },
        { name: "unit_price", label: "Unit Price (DA)", type: "number" },
    ]

    return <GenericCrudTable title="Pharmacy Posts" endpoint="/pharmacy-posts" fields={fields} />
}
