"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

// API.md: supplier has nested user: { name, email, ... }
// displayPath resolves user.name for the table cell, while name/address are form keys for PUT
export default function AdminSuppliersPage() {
    const fields: CrudField[] = [
        {
            name: "company_name",
            label: "Company Name",
            type: "text",
            displayPath: "user.name",   // show user.name in the table
        },
        { name: "address", label: "Address", type: "text" },
    ]
    return <GenericCrudTable title="Suppliers" endpoint="/suppliers" fields={fields} />
}
