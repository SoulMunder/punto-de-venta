"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Customer } from "@/lib/types"
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
import { Textarea } from "@/components/ui/textarea"
import { createCustomer } from "@/app/actions/customers/create-customer"
import { updateCustomer } from "@/app/actions/customers/update-customer"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(300, "El nombre no puede exceder los 300 caracteres."),
  phone: z.string()
    .min(7, "El teléfono debe tener al menos 7 caracteres.")
    .max(22, "El teléfono no puede exceder los 22 caracteres.")
    .regex(/^[0-9+\-\s()]*$/, "El teléfono solo debe contener números, espacios, paréntesis, guiones o el signo +.")
    .optional().or(z.literal("")),
  address: z.string()
    .max(800, "La dirección no puede exceder los 800 caracteres.")
    .optional().or(z.literal("")),
})

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSuccess: () => void
}

export function CustomerDialog({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({})

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
      })
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFormErrors({}) 

    const validationResult = customerSchema.safeParse(formData)

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      setFormErrors({
        name: errors.name?.[0],
        phone: errors.phone?.[0],
        address: errors.address?.[0],
      })
      setIsLoading(false)
      return 
    }

    try {
      const validatedData = validationResult.data;

      if (customer) {
        // Update existing customer
        const result = await updateCustomer(customer.id, validatedData)
        if (result.error){
          setError(result.error)
          setIsLoading(false) 
          return
        } 
      } else {
        // Create new customer
        const result  = await createCustomer(validatedData)
        if (result.error){
          setError(result.error)
          setIsLoading(false) 
          return
        }
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el cliente")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {customer ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
            </div>
          </div>

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
