"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductDetailsModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  showEditButton?: boolean
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  if (!product) return null

  // const customPrices = product.custom_prices || {}
  // const characteristics = product.characteristics || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] lg:!max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Detalles del Producto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-4 sm:gap-6">
          {/* Columna izquierda - Solo imagen */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden max-w-[250px] mx-auto md:max-w-none">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.descripcion}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Toda la información */}
          <div className="space-y-3 sm:space-y-4">
            {/* Información básica */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold mb-1">{product.descripcion}</h2>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Código</p>
                  <p className="font-mono font-semibold text-sm sm:text-base">{product.codigo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Clave</p>
                  <p className="font-mono font-semibold text-sm sm:text-base">{product.clave || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">EAN</p>
                  <p className="font-mono font-semibold text-sm sm:text-base">{product.ean || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Unidad</p>
                  <p className="font-semibold text-sm sm:text-base">{product.unidad || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Marca</p>
                  <p className="font-semibold text-sm sm:text-base">{product.marca || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Familia</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {product.descripcionFamilia || "N/A"} ({product.familia})
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Precios */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Precios</h3>

              {/* 🟢 Precios principales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs text-muted-foreground">Precio Distribuidor (con IVA)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <p className="text-base sm:text-lg font-bold text-primary">
                      {Number.isFinite(Number(product.precioDistribuidorConIVA)) &&
                        String(product.precioDistribuidorConIVA) !== "*"
                        ? `$${Number(product.precioDistribuidorConIVA).toFixed(2)}`
                        : "Sin definir"}
                    </p>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs text-muted-foreground">Precio Público (con IVA)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <p className="text-base sm:text-lg font-bold text-primary">
                      {Number.isFinite(Number(product.precioPublicoConIVA)) &&
                        String(product.precioPublicoConIVA) !== "*"
                        ? `$${Number(product.precioPublicoConIVA).toFixed(2)}`
                        : "Sin definir"}
                    </p>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs text-muted-foreground">Precio Mayoreo (con IVA)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <p className="text-base sm:text-lg font-bold text-primary">
                      {Number.isFinite(Number(product.precioMayoreoConIVA)) &&
                        String(product.precioMayoreoConIVA) !== "*"
                        ? `$${Number(product.precioMayoreoConIVA).toFixed(2)}`
                        : "Sin definir"}
                    </p>

                  </CardContent>
                </Card>
              </div>

              {/* 🟡 Precios personalizados */}
              {product.customPrices && product.customPrices.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <h4 className="text-xs sm:text-sm font-semibold mb-2">Precios Personalizados</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {product.customPrices.map((custom, index) => (
                      <Card key={index}>
                        <CardContent className="p-3 sm:p-4">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">
                            {custom.price_name}
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-primary">
                            ${custom.price_value.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>


            <Separator />

            {/* Información Adicional */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Detalles Adicionales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Margen de Mercado</p>
                  <p className="font-semibold">{product.margenDeMercado}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Caja</p>
                  <p className="font-semibold">{product.caja}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Master</p>
                  <p className="font-semibold">{product.master}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Alta Rotación</p>
                  <p className="font-semibold">{product.altaRotacion}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Peso (Kg)</p>
                  <p className="font-semibold">{product.pesoKg}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Volumen (cm³)</p>
                  <p className="font-semibold">{product.volumenCm3}</p>
                </div>
              </div>
            </div>

            {/* Información Fiscal */}
            {(product.codigoSAT || product.descripcionSAT) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Información Fiscal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    {product.codigoSAT && (
                      <div>
                        <p className="text-muted-foreground mb-1">Código SAT</p>
                        <p className="font-mono font-semibold text-sm sm:text-base">{product.codigoSAT}</p>
                      </div>
                    )}
                    {product.descripcionSAT && (
                      <div>
                        <p className="text-muted-foreground mb-1">Descripción SAT</p>
                        <p className="font-semibold text-sm sm:text-base">{product.descripcionSAT}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
