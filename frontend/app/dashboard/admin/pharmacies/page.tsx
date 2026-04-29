"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

// API.md: name, address (lat/lng optional)
export default function AdminPharmaciesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Pharmacy Name", type: "text" },
        { name: "address", label: "Address", type: "text" },
    ]
    return <GenericCrudTable title="Pharmacies" endpoint="/pharmacies" fields={fields} />
}
