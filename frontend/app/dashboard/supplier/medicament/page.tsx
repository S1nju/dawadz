"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function SupplierMedicamentPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Drug Name", type: "text" },
        { name: "dosage", label: "Dosage", type: "text" },
        { name: "price", label: "Price", type: "number" },
    ]
    return <GenericCrudTable title="Medicaments" endpoint="/supplier/medicaments" fields={fields} />
}
