"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmaceuticalFormsPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Form Name", type: "text" },
    ]
    return <GenericCrudTable title="Pharmaceutical Forms" endpoint="/pharmaceutical-forms" fields={fields} />
}
