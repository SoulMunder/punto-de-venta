"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer } from "lucide-react"
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
  const router = useRouter()
  // const supabase = createClient()
  // const supabase = createClient()

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
    <div className="container mx-auto py-4 md:py-8 space-y-4 md:space-y-6 px-4">
      {/* Header with actions - hidden when printing */}
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

      {/* Purchase header info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Detalles de Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Compra</p>
              <p className="font-medium text-base md:text-lg">
                {new Date(purchase.purchase_date).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sucursal</p>
              <p className="font-medium text-base md:text-lg">{purchase.branch?.name || "Sin definir"}</p>
              <p className="text-sm text-muted-foreground">
                {purchase.branch?.address || "Sin definir dirección"}
              </p>
            </div>
            <div>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Total card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg md:text-xl font-bold">Total:</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            {purchase.purchase_items.map((item) => (
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
