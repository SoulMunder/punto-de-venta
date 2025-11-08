"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface PurchaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  }
}

interface PurchaseWithDetails {
  id: string
  purchase_date: string
  notes: string | null
  branch: {
    name: string
  }
  purchase_items: PurchaseDetail[]
}

export function PurchaseDetailsDialog({ open, onOpenChange, purchaseId }: PurchaseDetailsDialogProps) {
  const [purchase, setPurchase] = useState<PurchaseWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // const supabase = createClient()

  useEffect(() => {
    if (open && purchaseId) {
      loadPurchaseDetails()
    }
  }, [open, purchaseId])

  const loadPurchaseDetails = async () => {
    setIsLoading(true)
    // const { data, error } = await supabase
    //   .from("purchases")
    //   .select(`
    //     *,
    //     branch:branches(name),
    //     purchase_items(
    //       *,
    //       product:products(id, name, truper_code, barcode)
    //     )
    //   `)
    //   .eq("id", purchaseId)
    //   .single()

    // if (!error && data) {
    //   setPurchase(data as PurchaseWithDetails)
    // }
    setIsLoading(false)
  }

  const calculateTotal = () => {
    if (!purchase) return 0
    return purchase.purchase_items.reduce((sum, item) => sum + item.quantity * item.purchase_price, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Compra</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando detalles...</div>
        ) : purchase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                <p className="font-medium">
                  {new Date(purchase.purchase_date).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium">{purchase.branch.name}</p>
              </div>
              {purchase.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="font-medium">{purchase.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Productos</h3>
              <div className="space-y-2">
                {purchase.purchase_items.map((item) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{item.product.name}</h4>
                          <Badge variant="secondary" className="font-bold shrink-0">
                            ${(item.quantity * item.purchase_price).toFixed(2)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Código Truper</p>
                            <Badge variant="outline" className="text-xs">
                              {item.product.truper_code}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Código de Barras</p>
                            <Badge variant="outline" className="text-xs">
                              {item.product.barcode}
                            </Badge>
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

                {/* Total card */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total:</span>
                      <span className="text-lg font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No se encontraron detalles</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
