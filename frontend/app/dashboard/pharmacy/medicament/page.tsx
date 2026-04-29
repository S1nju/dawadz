"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyMedicamentPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Drug Name", type: "text" },
        { name: "category", label: "Category", type: "text" },
    ]
    return <GenericCrudTable title="Medicament Catalog" endpoint="/pharmacy/medicaments" fields={fields} />
}
