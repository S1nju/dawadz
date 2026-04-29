"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

// API.md: { "dci": "Paracetamol", "dci_code": "N02BE01" }
export default function ActiveIngredientsPage() {
    const fields: CrudField[] = [
        { name: "dci", label: "DCI (International Non-proprietary Name)", type: "text" },
        { name: "dci_code", label: "DCI Code (e.g. N02BE01)", type: "text" },
    ]
    return <GenericCrudTable title="Active Ingredients" endpoint="/active-ingredients" fields={fields} />
}
