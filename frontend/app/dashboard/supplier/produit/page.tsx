"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function SupplierProduitPage() {
    const fields: CrudField[] = [
        { name: "medicament_id", label: "Medicament ID", type: "text" },
        { name: "quantity", label: "Stock Quantity", type: "number" },
        { name: "batch_number", label: "Batch Number", type: "text" },
    ]
    return <GenericCrudTable title="Stock (Produits)" endpoint="/supplier/produits" fields={fields} />
}
