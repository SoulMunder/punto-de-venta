"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, Printer, Pencil } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductDetailsViewProps {
  product: Product & {
    image_url?: string
    line?: string
    characteristics?: Record<string, string>
    fiscal_product_key?: string
    fiscal_tax_type?: string
  }
}

export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  const characteristics = product.characteristics || {}
  // const customPrices = product.custom_prices || {}

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Detalles del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[400px_1fr] gap-6">
            {/* Columna izquierda - Solo imagen */}
            <div className="space-y-4">
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden sticky top-6">
                {product.image_url ? (
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha - Toda la información */}
            <div className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Código Truper</p>
                    <p className="font-mono font-semibold">{product.truper_code || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Código de Barras</p>
                    <p className="font-mono font-semibold">{product.barcode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unidad de Medida</p>
                    <p className="font-semibold">{product.unit_of_measure || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Marca</p>
                    <p className="font-semibold">{product.brand || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Línea</p>
                    <p className="font-semibold">{product.line || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Precios */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Precios</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Precio de Compra</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${product.purchase_price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Precio Público</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">${product.retail_price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Precio Mayoreo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">${product.wholesale_price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* {Object.keys(customPrices).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Precios Personalizados</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(customPrices).map(([key, value]) => (
                        <Card key={key}>
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">{key}</p>
                            <p className="text-lg font-bold">${Number(value).toFixed(2)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>

              {/* Características */}
              {Object.keys(characteristics).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Características</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(characteristics).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-muted-foreground mb-1">{key}</p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Información Fiscal */}
              {(product.fiscal_product_key || product.fiscal_tax_type) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Información Fiscal</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {product.fiscal_product_key && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Clave del Producto/Servicio</p>
                          <p className="font-mono font-semibold">{product.fiscal_product_key}</p>
                        </div>
                      )}
                      {product.fiscal_tax_type && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tipo de Impuesto</p>
                          <p className="font-semibold">{product.fiscal_tax_type}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
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
        }
      `}</style>
    </div>
  )
}
