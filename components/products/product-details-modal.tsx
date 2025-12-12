"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Package, DollarSign, FileText, Info, Clipboard } from "lucide-react"
import type { Product } from "@/lib/types"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ProductDetailsModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  showEditButton?: boolean
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] lg:!max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-6">

        {/* Título accesible oculto */}
        <DialogTitle>
          <VisuallyHidden>Detalles del Producto: {product.descripcion}</VisuallyHidden>
        </DialogTitle>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-6">
          {/* Columna izquierda */}
          <div className="space-y-4">
            {/* Imagen */}
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden max-w-[300px] mx-auto md:max-w-none">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.descripcion}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Precios personalizados */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-1 text-black">
                <DollarSign className="h-5 w-5 text-blue-500" /> Precios Personalizados
              </h4>
              {product.customPrices && product.customPrices.length > 0 ? (
                <div className="space-y-2">
                  {product.customPrices.map((custom, index) => (
                    <div key={index} className="p-2 sm:p-3 flex justify-between items-center border rounded-lg bg-blue-50">
                      <p className="font-semibold text-blue-700 truncate">{custom.price_name}</p>
                      <p className="font-bold text-blue-900 whitespace-nowrap ml-2">
                        ${custom.price_value.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-blue-50 text-blue-700">
                  <DollarSign className="h-6 w-6 mb-1" />
                  <p className="text-sm">No hay precios personalizados</p>
                </div>
              )}
            </div>

            {/* Información Fiscal */}
            {(product.codigoSAT || product.descripcionSAT) && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-1 text-black">
                  <FileText className="h-5 w-5 text-green-500" /> Información Fiscal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm sm:text-base">
                  {product.codigoSAT && (
                    <div>
                      <p className="font-semibold text-gray-700">Código SAT</p>
                      <p className="text-gray-500">{product.codigoSAT}</p>
                    </div>
                  )}
                  {product.descripcionSAT && (
                    <div>
                      <p className="font-semibold text-gray-700">Descripción SAT</p>
                      <p className="text-gray-500">{product.descripcionSAT}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            {/* Nombre del producto */}
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Package className="h-5 w-5 text-primary" /> {product.descripcion}
            </div>

            {/* Información General */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-1 text-black">
                <Clipboard className="h-5 w-5 text-primary" /> Información General
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm sm:text-base">
                <div>
                  <p className="font-semibold text-gray-700">Código</p>
                  <p className="text-gray-500">{product.codigo || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Clave</p>
                  <p className="text-gray-500">{product.clave || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">EAN</p>
                  <p className="text-gray-500">{product.ean || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Unidad</p>
                  <p className="text-gray-500">{product.unidad || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Marca</p>
                  <p className="text-gray-500">{product.marca || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Familia</p>
                  <p className="text-gray-500">{product.descripcionFamilia || "N/A"} ({product.familia || "N/A"})</p>
                </div>
              </div>
            </div>

            {/* Precios generales */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-1 text-black">
                <DollarSign className="h-5 w-5 text-blue-500" /> Precios
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Distribuidor (con IVA)", value: product.precioDistribuidorConIVA },
                  { label: "Público (con IVA)", value: product.precioPublicoConIVA },
                  { label: "Mayoreo (con IVA)", value: product.precioMayoreoConIVA },
                  { label: "Medio Mayoreo (con IVA)", value: product.precioMedioMayoreoConIVA },
                  { label: "Distribuidor (sin IVA)", value: product.precioDistribuidorSinIVA },
                  { label: "Público (sin IVA)", value: product.precioPublicoSinIVA },
                  { label: "Mayoreo (sin IVA)", value: product.precioMayoreoSinIVA },
                  { label: "Medio Mayoreo (sin IVA)", value: product.precioMedioMayoreoSinIVA },
                  { label: "Mínimo de venta", value: product.precioMinimoDeVenta },
                ].map((p, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-white">
                    <p className="text-xs text-gray-700">{p.label}</p>
                    <p className="text-base sm:text-lg font-bold text-primary mt-1">
                      {Number.isFinite(p.value) ? `$${p.value.toFixed(2)}` : "Sin definir"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalles adicionales */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-1 text-black">
                <Info className="h-5 w-5 text-purple-500" /> Detalles Adicionales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm sm:text-base">
                {[
                  { label: "Margen de Mercado", value: product.margenDeMercado },
                  { label: "Caja", value: product.caja },
                  { label: "Master", value: product.master },
                  { label: "Alta Rotación", value: product.altaRotacion },
                  { label: "Peso (Kg)", value: product.pesoKg },
                  { label: "Volumen (cm³)", value: product.volumenCm3 },
                ].map((d, idx) => (
                  <div key={idx}>
                    <p className="font-semibold text-gray-700">{d.label}</p>
                    <p className="text-gray-500">{d.value ?? "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
