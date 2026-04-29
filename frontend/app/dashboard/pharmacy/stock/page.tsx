"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyStockPage() {
    const fields: CrudField[] = [
        { name: "medicament_name", label: "Medicament Name", type: "text" },
        { name: "quantity", label: "Quantity Available", type: "number" },
        { name: "expiration_date", label: "Expiration", type: "text" },
    ]
    return <GenericCrudTable title="Inventory Stock" endpoint="/pharmacy/stock" fields={fields} />
}
