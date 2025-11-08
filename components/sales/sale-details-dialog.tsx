"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { openSaleReceiptPDFForPrint } from "@/lib/pdf-generator"

interface SaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
}

interface SaleDetail {
  id: string
  quantity: number
  unit_price: number
  product: {
    id: string
    name: string
    truper_code: string
    barcode: string
    brand: string | null
  }
}

interface SaleWithDetails {
  id: string
  sale_date: string
  total_amount: number
  payment_received: number
  change_given: number
  branch: {
    name: string
  }
  customer: {
    name: string
    phone: string | null
  } | null
  sale_items: SaleDetail[]
}

export function SaleDetailsDialog({ open, onOpenChange, saleId }: SaleDetailsDialogProps) {
  const [sale, setSale] = useState<SaleWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // const supabase = createClient()

  useEffect(() => {
    if (open && saleId) {
      loadSaleDetails()
    }
  }, [open, saleId])

  const loadSaleDetails = async () => {
    setIsLoading(true)
    // const { data, error } = await supabase
    //   .from("sales")
    //   .select(`
    //     *,
    //     branch:branches(name),
    //     customer:customers(name, phone),
    //     sale_items(
    //       *,
    //       product:products(id, name, truper_code, barcode, brand)
    //     )
    //   `)
    //   .eq("id", saleId)
    //   .single()

    // if (!error && data) {
    //   setSale(data as SaleWithDetails)
    // }
    setIsLoading(false)
  }

  const handleGeneratePDF = async () => {
    if (!sale) return

    try {
      await openSaleReceiptPDFForPrint(sale as any)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error al generar el PDF")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Venta</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando detalles...</div>
          ) : sale ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Venta</p>
                  <p className="font-medium">
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
                  <p className="font-medium">{sale.branch.name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{sale.customer?.name || "Cliente General"}</p>
                  {sale.customer?.phone && <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="space-y-2">
                  {sale.sale_items.map((detail) => (
                    <Card key={detail.id} className="border">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{detail.product.name}</h4>
                            <Badge variant="secondary" className="font-bold shrink-0">
                              ${(detail.quantity * detail.unit_price).toFixed(2)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Código Truper</p>
                              <Badge variant="outline" className="text-xs">
                                {detail.product.truper_code}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Código de Barras</p>
                              <Badge variant="outline" className="text-xs">
                                {detail.product.barcode}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Cantidad</p>
                              <p className="font-medium">{detail.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Precio Unit.</p>
                              <p className="font-medium">${detail.unit_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">${sale.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium">${sale.payment_received.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Cambio:</span>
                  <span className="font-medium">${sale.change_given.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No se encontraron detalles</div>
          )}

          {!isLoading && sale && (
            <DialogFooter>
              <Button variant="outline" onClick={handleGeneratePDF} className="bg-transparent">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
