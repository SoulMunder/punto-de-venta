"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  Building2,
  ShoppingBag,
  Receipt,
  UserCog,
  ShoppingCart,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Layers,
  BarChart3,
  FileText,
  Warehouse,
  History,
  Repeat,
  Box,
  BookOpen,
  GitBranch,
  Menu,
  X,
  MoreVertical
} from "lucide-react"
import type { AllowedRole } from "@/lib/types"
import { useSidebar } from "./sidebar-context"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  role: AllowedRole
  userName?: string
}

interface LinkItem {
  href: string
  label: string
  icon: any
  isSubItem?: boolean
}

interface NavItem {
  href?: string
  label: string
  icon: any
  children?: LinkItem[]
}

export function Sidebar({ role, userName }: SidebarProps) {
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const sidebarRef = useRef<HTMLElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)

  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inventory: false
  })

  // Expandir automáticamente la sección si una subruta está activa
  useEffect(() => {
    const activePaths = ['/admin/inventory', '/admin/purchases', '/admin/sales']
    if (activePaths.some(path => pathname?.startsWith(path))) {
      setExpandedSections(prev => ({ ...prev, inventory: true }))
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  // Función para alternar la expansión de secciones
  const toggleSection = (section: string) => {
    if (!isCollapsed) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }))
    }
  }

  // Verificar si una ruta está activa (incluyendo subrutas)
  const isLinkActive = (href: string, hasChildren = false) => {
    if (hasChildren) {
      return pathname?.startsWith(href)
    }
    return pathname === href
  }

  // Manejar el inicio del resize desde el borde
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    const startX = e.clientX
    const startCollapsed = isCollapsed
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      
      // Si se arrastra hacia la izquierda más de 50px desde el borde derecho
      // y el sidebar está expandido, se contrae
      if (!startCollapsed && deltaX < -50) {
        toggleCollapse()
        cleanup()
      }
      // Si se arrastra hacia la derecha más de 50px y el sidebar está contraído, se expande
      else if (startCollapsed && deltaX > 50) {
        toggleCollapse()
        cleanup()
      }
    }
    
    const handleMouseUp = () => {
      cleanup()
    }
    
    const cleanup = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [isCollapsed, toggleCollapse])

  // Manejar doble click en el área vacía del sidebar
  const handleSidebarClick = useCallback((e: React.MouseEvent) => {
    // Solo procesar si se hace doble click
    if (e.detail === 2) {
      // Verificar que no se haga click en elementos interactivos
      const target = e.target as HTMLElement
      const isInteractive = 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('[role="button"]') ||
        target.closest('[data-state="open"]')
      
      if (!isInteractive) {
        toggleCollapse()
      }
    }
  }, [toggleCollapse])

  // Definir enlaces para cada rol
  const adminLinks: NavItem[] = [
    {
      href: "/admin/products",
      label: "Catálogo Trupper",
      icon: Box
    },
    {
      href: "/admin/own-products",
      label: "Catálogo interno",
      icon: Layers
    },
    {
      label: "Recetas",
      icon: GitBranch,
      children: [
        { href: "/admin/recipe-catalog", label: "Catálogo de recetas", icon: BookOpen, isSubItem: true },
        { href: "/admin/recipe/movements", label: "Movimientos", icon: Repeat, isSubItem: true },
      ]
    },
    {
      label: "Inventario",
      icon: Warehouse,
      children: [
        { href: "/admin/inventory", label: "Productos", icon: Layers, isSubItem: true },
        { href: "/admin/inventory-logs", label: "Entradas y salidas", icon: History, isSubItem: true },
        { href: "/admin/purchases", label: "Compras", icon: ShoppingBag, isSubItem: true },
        { href: "/admin/inventory/movements", label: "Traslados", icon: Repeat, isSubItem: true },
      ]
    },
    {
      label: "Ventas",
      icon: ShoppingCart,
      children: [
        { href: "/admin/sales", label: "Historial de ventas", icon: BarChart3, isSubItem: true },
        { href: "/admin/pos", label: "Punto de Venta", icon: ShoppingCart, isSubItem: true },
      ]
    },
    {
      href: "/admin/customers",
      label: "Clientes",
      icon: Users
    },
    {
      href: "/admin/users",
      label: "Usuarios",
      icon: BarChart3
    },
  ]

  const branchManagerLinks: NavItem[] = [
    {
      href: "/pos",
      label: "Punto de Venta",
      icon: ShoppingCart
    },
    {
      label: "Inventario",
      icon: Warehouse,
      children: [
        { href: "/admin/inventory", label: "Gestión", icon: Layers, isSubItem: true },
        { href: "/admin/sales", label: "Historial de Ventas", icon: BarChart3, isSubItem: true },
      ]
    },
    {
      href: "/admin/customers",
      label: "Clientes",
      icon: Users
    },
  ]

  const cashierLinks: NavItem[] = [
    {
      href: "/pos",
      label: "Punto de Venta",
      icon: ShoppingCart
    }
  ]

  let navItems = cashierLinks
  if (role === "admin") navItems = adminLinks
  else if (role === "branch_manager") navItems = branchManagerLinks

  const renderNavItems = () => {
    return navItems.map((item) => {
      const Icon = item.icon
      const hasChildren = item.children && item.children.length > 0
      const sectionKey = item.label.toLowerCase().replace(/ /g, '_')
      const isExpanded = expandedSections[sectionKey] && !isCollapsed
      const isChildActive = hasChildren && item.children?.some(child => isLinkActive(child.href))
      const isActive = (item.href ? isLinkActive(item.href) : false) || isChildActive

      if (isCollapsed) {
        // Versión colapsada - solo icono con dropdown para hijos
        if (hasChildren) {
          return (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "group relative flex items-center justify-center w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                      : "text-slate-600 hover:bg-primary/5 hover:text-primary"
                  )}
                  title={item.label}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="start" 
                className="w-56"
                sideOffset={8}
              >
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                  {item.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {item.children?.map((child) => {
                  const ChildIcon = child.icon
                  const isChildActive = isLinkActive(child.href)
                  return (
                    <DropdownMenuItem key={child.href} asChild>
                      <Link
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer",
                          isChildActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{child.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        // Enlaces simples en modo colapsado
        return (
          <Link
            key={item.href}
            href={item.href!}
            className={cn(
              "group relative flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                : "text-slate-600 hover:bg-primary/5 hover:text-primary"
            )}
            title={item.label}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
            )}
          </Link>
        )
      }

      // Versión expandida - completo
      return (
        <div key={item.label} className="space-y-1">
          {hasChildren ? (
            <>
              <button
                onClick={() => toggleSection(sectionKey)}
                className={cn(
                  "group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm border-l-2 border-primary"
                    : "text-slate-600 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isActive && !isExpanded && (
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                    )}
                  </div>
                  <span className="truncate font-semibold">{item.label}</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-all duration-300 text-slate-400 group-hover:text-primary",
                  isExpanded ? "rotate-180" : ""
                )} />
              </button>

              {/* Subitems con animación */}
              {isExpanded && item.children && (
                <div className="ml-4 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const isChildActive = isLinkActive(child.href)

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-2.5 ml-4 rounded-lg text-sm font-medium transition-all duration-200",
                          isChildActive
                            ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                            : "text-slate-500 hover:bg-primary/5 hover:text-slate-700"
                        )}
                      >
                        <ChildIcon className={cn(
                          "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                          isChildActive ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"
                        )} />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <Link
              href={item.href!}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm"
                  : "text-slate-600 hover:bg-primary/5 hover:text-primary"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </div>
              <span className="truncate font-semibold">{item.label}</span>
            </Link>
          )}
        </div>
      )
    })
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <aside
          ref={sidebarRef}
          onClick={handleSidebarClick}
          className={cn(
            "flex flex-col bg-gradient-to-b from-white to-slate-50/50 border-r border-slate-200 h-screen fixed top-0 left-0 transition-all duration-300 ease-in-out z-30",
            isCollapsed ? "w-16" : "w-64",
            isResizing && "cursor-col-resize"
          )}
        >
          {/* Área de borde para resize */}
          <div
            ref={resizeHandleRef}
            className="absolute top-0 right-0 w-2 h-full z-40 cursor-col-resize hover:bg-primary/10 transition-all duration-150 group"
            onMouseDown={handleResizeStart}
            title="Arrastrar para contraer/expandir"
          >
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-300 group-hover:bg-primary opacity-0 group-hover:opacity-100 rounded-full transition-all duration-150" />
          </div>

          {/* Header con logo */}
          <div className={cn(
            "flex items-center border-b border-slate-200/50 p-4 h-16",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="relative">
              <Image
                src="/images/masicsa-logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  MASICSA
                </span>
                <span className="text-[10px] text-slate-400 font-medium">TRUPPER SYSTEM</span>
              </div>
            )}
          </div>

          {/* Información del usuario */}
          {userName && (
            <div className={cn(
              "p-4 bg-gradient-to-r from-slate-50 to-white/50 border-y border-slate-200/50",
              isCollapsed && "p-2"
            )}>
              {!isCollapsed ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 capitalize truncate bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                      {role.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              )}
            </div>
          )}

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="mb-4">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
                  Navegación
                </p>
              )}
              <div className="space-y-1">
                {renderNavItems()}
              </div>
            </div>
          </nav>

          {/* Pie de página con logout */}
          <div className="p-4 border-t border-slate-200/50">
            <button
              onClick={handleLogout}
              className={cn(
                "group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                "bg-gradient-to-r from-red-50 to-red-50/50 text-red-600 hover:from-red-100 hover:to-red-100/50 hover:text-red-700 hover:shadow-sm",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
              {!isCollapsed && (
                <span className="font-semibold">Cerrar Sesión</span>
              )}
            </button>
          </div>
        </aside>

        {/* Espaciador para el contenido principal */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )} />
      </div>

      {/* Overlay para mobile cuando sidebar está abierto */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 shadow-xl z-50 lg:hidden transition-transform duration-300 ease-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header mobile */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/images/masicsa-logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                MASICSA
              </span>
              <span className="text-[10px] text-slate-400 font-medium">TRUPPER SYSTEM</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobile}
            className="text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenido mobile */}
        <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
          <div className="space-y-1">
            {renderNavItems()}
          </div>

          {/* Logout mobile */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-red-50 to-red-50/50 text-red-600 hover:from-red-100 hover:to-red-100/50 hover:text-red-700 hover:shadow-sm"
            >
              <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
              <span className="font-semibold">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}