"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"
import type { Product, CustomPrice } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, ArrowLeft, Upload, ImageIcon } from "lucide-react"

interface ProductFormProps {
  product?: Product | null
}

interface CustomPriceForm {
  price_name: string
  price_value: string
}

interface CharacteristicForm {
  key: string
  value: string
}

interface FiscalOption {
  value: string
  label: string
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<CustomPriceForm[]>([])
  const [existingCustomPrices, setExistingCustomPrices] = useState<CustomPrice[]>([])
  const [characteristics, setCharacteristics] = useState<CharacteristicForm[]>([])
  const [fiscalProductKeys, setFiscalProductKeys] = useState<FiscalOption[]>([])
  const [fiscalTaxTypes, setFiscalTaxTypes] = useState<FiscalOption[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [formData, setFormData] = useState(() => ({
    // Información básica
    codigo: product?.codigo ?? "",
    clave: product?.clave ?? "",
    descripcion: product?.descripcion ?? "",
    margenDeMercado: product?.margenDeMercado ?? "",
    caja: product?.caja ?? "",
    master: product?.master ?? "",
    precio: product?.precio ?? "",
    unidad: product?.unidad ?? "",
    ean: product?.ean ?? "",
    precioMinimoDeVenta: product?.precioMinimoDeVenta ?? "",
    altaRotacion: product?.altaRotacion ?? "",

    // Precios con IVA
    precioMayoreoConIVA: product?.precioMayoreoConIVA ?? "",
    precioDistribuidorConIVA: product?.precioDistribuidorConIVA ?? "",
    precioPublicoConIVA: product?.precioPublicoConIVA ?? "",

    // Precios sin IVA
    precioMayoreoSinIVA: product?.precioMayoreoSinIVA ?? "",
    precioDistribuidorSinIVA: product?.precioDistribuidorSinIVA ?? "",
    precioPublicoSinIVA: product?.precioPublicoSinIVA ?? "",

    // Marca y medias
    marca: product?.marca ?? "",
    precioMedioMayoreoSinIVA: product?.precioMedioMayoreoSinIVA ?? "",
    precioMedioMayoreoConIVA: product?.precioMedioMayoreoConIVA ?? "",

    // Información SAT
    codigoSAT: product?.codigoSAT ?? "",
    descripcionSAT: product?.descripcionSAT ?? "",

    // Familia
    familia: product?.familia ?? "",
    descripcionFamilia: product?.descripcionFamilia ?? "",

    // Peso y volumen
    pesoKg: product?.pesoKg ?? "",
    volumenCm3: product?.volumenCm3 ?? "",

    // Imagen opcional
    image_url: product?.image_url ?? "",
  }));

  useEffect(() => {
    console.log("🟢 Producto recibido en ProductForm:", product)
  }, [product])


  // const supabase = createClient()
  {/*useEffect(() => {
    loadFiscalData()

    if (product) {
      if (product.image_url) setImagePreview(product.image_url)
      loadCustomPrices(product._id)
    }
  }, [product])*/}

  const loadFiscalData = async () => {
    try {
      const [productKeysRes, taxTypesRes] = await Promise.all([
        fetch("/data/fiscal-product-keys.json"),
        fetch("/data/fiscal-tax-types.json"),
      ])

      const productKeys = await productKeysRes.json()
      const taxTypes = await taxTypesRes.json()

      setFiscalProductKeys(productKeys)
      setFiscalTaxTypes(taxTypes)
    } catch (err) {
      console.error("Error loading fiscal data:", err)
    }
  }

  const loadCustomPrices = async (productId: string) => {
    // const { data } = await supabase.from("custom_prices").select("*").eq("product_id", productId)

    // if (data) {
    //   setExistingCustomPrices(data)
    // }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", imageFile)
      if (product?._id) {
        formData.append("oldUrl", (product as any).image_url || "")
      }

      const response = await fetch("/api/products/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir la imagen")

      const data = await response.json()
      return data.url
    } catch (err) {
      console.error("Error uploading image:", err)
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, image_url: "" })
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // --- Subir imagen si hay ---
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      // --- Preparar datos del producto ---
      const productData = {
        // Información básica
        codigo: formData.codigo !== "" ? Number(formData.codigo) : null,
        clave: formData.clave !== "" ? formData.clave : null,
        descripcion: formData.descripcion !== "" ? formData.descripcion : null,
        margenDeMercado: formData.margenDeMercado !== "" ? formData.margenDeMercado : null,
        caja: formData.caja !== "" ? Number(formData.caja) : null,
        master: formData.master !== "" ? Number(formData.master) : null,
        precio: formData.precio !== "" ? Number(formData.precio) : null,
        unidad: formData.unidad !== "" ? formData.unidad : null,
        ean: formData.ean !== "" ? formData.ean : null,
        precioMinimoDeVenta: formData.precioMinimoDeVenta !== "" ? Number(formData.precioMinimoDeVenta) : null,
        altaRotacion: formData.altaRotacion !== "" ? Number(formData.altaRotacion) : null,

        // Precios con IVA
        precioMayoreoConIVA: formData.precioMayoreoConIVA !== "" ? Number(formData.precioMayoreoConIVA) : null,
        precioDistribuidorConIVA: formData.precioDistribuidorConIVA !== "" ? Number(formData.precioDistribuidorConIVA) : null,
        precioPublicoConIVA: formData.precioPublicoConIVA !== "" ? Number(formData.precioPublicoConIVA) : null,

        // Precios sin IVA
        precioMayoreoSinIVA: formData.precioMayoreoSinIVA !== "" ? Number(formData.precioMayoreoSinIVA) : null,
        precioDistribuidorSinIVA: formData.precioDistribuidorSinIVA !== "" ? Number(formData.precioDistribuidorSinIVA) : null,
        precioPublicoSinIVA: formData.precioPublicoSinIVA !== "" ? Number(formData.precioPublicoSinIVA) : null,

        // Marca y medias
        marca: formData.marca !== "" ? formData.marca : null,
        precioMedioMayoreoSinIVA: formData.precioMedioMayoreoSinIVA !== "" ? Number(formData.precioMedioMayoreoSinIVA) : null,
        precioMedioMayoreoConIVA: formData.precioMedioMayoreoConIVA !== "" ? Number(formData.precioMedioMayoreoConIVA) : null,

        // Información SAT
        codigoSAT: formData.codigoSAT !== "" ? formData.codigoSAT : null,
        descripcionSAT: formData.descripcionSAT !== "" ? formData.descripcionSAT : null,

        // Familia
        familia: formData.familia !== "" ? formData.familia : null,
        descripcionFamilia: formData.descripcionFamilia !== "" ? formData.descripcionFamilia : null,

        // Peso y volumen
        pesoKg: formData.pesoKg !== "" ? Number(formData.pesoKg) : null,
        volumenCm3: formData.volumenCm3 !== "" ? Number(formData.volumenCm3) : null,

        // Imagen opcional
        image_url: imageUrl !== "" ? imageUrl : null,

        // Precios personalizados
        customPrices: customPrices
          .filter((cp) => cp.price_name !== "" && cp.price_value !== "")
          .map((cp) => ({
            price_name: cp.price_name,
            price_value: Number(cp.price_value),
          })),
      }


      // --- Guardar producto en MongoDB ---
      let response
      if (product?._id) {
        // Actualizar producto existente
        response = await fetch(`/api/products/${product._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })
      } else {
        // Crear producto nuevo
        response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })
      }

      if (!response.ok) throw new Error("Error al guardar el producto")

      router.push("/admin/products")
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

  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { key: "", value: "" }])
  }

  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Básicos</CardTitle>
            <CardDescription>Información general del producto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 -6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Label htmlFor="image" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{imagePreview ? "Cambiar imagen" : "Subir imagen"}</span>
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">Formatos: JPG, PNG, WEBP. Tamaño máximo: 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="truper_code">Código Truper</Label>
                <Input
                  id="truper_code"
                  type="number"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clave">Clave</Label>
                <Input
                  id="clave"
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras (EAN)</Label>
                <Input
                  id="barcode"
                  value={formData.ean}
                  onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre / Descripción *</Label>
              <Input
                id="name"
                required
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unidad de Medida *</Label>
                <Input
                  id="unit_of_measure"
                  required
                  placeholder="ej: Pieza, Caja, Metro"
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margen_mercado">Margen de Mercado</Label>
                <Input
                  id="margen_mercado"
                  value={formData.margenDeMercado}
                  onChange={(e) => setFormData({ ...formData, margenDeMercado: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="line">Familia / Línea</Label>
                <Input
                  id="line"
                  placeholder="ej: Herramientas Eléctricas, Plomería"
                  value={formData.familia}
                  onChange={(e) => setFormData({ ...formData, familia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion_familia">Descripción Familia</Label>
                <Input
                  id="descripcion_familia"
                  value={formData.descripcionFamilia}
                  onChange={(e) => setFormData({ ...formData, descripcionFamilia: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caja">Caja</Label>
                <Input
                  id="caja"
                  type="number"
                  min="0"
                  value={formData.caja}
                  onChange={(e) => setFormData({ ...formData, caja: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="master">Master</Label>
                <Input
                  id="master"
                  type="number"
                  min="0"
                  value={formData.master}
                  onChange={(e) => setFormData({ ...formData, master: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (Kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pesoKg}
                  onChange={(e) => setFormData({ ...formData, pesoKg: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumen">Volumen (cm³)</Label>
                <Input
                  id="volumen"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.volumenCm3}
                  onChange={(e) => setFormData({ ...formData, volumenCm3: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio_minimo">Precio Mínimo de Venta</Label>
                <Input
                  id="precio_minimo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioMinimoDeVenta}
                  onChange={(e) => setFormData({ ...formData, precioMinimoDeVenta: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alta_rotacion">Alta Rotación</Label>
                <Input
                  id="alta_rotacion"
                  type="number"
                  min="0"
                  value={formData.altaRotacion}
                  onChange={(e) => setFormData({ ...formData, altaRotacion: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Precios */}
        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
            <CardDescription>Precios estándar y personalizados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio Base</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Precios Con IVA</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mayoreo_con_iva">Mayoreo Con IVA</Label>
                  <Input
                    id="mayoreo_con_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioMayoreoConIVA}
                    onChange={(e) => setFormData({ ...formData, precioMayoreoConIVA: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distribuidor_con_iva">Distribuidor Con IVA</Label>
                  <Input
                    id="distribuidor_con_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioDistribuidorConIVA}
                    onChange={(e) => setFormData({ ...formData, precioDistribuidorConIVA: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publico_con_iva">Público Con IVA</Label>
                  <Input
                    id="publico_con_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioPublicoConIVA}
                    onChange={(e) => setFormData({ ...formData, precioPublicoConIVA: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Precios Sin IVA</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mayoreo_sin_iva">Mayoreo Sin IVA</Label>
                  <Input
                    id="mayoreo_sin_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioMayoreoSinIVA}
                    onChange={(e) => setFormData({ ...formData, precioMayoreoSinIVA: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distribuidor_sin_iva">Distribuidor Sin IVA</Label>
                  <Input
                    id="distribuidor_sin_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioDistribuidorSinIVA}
                    onChange={(e) => setFormData({ ...formData, precioDistribuidorSinIVA: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publico_sin_iva">Público Sin IVA</Label>
                  <Input
                    id="publico_sin_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioPublicoSinIVA}
                    onChange={(e) => setFormData({ ...formData, precioPublicoSinIVA: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Precios Medios de Mayoreo</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medio_mayoreo_sin_iva">Medio Mayoreo Sin IVA</Label>
                  <Input
                    id="medio_mayoreo_sin_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioMedioMayoreoSinIVA}
                    onChange={(e) => setFormData({ ...formData, precioMedioMayoreoSinIVA: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medio_mayoreo_con_iva">Medio Mayoreo Con IVA</Label>
                  <Input
                    id="medio_mayoreo_con_iva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioMedioMayoreoConIVA}
                    onChange={(e) => setFormData({ ...formData, precioMedioMayoreoConIVA: Number(e.target.value) })}
                  />
                </div>
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
          </CardContent>
        </Card>



        {/* Información Fiscal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Fiscal</CardTitle>
            <CardDescription>Datos fiscales para facturación electrónica (SAT)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoSAT">Clave del Producto o Servicio (SAT)</Label>
                <Input
                  id="codigoSAT"
                  placeholder="Ingresa la clave SAT"
                  value={formData.codigoSAT}
                  onChange={(e) => setFormData({ ...formData, codigoSAT: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcionSAT">Descripción SAT</Label>
                <Input
                  id="descripcionSAT"
                  placeholder="Ingresa la descripción o tipo de impuesto"
                  value={formData.descripcionSAT}
                  onChange={(e) => setFormData({ ...formData, descripcionSAT: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>


        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isUploadingImage}>
            {isLoading || isUploadingImage ? "Guardando..." : "Guardar Producto"}
          </Button>
        </div>
      </form>
    </div>
  )
}