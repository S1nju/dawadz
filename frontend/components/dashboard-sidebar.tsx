"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LogOutIcon,
  FileTextIcon, Building2Icon, TruckIcon,
  PillIcon, PackageIcon, MessageSquareIcon, ShoppingCartIcon, FileIcon, StoreIcon,
  FlaskConicalIcon, TagIcon, GlobeIcon, LayersIcon,
  UserIcon, Settings2Icon,
  LayoutDashboardIcon
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"

type MenuItem = { title: string; href: string; icon: React.ElementType }

const ADMIN_ITEMS: MenuItem[] = [
  { title: "Users", href: "/dashboard/admin/users", icon: UserIcon },
  { title: "Requests", href: "/dashboard/admin/requests", icon: FileTextIcon },
  { title: "Pharmacies", href: "/dashboard/admin/pharmacies", icon: Building2Icon },
  { title: "Suppliers", href: "/dashboard/admin/suppliers", icon: TruckIcon },
  { title: "Medications", href: "/dashboard/admin/medications", icon: PillIcon },
]



const SUPPLIER_ITEMS: MenuItem[] = [
  { title: "Supplier Profile", href: "/dashboard/supplier/setup", icon: Settings2Icon },
  { title: "Products", href: "/dashboard/supplier/products", icon: PackageIcon },
  { title: "Posts", href: "/dashboard/supplier/posts", icon: MessageSquareIcon },
  { title: "Commandes", href: "/dashboard/supplier/commandes", icon: ShoppingCartIcon },
  { title: "Medications", href: "/dashboard/supplier/medications", icon: PillIcon },
]

const SUPPLIER_CATALOG_ITEMS: MenuItem[] = [
  { title: "Laboratories", href: "/dashboard/admin/laboratories", icon: FlaskConicalIcon },
  { title: "Therapeutic Classes", href: "/dashboard/admin/therapeutic-classes", icon: TagIcon },
  { title: "Active Ingredients", href: "/dashboard/admin/active-ingredients", icon: LayersIcon },
  { title: "Pharmaceutical Forms", href: "/dashboard/admin/pharmaceutical-forms", icon: FileIcon },
  { title: "Countries", href: "/dashboard/admin/countries", icon: GlobeIcon },
]

const PHARMACY_ITEMS: MenuItem[] = [
  { title: "Pharmacy Profile", href: "/dashboard/pharmacy/setup", icon: Settings2Icon },
  { title: "Posts", href: "/dashboard/pharmacy/posts", icon: MessageSquareIcon },
  { title: "Marketplace", href: "/dashboard/pharmacy/marketplace", icon: StoreIcon },
  { title: "Inventories", href: "/dashboard/pharmacy/inventories", icon: PackageIcon },
  { title: "Commandes", href: "/dashboard/pharmacy/commandes", icon: ShoppingCartIcon },
  { title: "Factures", href: "/dashboard/pharmacy/factures", icon: FileIcon },
  { title: "Medications", href: "/dashboard/pharmacy/medications", icon: PillIcon },
]

const PHARMACY_CATALOG_ITEMS: MenuItem[] = [
  { title: "Laboratories", href: "/dashboard/admin/laboratories", icon: FlaskConicalIcon },
  { title: "Therapeutic Classes", href: "/dashboard/admin/therapeutic-classes", icon: TagIcon },
  { title: "Active Ingredients", href: "/dashboard/admin/active-ingredients", icon: LayersIcon },
  { title: "Pharmaceutical Forms", href: "/dashboard/admin/pharmaceutical-forms", icon: FileIcon },
  { title: "Countries", href: "/dashboard/admin/countries", icon: GlobeIcon },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { roles, signOut } = useAuth()

  const isAdmin = roles.includes("admin")
  const isSupplier = roles.includes("supplier_admin") || roles.includes("supplier")
  const isPharmacy = roles.includes("pharmacy_admin") || roles.includes("pharmacy")

  const primaryItems = isAdmin ? ADMIN_ITEMS : isSupplier ? SUPPLIER_ITEMS : isPharmacy ? PHARMACY_ITEMS : []
  const secondaryItems = isAdmin ? [] : isPharmacy ? PHARMACY_CATALOG_ITEMS : isSupplier ? SUPPLIER_CATALOG_ITEMS : []
  const secondaryLabel = isAdmin ? "Pharmacy Setup" : isPharmacy ? "Catalog" : isSupplier ? "Catalog" : ""

  const renderItems = (items: MenuItem[]) => items.map((item) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
        <Link href={item.href}>
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))

  const appName = "DawaDz"

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="DawaDz" className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold">{appName}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboardIcon className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {primaryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItems(primaryItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {secondaryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{secondaryLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItems(secondaryItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}
