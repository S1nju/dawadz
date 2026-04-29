"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyVentePage() {
    const fields: CrudField[] = [
        { name: "patient_name", label: "Patient/Customer", type: "text" },
        { name: "total_amount", label: "Amount", type: "number" },
        { name: "date", label: "Date", type: "text" },
    ]
    return <GenericCrudTable title="Sales (Ventes)" endpoint="/pharmacy/ventes" fields={fields} />
}
