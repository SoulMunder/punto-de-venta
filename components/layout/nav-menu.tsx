"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Package, Users, Building2, ShoppingBag, ShoppingCart, UserCog, Receipt, LogOut, Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { AllowedRole } from "@/lib/types"
import { useState, useEffect } from "react"

interface NavMenuProps {
  role: AllowedRole
  userName?: string
}

export function NavMenu({ role, userName }: NavMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

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
     {/* Header principal */}
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-3 md:p-4">
          {/* Botón menú móvil */}
          <div className="flex items-center lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9 p-0"
              title="Menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Logo centrado en móvil/tablet, a la izquierda en desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex items-center gap-2 md:gap-3">
            <Image
              src="/images/masicsa-logo.png"
              alt="MASICSA Logo"
              width={40}
              height={40}
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
            <span className="text-lg md:text-xl font-bold text-primary">MASICSA</span>
          </div>

          {/* Links desktop */}
          <div className="hidden lg:flex lg:flex-1 lg:flex-wrap lg:items-center lg:justify-center gap-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-slate-700 hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Usuario y logout desktop */}
          <div className="flex items-center gap-2 md:gap-3 lg:ml-auto">
            {userName && (
              <span className="hidden sm:inline text-sm text-slate-600 max-w-[120px] md:max-w-[200px] truncate">
                {userName}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 h-9"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar lateral */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white border-r shadow-lg z-50 lg:hidden transition-transform duration-300 ease-in-out",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header del sidebar */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Usuario info */}
        {userName && (
          <div className="p-4 bg-slate-50 border-b">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500 capitalize">{role.replace('_', ' ')}</p>
          </div>
        )}

        {/* Links del menú */}
        <nav 
          className="flex flex-col p-3 space-y-1 overflow-y-auto" 
          style={{ height: userName ? 'calc(100vh - 220px)' : 'calc(100vh - 160px)' }}
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
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Botón logout en sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
          <button
            onClick={() => {
              setIsMenuOpen(false)
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