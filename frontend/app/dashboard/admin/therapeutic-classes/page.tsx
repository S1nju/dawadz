"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function TherapeuticClassesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Class Name", type: "text" },
    ]
    return <GenericCrudTable title="Therapeutic Classes" endpoint="/therapeutic-classes" fields={fields} />
}
