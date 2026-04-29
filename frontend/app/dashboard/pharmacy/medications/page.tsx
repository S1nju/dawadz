"use client"
import { GenericCrudTable, CrudField } from "@/components/GenericCrudTable"

export default function PharmacyMedicationsPage() {
    const fields: CrudField[] = [
        { name: "name", label: "INN Name", type: "text" },
        { name: "commercial_name", label: "Commercial Name", type: "text" },
        {
            name: "laboratory_id",
            label: "Laboratory",
            type: "search-select",
            endpoint: "/laboratories",
            labelKey: "name",
        },
        {
            name: "therapeutic_class_id",
            label: "Therapeutic Class",
            type: "search-select",
            endpoint: "/therapeutic-classes",
            labelKey: "name",
        },
        {
            name: "pharmacological_class_id",
            label: "Pharmacological Class",
            type: "search-select",
            endpoint: "/pharmacological-classes",
            labelKey: "name",
        },
        {
            name: "pharmaceutical_form_id",
            label: "Pharmaceutical Form",
            type: "search-select",
            endpoint: "/pharmaceutical-forms",
            labelKey: "name",
        },
        {
            name: "country_id",
            label: "Country of Origin",
            type: "search-select",
            endpoint: "/countries",
            labelKey: "name",
        },
        { name: "dosage", label: "Dosage (e.g. 500mg)", type: "text", hideInTable: true },
        { name: "conditioning", label: "Conditioning (e.g. Box of 10)", type: "text", hideInTable: true },
        {
            name: "type",
            label: "Type",
            type: "select",
            hideInTable: true,
            options: [
                { value: "generic", label: "Generic" },
                { value: "brand", label: "Brand" },
                { value: "biosimilar", label: "Biosimilar" },
                { value: "herbal", label: "Herbal" },
            ],
        },
        {
            name: "list",
            label: "List",
            type: "select",
            hideInTable: true,
            options: [
                { value: "list_i", label: "List I" },
                { value: "list_ii", label: "List II" },
                { value: "list_iii", label: "List III" },
                { value: "free", label: "Free" },
            ],
        },
        { name: "marketed", label: "Marketed", type: "checkbox", hideInTable: true },
        { name: "reimbursable", label: "Reimbursable", type: "checkbox", hideInTable: true },
        { name: "registration_num", label: "Registration Number", type: "text", hideInTable: true },
        { name: "notice_link", label: "Notice Link (URL)", type: "text", hideInTable: true },
        { name: "img_link", label: "Image Link (URL)", type: "text", hideInTable: true },
    ]
    return <GenericCrudTable title="Medications" endpoint="/medications" fields={fields} />
}
