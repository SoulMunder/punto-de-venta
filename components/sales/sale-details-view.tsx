"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Printer, List, LayoutGrid } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/inventory/data-table-pagination"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { openSaleReceiptPDFForPrint } from "@/lib/pdf-generator"
import { getSaleById } from "@/app/actions/sales/get-sale-by-id"

interface SaleDetailsViewProps {
  saleId: string
}

interface SaleDetail {
  id: string
  quantity: number
  unit_price: number
  product_code: string
  product: {
    id: string
    name: string
    truper_code: string
    barcode: string
    unit_of_measure: string
  }
}

export interface SaleWithDetails {
  id: string
  sale_date: string
  total_amount: number
  payment_received: number
  change_given: number
  created_at: string
  branch: {
    name: string
    address: string
  }
  customer: {
    name: string
    phone: string | null
    address: string | null
  } | null
  sale_items: SaleDetail[]
  created_by_profile: {
    name: string | null
    username: string
  } | null
}

export function SaleDetailsView({ saleId }: SaleDetailsViewProps) {
  const [sale, setSale] = useState<SaleWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const offset = (currentPage - 1) * entriesPerPage
  const router = useRouter()
  // const supabase = createClient()

  useEffect(() => {
    loadSaleDetails()
  }, [saleId])

  useEffect(() => {
    console.log(sale)
  }, [sale])

  // Función helper para el color del punto según unidad de medida
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



  const loadSaleDetails = async () => {
    setIsLoading(true)
    try {
      const { data: saleData, error: saleError } = await getSaleById(saleId)
      if (saleError as string || !saleData) {
        setIsLoading(false)
        throw new Error(`Error al cargar ventas: ${saleError}`)
      }
      setSale(saleData)
    } catch (error) {
      console.error("Error al cargar el detalle de la venta: ", error)
      alert('Error al cargar el detalle de la venta')
    } finally {
      setIsLoading(false)
    }
    setIsLoading(false)
  }

  const handlePrint = async () => {
    if (!sale) return

    try {
      await openSaleReceiptPDFForPrint(sale as any)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error al generar el PDF")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">Cargando detalles de venta...</div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12 text-muted-foreground">No se encontró la venta</div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto py-4 md:py-8 space-y-4 md:space-y-6 px-4  print:hidden">

        <div className="flex items-center justify-between w-full">
          {/* Izquierda: Imprimir */}
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>

          {/* Derecha: botones de vista */}
          <div className="flex items-center gap-2">
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


        <Card className="gap-1">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Detalles de Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Venta</p>
                <p className="font-medium text-base md:text-lg">
                  {new Date(sale.sale_date).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium text-base md:text-lg">{sale.branch.name}</p>
                <p className="text-sm text-muted-foreground">{sale.branch.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedor</p>
                <p className="font-medium">
                  {sale.created_by_profile?.name || sale.created_by_profile?.username || "Usuario"}
                </p>
              </div>
            </div>

            {sale.customer && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Cliente</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium">{sale.customer.name}</p>
                  </div>
                  {sale.customer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{sale.customer.phone}</p>
                    </div>
                  )}
                  {sale.customer.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{sale.customer.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <div className="space-y-3">

              <div className="flex justify-between items-center text-xl md:text-2xl">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-primary">${sale.total_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="text-muted-foreground">Pagado:</span>
                <span className="font-medium">${sale.payment_received.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="text-muted-foreground">Cambio:</span>
                <span className="font-medium">${sale.change_given.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-1 pb-0">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {viewMode === 'table' ? (
                <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
                  <div style={{ height: "45vh" }}>
                    <Table>
                      <TableHeader className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}>
                        <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                          <TableHead className="font-semibold text-foreground bg-muted">Producto</TableHead>
                          <TableHead className="font-semibold text-foreground bg-muted text-center">Código Truper</TableHead>
                          <TableHead className="font-semibold text-foreground bg-muted text-center">Código de Barras</TableHead>
                          <TableHead className="font-semibold text-foreground bg-muted text-center">Unidad</TableHead>
                          <TableHead className="font-semibold text-center text-foreground bg-muted text-center">Cantidad</TableHead>
                          <TableHead className="font-semibold text-right text-foreground bg-muted text-center">Precio Unitario</TableHead>
                          <TableHead className="font-semibold text-right text-foreground bg-muted text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {sale.sale_items.slice(offset, offset + entriesPerPage).map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                            <TableCell className="font-medium">{item.product.name}</TableCell>
                            <TableCell className="text-center">{item.product.truper_code}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{item.product.barcode}</Badge>
                            </TableCell>
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
                                ${Number(item.unit_price).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-base font-bold shrink-0">
                                ${(item.quantity * item.unit_price).toFixed(2)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <>
                  {sale.sale_items.slice(offset, offset + entriesPerPage).map((item) => (
                    <Card key={item.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base md:text-lg">{item.product.name}</h3>
                            <Badge variant="secondary" className="text-base font-bold shrink-0">
                              ${(item.quantity * item.unit_price).toFixed(2)}
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
                              <p className="text-muted-foreground">Precio Unitario</p>
                              <p className="font-medium">${item.unit_price.toFixed(2)}</p>
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
                totalCount={sale.sale_items.length}
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
    </>
  )
}
