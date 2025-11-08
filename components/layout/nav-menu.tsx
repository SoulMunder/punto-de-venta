"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Package, Users, Building2, ShoppingBag, ShoppingCart, UserCog, Receipt, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { AllowedRole } from "@/lib/types"

interface NavMenuProps {
  role: AllowedRole
  userName?: string
}

export function NavMenu({ role, userName }: NavMenuProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const adminLinks = [
    { href: "/admin/products", label: "Productos", icon: Package },
    { href: "/admin/customers", label: "Clientes", icon: Users },
    { href: "/admin/inventory", label: "Inventario", icon: Building2 },
    { href: "/admin/purchases", label: "Compras", icon: ShoppingBag },
    { href: "/admin/sales", label: "Ventas", icon: Receipt },
    { href: "/admin/users", label: "Usuarios", icon: UserCog },
    { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
  ]

  const branchManagerLinks = [
    { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
    { href: "/admin/sales", label: "Ventas", icon: Receipt },
    { href: "/admin/inventory", label: "Inventario", icon: Building2 },
    { href: "/admin/customers", label: "Clientes", icon: Users },
  ]

  const cashierLinks = [{ href: "/pos", label: "Punto de Venta", icon: ShoppingCart }]

  let links = cashierLinks
  if (role === "admin") links = adminLinks
  else if (role === "branch_manager") links = branchManagerLinks

  return (
    <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-1 p-2 sm:p-2 bg-white border-b">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 px-2">
          <div className="flex items-center gap-2">
            <Image
              src="/images/masicsa-logo.png"
              alt="MASICSA Logo"
              width={32}
              height={32}
              className="object-contain sm:w-10 sm:h-10"
            />
            <span className="text-base sm:text-lg font-bold text-primary">MASICSA</span>
          </div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-border" />
        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                  isActive ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-accent",
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end px-2 sm:px-0">
        {userName && (
          <span className="text-xs sm:text-sm text-slate-600 truncate max-w-[150px] sm:max-w-none">{userName}</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center justify-center bg-transparent h-7 sm:h-9 w-7 sm:w-9 p-0"
          title="Cerrar Sesión"
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </nav>
  )
}
