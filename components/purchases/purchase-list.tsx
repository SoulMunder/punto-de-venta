"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Branch, Purchase } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Eye, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { PurchaseDialog } from "./purchase-dialog"
import Link from "next/link"



export function PurchaseList() {
  const { data: session, status } = useSession()
  const [userId, setUserId] = useState<string>("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
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
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
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

      {isLoading ? (
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
      ) : purchases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay compras registradas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(purchase.fecha).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC" // ← Agregar esto para forzar UTC
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