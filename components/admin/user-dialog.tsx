"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { AllowedRole, Branch, ProfileWithBranches } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { updateUser } from "@/app/actions/users/update-user"
import { createUser } from "@/app/actions/users/create-user"
import { PasswordInput } from "../ui/password-input"
import { z } from "zod" 

const userSchema = z.object({
  username: z.string()
    .min(2, "El nombre de usuario debe tener al menos 2 caracteres.")
    .max(200, "El nombre de usuario no puede exceder los 200 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no debe contener espacios"),
  full_name: z.string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(300, "El nombre completo no puede exceder los 300 caracteres.")
    .or(z.literal(""))
    .optional(),
  role: z.enum(["admin", "branch_manager", "cashier"], {
    errorMap: () => ({ message: "Por favor, selecciona un rol válido." }),
  }),
  branch_id: z.string().optional(),
  assignedBranches: z.array(z.string()).default([]),
})

// Esquema para crear un usuario (la contraseña es requerida)
const createUserSchema = userSchema.extend({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(/\d/, "La contraseña debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "La contraseña debe contener al menos un carácter especial")
    .regex(/^\S+$/, "La contraseña no debe contener espacios")
    .max(20,"La contraseña debe tener máximo 20 caracteres"),
})

// Para la actualización, si la contraseña está vacía, no la validamos. Si no está vacía, aplicamos las reglas.
const updateUserSchema = userSchema.extend({
  password: z.string().optional().refine((pass) => {
      // Si el campo de contraseña está vacío o no se proporciona, es válido.
      if (!pass) return true;
      // Si hay algo escrito, debe cumplir con las reglas.
      return createUserSchema.shape.password.safeParse(pass).success;
    }, {
      // Mensaje de error personalizado si la validación del refine falla
      message: "La contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo)."
    })
})

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ProfileWithBranches | null
  branches: Branch[]
  onSuccess: () => void
}

export function UserDialog({ open, onOpenChange, user, branches, onSuccess }: UserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({})

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "cashier" as AllowedRole,
    branch_id: "none",
    assignedBranches: [] as string[], // Added array to track multiple branch assignments
  })

  useEffect(() => {
    const loadUserBranches = async () => {
      setError(null)
      setFormErrors({})
      if (user) {
        setFormData({
          username: user.username,
          password: "",
          full_name: user.full_name || "",
          role: user.role,
          branch_id: user.branch_id || "none",
          assignedBranches: user.assignedBranches || [],
        })
      } else {
        setFormData({
          username: "",
          password: "",
          full_name: "",
          role: "cashier",
          branch_id: "none",
          assignedBranches: [],
        })
      }
    }

    if (open) {
      loadUserBranches()
    }
  }, [user, open])

  const toggleBranch = (branchId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedBranches: prev.assignedBranches.includes(branchId)
        ? prev.assignedBranches.filter((id) => id !== branchId)
        : [...prev.assignedBranches, branchId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFormErrors({}) 

    const schemaToUse = user ? updateUserSchema : createUserSchema
    const validationResult = schemaToUse.safeParse(formData)

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      setFormErrors({
        username: errors.username?.[0],
        password: errors.password?.[0],
        full_name: errors.full_name?.[0],
        role: errors.role?.[0],
      })
      setIsLoading(false)
      return 
    }

    try {
       const validatedData = validationResult.data;
      if (user) {
        if (!validatedData.password) {
          delete validatedData.password
        }
        // Update existing user profile
        const result = await updateUser(user.id, validatedData)
        if (result.error){
          setError(result.error)
          setIsLoading(false) 
          return
        } 
        
      } else {
        // Create new user
        const result  = await createUser(validatedData)
        if (result.error){
          setError(result.error)
          setIsLoading(false) 
          return
        }
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el usuario")
    } finally {
      setIsLoading(false) 
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof typeof formData) => (value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {user ? "Modifica los datos del usuario" : "Crea un nuevo usuario en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario *</Label>
              <Input
                id="username"
                type="text"
                required
                disabled={!!user}
                value={formData.username}
                onChange={handleInputChange}
              />
              {formErrors.username && <p className="text-sm text-destructive">{formErrors.username}</p>}
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <p className="mt-1 text-sm text-muted-foreground">
                    La contraseña debe contener una letra mayúscula, una minúscula, un caracter especial, un número y al menos 8 caracteres.
                  </p>
                {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
              {formErrors.full_name && <p className="text-sm text-destructive">{formErrors.full_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={formData.role} onValueChange={handleSelectChange('role')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="branch_manager">Gerente de Sucursal</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-sm text-destructive">{formErrors.role}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_id">Sucursal Principal</Label>
              <Select
                value={formData.branch_id}
                onValueChange={handleSelectChange('branch_id')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Sucursal predeterminada del usuario</p>
            </div>

            <div className="space-y-2">
              <Label>Sucursales Asignadas</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`branch-${branch.id}`}
                      checked={formData.assignedBranches.includes(branch.id)}
                      onCheckedChange={() => toggleBranch(branch.id)}
                    />
                    <label
                      htmlFor={`branch-${branch.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {branch.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona todas las sucursales a las que el usuario tendrá acceso
              </p>
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
