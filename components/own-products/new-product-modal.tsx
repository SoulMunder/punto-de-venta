"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { OwnProduct, OwnProductForm } from "@/lib/types"

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: OwnProduct | null
  onProductSaved?: () => void | Promise<void>
}

const initialForm: OwnProductForm = {
  codigo: undefined,
  clave: "",
  descripcion: "",
  precio: "",
  unidad: "",
  marca: "",
  codigoSAT: "",
  descripcionSAT: "",
  familia: "",
  descripcionFamilia: "",
  imageFile: null,
}

export function ProductFormModal({ open, onOpenChange, product, onProductSaved }: ProductFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<OwnProductForm>(initialForm)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageChanged, setImageChanged] = useState(false) // ✅ Nuevo flag

  const isEditMode = !!product

  useEffect(() => {
    if (product) {
      setFormData(prev => ({
        codigo: product.codigo ?? undefined,
        clave: product.clave ?? "",
        descripcion: product.descripcion,
        precio: product.precio.toString(),
        unidad: product.unidad ?? "",
        marca: product.marca ?? "",
        codigoSAT: product.codigoSAT ?? "",
        descripcionSAT: product.descripcionSAT ?? "",
        familia: product.familia ?? "",
        descripcionFamilia: product.descripcionFamilia ?? "",
        imageFile: null,
      }))
      setImagePreview(product.imageUrl ?? null)
      setImageChanged(false) // ✅ Reset al abrir modal
    } else {
      setFormData(initialForm)
      setImagePreview(null)
      setImageChanged(false) // ✅ Reset al abrir modal
    }
  }, [product, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "codigo") {
      const numValue = Number(value)
      if (numValue > 9999) {
        toast.error("El código no puede tener más de 4 dígitos")
        return
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, sube un archivo de imagen válido")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData(prev => ({ ...prev, imageFile: base64String }))
        setImageChanged(true) // ✅ Marcar como cambiado
        toast.success("Imagen cargada correctamente")
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null }))
    setImagePreview(null)
    setImageChanged(true) // ✅ Marcar como cambiado
  }

  const handleSubmit = async () => {
    if (!formData.descripcion) {
      toast.error("La descripción es obligatoria")
      return
    }
    if (!formData.precio) {
      toast.error("El precio es obligatorio")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        codigo: formData.codigo,
        clave: formData.clave,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        unidad: formData.unidad,
        marca: formData.marca,
        codigoSAT: formData.codigoSAT,
        descripcionSAT: formData.descripcionSAT,
        familia: formData.familia,
        descripcionFamilia: formData.descripcionFamilia,
      }

      // ✅ Solo incluir imageFile si el usuario la modificó
      if (imageChanged) {
        payload.imageFile = formData.imageFile
      }

      const url = isEditMode
        ? `/api/own-products/${product!._id}`
        : "/api/own-products"

      const method = isEditMode ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Error al ${isEditMode ? 'actualizar' : 'crear'} producto`)

      toast.success(`Producto ${isEditMode ? 'actualizado' : 'creado'} correctamente`)
      
      setFormData(initialForm)
      setImagePreview(null)
      setImageChanged(false) // ✅ Reset
      onOpenChange(false)
      
      if (onProductSaved) await onProductSaved()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} producto`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los campos que desees actualizar'
              : 'Completa los campos para agregar un nuevo producto'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen del Producto (Opcional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${imagePreview ? "border-primary" : "border-muted-foreground/25"
                }`}
              onClick={handleImageUpload}
            >
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-contain p-2 bg-white"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Haz clic para subir una imagen</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG o WEBP (máx. 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descripción y Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Descripción *</Label>
              <Input
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Llave ajustable (perico) 15' profesional cromada, Expert"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio *</Label>
              <Input
                name="precio"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={handleInputChange}
                placeholder="825"
              />
            </div>
          </div>

          {/* Otros campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Código", name: "codigo", type: "number" },
              { label: "Clave", name: "clave" },
              { label: "Unidad", name: "unidad" },
              { label: "Marca", name: "marca" },
              { label: "Código SAT", name: "codigoSAT" },
              { label: "Descripción SAT", name: "descripcionSAT" },
              { label: "Familia", name: "familia" },
              { label: "Descripción Familia", name: "descripcionFamilia" },
            ].map((field) => (
              <div className="space-y-1" key={field.name}>
                <Label>{field.label}</Label>
                <Input
                  name={field.name}
                  type={field.type ?? "text"}
                  value={(formData as any)[field.name] ?? ""}
                  onChange={handleInputChange}
                  placeholder={field.label}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isEditMode ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              isEditMode ? 'Actualizar Producto' : 'Crear Producto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
