"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function SupplierPostPage() {
    const fields: CrudField[] = [
        { name: "title", label: "Post Title", type: "text" },
        { name: "description", label: "Description", type: "text" },
    ]
    return <GenericCrudTable title="Posts/Announcements" endpoint="/supplier/posts" fields={fields} />
}
