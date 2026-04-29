"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function SupplierVentePage() {
    const fields: CrudField[] = [
        { name: "command_id", label: "Command ID", type: "text" },
        { name: "sale_date", label: "Date of Sale", type: "text" },
        { name: "revenue", label: "Revenue", type: "number" },
    ]
    return <GenericCrudTable title="Sales (Ventes)" endpoint="/supplier/ventes" fields={fields} />
}
