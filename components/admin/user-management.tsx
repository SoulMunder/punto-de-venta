"use client"

import { useState, useEffect } from "react"
import type { Branch, Profile, ProfileWithBranches } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UserDialog } from "./user-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getUsers } from "@/app/actions/users/get-users"
import { deleteUser } from "@/app/actions/users/delete-user"

interface UserManagementProps {
  branches: Branch[]
  error: string | null
}

export function UserManagement({ branches }: UserManagementProps) {
  const [users, setUsers] = useState<ProfileWithBranches[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)

    const { data: profilesData, error: profilesError } = await getUsers()

    if (profilesError || !profilesData) {
      console.error("Error al cargar usuarios:", profilesError)
      setIsLoading(false)
      return
    }

    setUsers(profilesData)
    setIsLoading(false)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Administrador</Badge>
      case "branch_manager":
        return <Badge variant="secondary">Gerente de Sucursal</Badge>
      case "cashier":
        return <Badge>Cajero</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return "-"
    return branches.find((b) => b.id === branchId)?.name || "Desconocida"
  }

  const getAssignedBranchNames = (branchIds: string[] | undefined) => {
    if (!branchIds || branchIds.length === 0) return "-"
    return branchIds
      .map((id) => branches.find((b) => b.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteUser(userToDelete.id)
      if (result.error){
          alert(result.error)
          return
      }
      await loadUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error al eliminar el usuario")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            setEditingUser(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay usuarios registrados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-base truncate">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.full_name || "-"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingUser(user)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUserToDelete(user)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sucursal Principal:</span>
                    <span className="text-xs">{getBranchName(user.branch_id)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Sucursales Asignadas:</span>
                    <p className="text-xs mt-1">{getAssignedBranchNames(user.assignedBranches)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        branches={branches}
        onSuccess={loadUsers}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <span className="font-semibold">{userToDelete?.username}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
