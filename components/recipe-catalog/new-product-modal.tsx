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
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RecipeForm } from "@/lib/types"



interface RecipeFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe?: (RecipeForm & { _id: string }) | null
  onRecipeSaved?: () => void | Promise<void>
  user?: string  // <- agregamos el usuario
}


const initialForm: RecipeForm = {
  nombreReceta: "",
  codigoPadre: "",
  cantidadPadre: "",
  codigoHijo: "",
  cantidadHijo: "",
}

export function RecipeFormModal({ open, onOpenChange, recipe, onRecipeSaved, user }: RecipeFormModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<RecipeForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!recipe

  useEffect(() => {
    if (recipe) {
      setFormData({
        nombreReceta: recipe.nombreReceta,
        codigoPadre: recipe.codigoPadre,
        cantidadPadre: recipe.cantidadPadre,
        codigoHijo: recipe.codigoHijo,
        cantidadHijo: recipe.cantidadHijo,
      })
    } else {
      setFormData(initialForm)
    }
  }, [recipe, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name.includes("codigo") || name.includes("cantidad") ? Number(value) : value }))
  }

  const handleSubmit = async () => {
    if (!formData.nombreReceta) {
      toast.error("El nombre de la receta es obligatorio")
      return
    }
    if (!formData.codigoPadre) {
      toast.error("El código del producto padre es obligatorio")
      return
    }
    if (!formData.cantidadPadre) {
      toast.error("La cantidad del producto padre es obligatoria")
      return
    }
    if (!formData.codigoHijo) {
      toast.error("El código del producto hijo es obligatorio")
      return
    }
    if (!formData.cantidadHijo) {
      toast.error("La cantidad del producto hijo es obligatoria")
      return
    }


    setIsSubmitting(true)
    try {
      // Preparar payload con conversión de números
      const payload = {
        nombreReceta: formData.nombreReceta,
        codigoPadre: Number(formData.codigoPadre),
        cantidadPadre: Number(formData.cantidadPadre),
        codigoHijo: Number(formData.codigoHijo),
        cantidadHijo: Number(formData.cantidadHijo),
        user
      }

      // <-- Aquí logueamos el payload -->
      //console.log("🚀 Payload que se enviará:", payload)

      const url = isEditMode ? `/api/recipes/${recipe?._id}` : "/api/recipes"
      const method = isEditMode ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Error al ${isEditMode ? 'actualizar' : 'crear'} receta`)

      toast.success(`Receta ${isEditMode ? 'actualizada' : 'creada'} correctamente`)
      setFormData(initialForm)
      onOpenChange(false)
      if (onRecipeSaved) await onRecipeSaved()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} receta`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Receta' : 'Nueva Receta'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los campos que desees actualizar'
              : 'Completa los campos para agregar una nueva receta'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nombre de la receta */}
          <div className="space-y-1">
            <Label>Nombre de la Receta *</Label>
            <Input
              name="nombreReceta"
              value={formData.nombreReceta}
              onChange={handleInputChange}
              placeholder="Ej. Llave ajustable con perico"
            />
          </div>

          {/* Producto Padre */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Producto Padre</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input
                  name="codigoPadre"
                  value={formData.codigoPadre}
                  onChange={handleInputChange}
                  placeholder="4352"
                />
              </div>
              <div className="space-y-1">
                <Label>Cantidad *</Label>
                <Input
                  name="cantidadPadre"
                  type="number"
                  value={formData.cantidadPadre}
                  onChange={handleInputChange}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Producto Hijo */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Producto Hijo</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input
                  name="codigoHijo"
                  value={formData.codigoHijo}
                  onChange={handleInputChange}
                  placeholder="1234"
                />
              </div>
              <div className="space-y-1">
                <Label>Cantidad *</Label>
                <Input
                  name="cantidadHijo"
                  type="number"
                  value={formData.cantidadHijo}
                  onChange={handleInputChange}
                  placeholder="2"
                />
              </div>
            </div>
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
              isEditMode ? 'Actualizar Receta' : 'Crear Receta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
