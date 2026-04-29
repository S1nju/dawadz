"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function AdminLaboratoriesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Laboratory Name", type: "text" },
        {
            name: "country",
            label: "Country",
            type: "search-select",
            endpoint: "/countries",
            labelKey: "name",
            valueKey: "name", // API expects the country code/name string, not an ID
        },
    ]
    return <GenericCrudTable title="Laboratories" endpoint="/laboratories" fields={fields} />
}
