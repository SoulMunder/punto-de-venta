"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Printer } from "lucide-react"
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
  product_code:string
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
  const router = useRouter()
  // const supabase = createClient()

  useEffect(() => {
    loadSaleDetails()
  }, [saleId])

  const loadSaleDetails = async () => {
    setIsLoading(true)
    try {
      const { data: saleData, error:saleError } = await getSaleById(saleId)
      if (saleError as string || !saleData) {
        setIsLoading(false)
        throw new Error(`Error al cargar ventas: ${saleError}`)
      }
      setSale(saleData)
    } catch (error) {
      console.error("Error al cargar el detalle de la venta: ", error)
      alert('Error al cargar el detalle de la venta')
    }finally{
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
      <div className="container mx-auto py-4 md:py-8 space-y-4 md:space-y-6 px-4">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <Card>
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
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sale.sale_items.map((item) => (
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-base md:text-lg">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold">${sale.total_amount.toFixed(2)}</span>
              </div>
              <Separator />
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
