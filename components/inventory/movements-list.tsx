"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Eye, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface Movement {
  _id: string
  fromBranch: { name: string }
  toBranch: { name: string }
  movementDate: string
  notes: string | null
  status: string
  createdBy: { name: string }
  inventoryMovementItems: {
    product: {
      name: string
      codigo: number
      unidad: string
      quantity: number
    }
  }[]
}

export function MovementsList() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // const supabase = createClient()

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inventory/transfer")
      console.log("🚀 Respuesta de movimientos:", res)
      if (!res.ok) throw new Error("Error al obtener movimientos")

      const data = await res.json()
      console.log("🚀 Movimientos obtenidos:", data)
      setMovements(data) // guardamos los movimientos en el state
    } catch (err) {
      console.error("❌ Error cargando movimientos:", err)
    } finally {
      setLoading(false)
    }
  }


  const handleViewDetails = (movement: Movement) => {
    setSelectedMovement(movement)
    setDetailsOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando movimientos...</div>
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">No hay traslados registrados</CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {movements.map((movement) => (
          <Card key={movement._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{movement.fromBranch.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{movement.toBranch.name}</span>
                    </div>
                    <Badge variant={movement.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {movement.status === "completed" ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Fecha:</span>{" "}
                      {new Date(movement.movementDate).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>
                      <span className="font-medium">Productos:</span> {movement.inventoryMovementItems.length}
                    </div>
                    <div>
                      <span className="font-medium">Creado por:</span> {movement.createdBy.name}
                    </div>
                  </div>

                  {movement.notes && <p className="text-xs text-muted-foreground italic">"{movement.notes}"</p>}
                </div>

                <Button variant="outline" size="sm" onClick={() => handleViewDetails(movement)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Dialog */}
      {selectedMovement && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Traslado</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(selectedMovement.movementDate).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant={selectedMovement.status === "completed" ? "default" : "secondary"}>
                    {selectedMovement.status === "completed" ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Sucursal Origen</p>
                  <p className="font-medium">{selectedMovement.fromBranch.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sucursal Destino</p>
                  <p className="font-medium">{selectedMovement.toBranch.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Creado por</p>
                  <p className="font-medium">{selectedMovement.createdBy.name}</p>
                </div>
                {selectedMovement.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notas</p>
                    <p className="font-medium italic">"{selectedMovement.notes}"</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos Transferidos
                </h3>
                <div className="space-y-2">
                  {selectedMovement.inventoryMovementItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.product.quantity}</p>
                        <p className="text-xs text-muted-foreground">{item.product.unidad}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
