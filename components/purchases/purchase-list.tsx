"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Branch, Purchase } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Eye, ShoppingCart, List, LayoutGrid } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { PurchaseDialog } from "./purchase-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/inventory/data-table-pagination"
import { cn } from "@/lib/utils"
import Link from "next/link"



export function PurchaseList() {
  const { data: session, status } = useSession()
  const [userId, setUserId] = useState<string>("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(12)
  const offset = (currentPage - 1) * entriesPerPage
  const router = useRouter()

  // --- 🟡 Cargar sucursales solo una vez ---
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const res = await fetch("/api/branches")
        if (!res.ok) throw new Error("Error cargando sucursales")

        const data = await res.json()
        setBranches(data)
      } catch (err) {
        console.error("❌ Error cargando sucursales:", err)
        setBranches([])
      }
    }

    cargarSucursales()
  }, [])

  // 🔹 Cargar compras cada vez que cambie el usuario autenticado
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return

    const cargarPurchases = async () => {
      setIsLoading(true)
      setUserId(session.user.id)

      try {
        const res = await fetch("/api/purchases")
        if (!res.ok) throw new Error("Error cargando compras")

        const data: Purchase[] = await res.json()
        setPurchases(data)
      } catch (error) {
        console.error("Error cargando compras:", error)
      } finally {
        setIsLoading(false)
      }
    }

    cargarPurchases()
  }, [status, session?.user?.id])



  const handleViewDetails = (purchaseId: string) => {
    router.push(`/admin/purchases/${purchaseId}`)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">

  {/* --- MOBILE: cargar nuevas compras arriba (full width) --- */}
  <div className="flex sm:hidden">
    <Link href="/admin/purchases/cargar-compras" passHref className="w-full">
      <Button className="w-full">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Cargar nuevas compras
      </Button>
    </Link>
  </div>

  {/* --- MOBILE: nueva compra + vistas abajo --- */}
  <div className="flex sm:hidden items-center justify-between gap-2">
    <Button onClick={() => setDialogOpen(true)} className="flex-1">
      <Plus className="mr-2 h-4 w-4" />
      Nueva Compra
    </Button>

    <div className="flex items-center">
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => setViewMode("grid")}
        className="h-9 w-9 p-0"
        aria-label="Vista en tarjetas"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => setViewMode("table")}
        className="ml-2 h-9 w-9 p-0"
        aria-label="Vista en tabla"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  </div>

  {/* --- DESKTOP / TABLET: vista original --- */}
  <div className="hidden sm:flex items-center gap-2">
    <Button onClick={() => setDialogOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nueva Compra
    </Button>

    <Link href="/admin/purchases/cargar-compras" passHref>
      <Button>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Cargar nuevas compras
      </Button>
    </Link>
  </div>

  <div className="hidden sm:flex items-center">
    <Button
      variant={viewMode === "grid" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("grid")}
      className="h-9 w-9 p-0"
      aria-label="Vista en tarjetas"
    >
      <LayoutGrid className="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === "table" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("table")}
      className="ml-2 h-9 w-9 p-0"
      aria-label="Vista en tabla"
    >
      <List className="h-4 w-4" />
    </Button>
  </div>

</div>


      {isLoading ? (
        viewMode === 'table' ? (
          <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
            <div style={{ height: "65vh" }}>
              <Table>
                <TableHeader
                  className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}
                >
                  <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                    <TableHead className="font-semibold text-foreground bg-muted">Fecha</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">No. Pedido</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Notas</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Registrado por</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Fecha de Registro</TableHead>
                    <TableHead className="text-center font-semibold text-foreground bg-muted">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index} className="border-b">
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <div className="pt-2 border-t space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : purchases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay compras registradas</div>
      ) : viewMode === 'table' ? (
        <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
          <div style={{ height: "65vh" }}>
            <Table>
              <TableHeader
                className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}
              >
                <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                  <TableHead className="font-semibold text-foreground bg-muted text-center">Fecha</TableHead>
                  <TableHead className="font-semibold text-foreground bg-muted text-center">No. Pedido</TableHead>
                  <TableHead className="font-semibold text-foreground bg-muted text-center">Notas</TableHead>
                  <TableHead className="font-semibold text-foreground bg-muted text-center">Registrado por</TableHead>
                  <TableHead className="font-semibold text-foreground bg-muted text-center">Fecha de Registro</TableHead>
                  <TableHead className="text-center font-semibold text-foreground bg-muted">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {purchases.slice(offset, offset + entriesPerPage).map((purchase) => (
                  <TableRow key={purchase._id} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                    {/* FECHA */}
                    <TableCell className="text-sm font-medium text-center">
                      <Badge variant="outline" className="px-2 py-1 text-xs">
                        {new Date(purchase.fecha).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </Badge>
                    </TableCell>
                    {/* NO. PEDIDO */}
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="px-2 py-1 font-medium text-blue-700 bg-blue-100 border-blue-300"
                      >
                        {purchase.noPedido || "Sin definir"}
                      </Badge>
                    </TableCell>

                    {/* NOTAS */}
                    <TableCell className="max-w-[300px] text-sm text-center">
                      {purchase.notes ? (
                        purchase.notes
                      ) : (
                        <Badge
                          variant="outline"
                          className="px-2 py-1 text-xs bg-zinc-100 text-zinc-600 border-zinc-300"
                        >
                          Sin definir
                        </Badge>
                      )}
                    </TableCell>

                    {/* REGISTRADO POR */}
                    <TableCell className="text-sm text-center">
                      {purchase.createdBy || "Usuario"}
                    </TableCell>

                    {/* FECHA DE REGISTRO */}
                    <TableCell className="text-sm text-center">
                      <Badge variant="outline" className="px-2 py-1 text-xs">
                        {new Date(purchase.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge
                          onClick={() => handleViewDetails(purchase._id)}
                          className="cursor-pointer px-3 py-1 m-1 text-xs bg-primary hover:bg-primary/90 transition-colors"
                        >
                          Ver detalles
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.slice(offset, offset + entriesPerPage).map((purchase) => (
            <Card key={purchase._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(purchase.fecha).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC"
                      })}
                    </p>
                    <Badge variant="outline">No. Pedido: {purchase.noPedido || "Sin definir sucursal"}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetails(purchase._id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Notas:</span>
                    <p className="mt-1">{purchase.notes || "-"}</p>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registrado por:</span>
                      <span className="text-xs">
                        {purchase.createdBy || "Usuario"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Fecha de registro:</span>
                      <span className="text-xs">
                        {new Date(purchase.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalCount={purchases.length}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setEntriesPerPage(size)
          setCurrentPage(1)
        }}
        pageSizeOptions={[6, 12, 24, 48]}
      />

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branches={branches}
        userId={userId}
        onSuccess={async () => {
          if (!userId) return
          setIsLoading(true)
          try {
            const res = await fetch(`/api/purchases?userId=${userId}`)
            if (!res.ok) throw new Error("Error cargando compras")
            const data: Purchase[] = await res.json()
            setPurchases(data)
          } catch (error) {
            console.error(error)
          } finally {
            setIsLoading(false)
          }
        }}
      />
    </div>
  )
}