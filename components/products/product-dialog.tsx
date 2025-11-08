"use client"

import type React from "react"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import type { Product, CustomPrice } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

interface CustomPriceForm {
  price_name: string
  price_value: string
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<CustomPriceForm[]>([])
  const [existingCustomPrices, setExistingCustomPrices] = useState<CustomPrice[]>([])

  const [formData, setFormData] = useState({
    truper_code: "",
    barcode: "",
    name: "",
    unit_of_measure: "",
    brand: "",
    purchase_price: "",
    retail_price: "",
    wholesale_price: "",
  })

  // const supabase = createClient()

  useEffect(() => {
    if (product) {
      setFormData({
        truper_code: product.truper_code || "",
        barcode: product.barcode || "",
        name: product.name,
        unit_of_measure: product.unit_of_measure,
        brand: product.brand || "",
        purchase_price: product.purchase_price.toString(),
        retail_price: product.retail_price.toString(),
        wholesale_price: product.wholesale_price.toString(),
      })
      loadCustomPrices(product.id)
    } else {
      setFormData({
        truper_code: "",
        barcode: "",
        name: "",
        unit_of_measure: "",
        brand: "",
        purchase_price: "",
        retail_price: "",
        wholesale_price: "",
      })
      setCustomPrices([])
      setExistingCustomPrices([])
    }
  }, [product, open])

  const loadCustomPrices = async (productId: string) => {
    // const { data } = await supabase.from("custom_prices").select("*").eq("product_id", productId)

    // if (data) {
    //   setExistingCustomPrices(data)
    // }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const productData = {
        truper_code: formData.truper_code || null,
        barcode: formData.barcode || null,
        name: formData.name,
        unit_of_measure: formData.unit_of_measure,
        brand: formData.brand || null,
        purchase_price: Number.parseFloat(formData.purchase_price) || 0,
        retail_price: Number.parseFloat(formData.retail_price) || 0,
        wholesale_price: Number.parseFloat(formData.wholesale_price) || 0,
      }

      let productId: string

      if (product) {
        // Update existing product
        // const { error: updateError } = await supabase.from("products").update(productData).eq("id", product.id)

        // if (updateError) throw updateError
        // productId = product.id
      } else {
        // Create new product
        // const { data: newProduct, error: insertError } = await supabase
        //   .from("products")
        //   .insert(productData)
        //   .select()
        //   .single()

        // if (insertError) throw insertError
        // productId = newProduct.id
      }

      // Handle custom prices
      const validCustomPrices = customPrices.filter((cp) => cp.price_name && cp.price_value)

      // for (const cp of validCustomPrices) {
      //   await supabase.from("custom_prices").insert({
      //     product_id: productId,
      //     price_name: cp.price_name,
      //     price_value: Number.parseFloat(cp.price_value),
      //   })
      // }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  const addCustomPrice = () => {
    setCustomPrices([...customPrices, { price_name: "", price_value: "" }])
  }

  const removeCustomPrice = (index: number) => {
    setCustomPrices(customPrices.filter((_, i) => i !== index))
  }

  const deleteExistingCustomPrice = async (priceId: string) => {
    // await supabase.from("custom_prices").delete().eq("id", priceId)
    // setExistingCustomPrices(existingCustomPrices.filter((p) => p.id !== priceId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifica los datos del producto" : "Ingresa los datos del nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truper_code">Código Truper</Label>
                  <Input
                    id="truper_code"
                    value={formData.truper_code}
                    onChange={(e) => setFormData({ ...formData, truper_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unidad de Medida *</Label>
                  <Input
                    id="unit_of_measure"
                    required
                    placeholder="ej: Pieza, Caja, Metro"
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prices" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Precio de Compra</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retail_price">Precio Público</Label>
                  <Input
                    id="retail_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesale_price">Precio Mayoreo</Label>
                  <Input
                    id="wholesale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.wholesale_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesale_price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Precios Personalizados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomPrice}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {existingCustomPrices.map((cp) => (
                  <div key={cp.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input value={cp.price_name} disabled />
                    </div>
                    <div className="flex-1">
                      <Input value={cp.price_value} disabled />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => deleteExistingCustomPrice(cp.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {customPrices.map((cp, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Nombre del precio"
                        value={cp.price_name}
                        onChange={(e) => {
                          const updated = [...customPrices]
                          updated[index].price_name = e.target.value
                          setCustomPrices(updated)
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={cp.price_value}
                        onChange={(e) => {
                          const updated = [...customPrices]
                          updated[index].price_value = e.target.value
                          setCustomPrices(updated)
                        }}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomPrice(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mt-4">{error}</p>}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
