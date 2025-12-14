"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  Users,
  Building2,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  Receipt,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { AllowedRole } from "@/lib/types"
import { useState, useEffect } from "react"

interface NavMenuProps {
  role: AllowedRole
  userName?: string
}

export function NavMenu({ role, userName }: NavMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

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
    { href: "/admin/products", label: "Catálogo Trupper", icon: Package },
    { href: "/admin/customers", label: "Clientes", icon: Users },
    { href: "/admin/inventory", label: "Inventario", icon: Building2 },
    { href: "/admin/purchases", label: "Historial de compras", icon: ShoppingBag },
    { href: "/admin/sales", label: "Historial de ventas", icon: Receipt },
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
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r sticky top-0 h-screen transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header with logo */}
        <div className={cn("flex items-center border-b p-4 h-16", isCollapsed ? "justify-center" : "gap-3")}>
          {!isCollapsed && (
            <>
              <Image
                src="/images/masicsa-logo.png"
                alt="MASICSA Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <span className="text-lg font-bold text-primary truncate">MASICSA</span>
            </>
          )}
          {isCollapsed && (
            <Image
              src="/images/masicsa-logo.png"
              alt="MASICSA Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          )}
        </div>

        {/* User info */}
        {userName && (
          <div className={cn("p-4 bg-slate-50 border-b", isCollapsed && "p-2")}>
            {!isCollapsed ? (
              <>
                <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 capitalize truncate">{role.replace("_", " ")}</p>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mx-auto">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-700 hover:bg-slate-100",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {/* Collapse toggle button */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("w-full flex items-center gap-2", isCollapsed && "justify-center")}
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Contraer</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 p-0"
            title="Menú"
          >
            {isMobileMenuOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <Image
              src="/images/masicsa-logo.png"
              alt="MASICSA Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-primary">MASICSA</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 w-9 p-0 bg-transparent"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white border-r shadow-lg z-50 lg:hidden transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Image
              src="/images/masicsa-logo.png"
              alt="MASICSA Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-primary">MASICSA</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {userName && (
          <div className="p-4 bg-slate-50 border-b">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500 capitalize">{role.replace("_", " ")}</p>
          </div>
        )}

        <nav
          className="flex flex-col p-3 space-y-1 overflow-y-auto"
          style={{ height: userName ? "calc(100vh - 220px)" : "calc(100vh - 160px)" }}
        >
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              handleLogout()
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
