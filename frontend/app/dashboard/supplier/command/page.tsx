"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function SupplierCommandPage() {
    const fields: CrudField[] = [
        {
            name: "pharmacy_id",
            label: "Pharmacy",
            type: "search-select",
            endpoint: "/pharmacies",
            labelKey: "name",
            displayPath: "pharmacy.name",
            required: false,
        },
        { name: "status", label: "Status (Pending/Fulfilled)", type: "text" },
        { name: "total_price", label: "Total Price", type: "number" },
    ]
    return <GenericCrudTable title="Pharmacy Orders (Commands)" endpoint="/supplier/commands" fields={fields} />
}
