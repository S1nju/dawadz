"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacologicalClassesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Class Name", type: "text" },
    ]
    return <GenericCrudTable title="Pharmacological Classes" endpoint="/pharmacological-classes" fields={fields} />
}
