"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function CountriesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Country Name", type: "text" },
        { name: "code", label: "Code", type: "text" },

    ]
    return <GenericCrudTable title="Countries" endpoint="/countries" fields={fields} />
}
