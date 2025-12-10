"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, List, LayoutGrid } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/inventory/data-table-pagination"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface PurchaseDetailsViewProps {
  purchaseId: string
}

interface PurchaseDetail {
  id: string
  quantity: number
  purchase_price: number
  product: {
    id: string
    name: string
    truper_code: string
    barcode: string
    unit_of_measure: string
  }
}

interface PurchaseWithDetails {
  id: string
  purchase_date: string
  notes: string | null
  created_at: string
  branch: {
    name: string
    address: string
  }
  purchase_items: PurchaseDetail[]
  created_by_profile: string
}

export function PurchaseDetailsView({ purchaseId }: PurchaseDetailsViewProps) {
  const [purchase, setPurchase] = useState<PurchaseWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const offset = (currentPage - 1) * entriesPerPage
  const router = useRouter()
  // const supabase = createClient()
  // const supabase = createClient()


  useEffect(() => {
    if (purchase) {
      console.log("Purchase cargado:", purchase)
    }
  }, [purchase])


  useEffect(() => {
    loadPurchaseDetails()
  }, [purchaseId])

  const loadPurchaseDetails = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`)
      if (!res.ok) throw new Error("Error cargando detalles de la compra")
      const data: PurchaseWithDetails = await res.json()
      setPurchase(data)
    } catch (error) {
      console.error(error)
      setPurchase(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Función helper actualizada para retornar colores de fondo y texto
  const getUnitColorClasses = (unit: string) => {
    let hash = 5381
    for (let i = 0; i < unit.length; i++) {
      hash = ((hash << 5) + hash) + unit.charCodeAt(i)
    }

    const colorClasses = [
      { bg: 'bg-red-500/15', text: 'text-red-700', hover: 'hover:bg-red-500/25' },
      { bg: 'bg-blue-500/15', text: 'text-blue-700', hover: 'hover:bg-blue-500/25' },
      { bg: 'bg-green-500/15', text: 'text-green-700', hover: 'hover:bg-green-500/25' },
      { bg: 'bg-purple-500/15', text: 'text-purple-700', hover: 'hover:bg-purple-500/25' },
      { bg: 'bg-yellow-500/15', text: 'text-yellow-700', hover: 'hover:bg-yellow-500/25' },
    ]

    return colorClasses[Math.abs(hash) % colorClasses.length]
  }


  const calculateTotal = () => {
    if (!purchase) return 0
    return purchase.purchase_items.reduce((sum, item) => sum + item.quantity * item.purchase_price, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">Cargando detalles de compra...</div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12 text-muted-foreground">No se encontró la compra</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 md:py-8 space-y-4 md:space-y-6 px-4 print:hidden">
      {/* Header with actions - hidden when printing */}


      <div className="flex items-center gap-2 w-full">
        <Button onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>

        {/* Contenedor que empuja estos botones a la derecha */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9 p-0"
            aria-label="Vista en tarjetas"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-9 w-9 p-0"
            aria-label="Vista en tabla"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Purchase header info */}
      <Card className="gap-1">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Detalles de Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fecha de Compra</p>
              <p className="font-medium text-base md:text-lg">
                {new Date(purchase.purchase_date).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sucursal</p>
              <p className="font-medium text-base md:text-lg">{purchase.branch?.name || "Sin definir"}</p>
              <p className="text-sm text-muted-foreground">
                {purchase.branch?.address || "Sin definir dirección"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Registrado por</p>
              <p className="font-medium">
                {purchase.created_by_profile || "Usuario"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(purchase.created_at).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          {purchase.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="font-medium">{purchase.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products table converted to card-based layout for mobile */}
      <Card className="gap-1 pb-0">

        <CardContent>
          <div className="space-y-3">
            {/* Total card */}
            <Card className="bg-primary/5 border-primary/20 p-2">
              <CardContent className="pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg md:text-xl font-bold">Total de productos:</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {viewMode === 'table' ? (
              <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
                <div style={{ height: "45vh" }}>
                  <Table>
                    <TableHeader className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}>
                      <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                        <TableHead className="font-semibold text-foreground bg-muted ">Producto</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Código Truper</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Código de Barras</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Unidad</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Cantidad</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Precio Compra</TableHead>
                        <TableHead className="font-semibold text-foreground bg-muted text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchase.purchase_items.slice(offset, offset + entriesPerPage).map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                          <TableCell className="font-medium ">{item.product.name}</TableCell>
                          <TableCell className="text-center">{item.product.truper_code}</TableCell>
                          <TableCell className="text-center">{item.product.barcode}</TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const colors = getUnitColorClasses(item.product.unit_of_measure)
                              return (
                                <Badge className={`${colors.bg} ${colors.text} ${colors.hover} transition-colors px-2 py-1`}>
                                  {item.product.unit_of_measure}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 rounded-full bg-primary/10 font-bold text-primary text-sm">
                              {item.quantity}
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="font-semibold text-base">
                              ${Number(item.purchase_price).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-base font-bold shrink-0">
                              ${(item.quantity * item.purchase_price).toFixed(2)}
                            </Badge>
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              // existing card list layout
              <>
                {purchase.purchase_items.slice(offset, offset + entriesPerPage).map((item) => (
                  <Card key={item.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base md:text-lg">{item.product.name}</h3>
                          <Badge variant="secondary" className="text-base font-bold shrink-0">
                            ${(item.quantity * item.purchase_price).toFixed(2)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Código Truper</p>
                            <Badge variant="outline">{item.product.truper_code}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Código de Barras</p>
                            <Badge variant="outline">{item.product.barcode}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unidad</p>
                            <p className="font-medium">{item.product.unit_of_measure}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cantidad</p>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio Compra</p>
                            <p className="font-medium">${item.purchase_price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            <DataTablePagination
              currentPage={currentPage}
              entriesPerPage={entriesPerPage}
              totalCount={purchase.purchase_items.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setEntriesPerPage(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .container,
          .container * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
