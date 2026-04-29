"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function RolesPage() {
    const fields: CrudField[] = [
        { name: "name", label: "Role Name", type: "text" },
        { name: "permissions", label: "Permissions", type: "text" },
    ]
    return <GenericCrudTable title="Role Management" endpoint="/admin/roles" fields={fields} />
}
