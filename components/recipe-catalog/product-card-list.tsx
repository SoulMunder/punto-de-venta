"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Loader2, Pencil, Trash2, Package, ArrowDown, Box } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

import { DataTablePagination } from "../inventory/data-table-pagination"
import { RecipeFormModal } from "./new-product-modal"
import { Recipe } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"


export function RecipeCardList() {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUser = session?.user.username || "Desconocido"
  //console.log("Usuario actual:", currentUser)

  // Estados
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const offset = (currentPage - 1) * entriesPerPage

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para el modal de aplicar receta
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [recipeToApply, setRecipeToApply] = useState<Recipe | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  // ✅ Fetch de recetas
  const fetchRecipes = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/recipes?searchTerm=${encodeURIComponent(searchTerm)}&limit=${entriesPerPage}&offset=${offset}`,
        { signal }
      )
      if (!res.ok) throw new Error("Error cargando recetas")

      const data = await res.json()
      setRecipes(data.data)
      setTotalRecipes(data.total)
    } catch (err: any) {
      if (err.name === "AbortError") return
      console.error(err)
      setRecipes([])
      setTotalRecipes(0)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [searchTerm, entriesPerPage, offset])

  // Cargar recetas al montar y cuando cambien dependencias
  useEffect(() => {
    const controller = new AbortController()
    fetchRecipes(controller.signal)
    return () => controller.abort()
  }, [fetchRecipes])

  // ✏️ Editar receta
  const handleEdit = (recipe: Recipe) => {
    setRecipeToEdit(recipe)
    setFormModalOpen(true)
  }

  // ➕ Nueva receta
  const handleNewRecipe = () => {
    setRecipeToEdit(null)
    setFormModalOpen(true)
  }

  // 🗑️ Eliminar receta
  const handleDelete = async () => {
    if (!recipeToDelete?._id) return

    try {
      setIsDeleting(true)
      const res = await fetch(`/api/recipes/${recipeToDelete._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser }) // <-- enviar usuario
      })

      const data = await res.json()
      if (!res.ok) {
        console.error("Error del servidor:", data)
        throw new Error(data.error || "No se pudo eliminar la receta")
      }

      toast.success("Receta eliminada correctamente")
      setDeleteDialogOpen(false)
      setRecipeToDelete(null)
      await fetchRecipes()
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Ocurrió un error al eliminar la receta")
    } finally {
      setIsDeleting(false)
    }
  }


  // 🔄 Aplicar receta
  const handleApplyRecipe = async () => {
    if (!recipeToApply?._id) return

    console.log("🚀 Aplicando receta:", {
      id: recipeToApply._id,
      nombre: recipeToApply.nombreReceta,
      codigoPadre: recipeToApply.codigoPadre,
      cantidadPadre: recipeToApply.cantidadPadre,
      codigoHijo: recipeToApply.codigoHijo,
      cantidadHijo: recipeToApply.cantidadHijo,
    })

    try {
      setIsApplying(true)
      const res = await fetch(`/api/recipes/${recipeToApply._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser }) // <- enviamos el user
      })


      const data = await res.json()
      if (!res.ok) {
        console.error("Error del servidor:", data)
        throw new Error(data.error || "No se pudo aplicar la receta")
      }

      toast.success(`Receta "${recipeToApply.nombreReceta}" aplicada correctamente`)
      setApplyDialogOpen(false)
      setRecipeToApply(null)
      await fetchRecipes()
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Ocurrió un error al aplicar la receta")
    } finally {
      setIsApplying(false)
    }
  }


  // 🔄 Callback para refrescar lista después de crear o editar
  const handleRecipeSaved = async () => {
    await fetchRecipes()
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Buscador y botón nuevo */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm w-full"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleNewRecipe}
            className="h-9 px-3 gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Receta</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: entriesPerPage }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <div className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))
          : recipes.map((recipe) => (
            <Card
              key={recipe._id}
              className="group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                      {recipe.nombreReceta}
                    </h3>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4 space-y-4">
                {/* Sección Producto Padre */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Producto Padre
                      </span>
                    </div>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Código:</span> {recipe.codigoPadre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Cantidad:</span> {recipe.cantidadPadre} unidades
                    </p>
                  </div>
                </div>

                {/* Sección Producto Hijo */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Producto Hijo
                      </span>
                    </div>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Código:</span> {recipe.codigoHijo}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Cantidad:</span> {recipe.cantidadHijo} unidades
                    </p>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="pt-2">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Receta ID: {recipe._id.substring(0, 8)}...</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="space-y-2 w-full">
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 group hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-colors"
                      onClick={() => handleEdit(recipe)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 group hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
                      onClick={() => {
                        setRecipeToDelete(recipe);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Eliminar
                    </Button>
                  </div>

                  {/* Botón Aplicar Receta */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 group cursor-pointer bg-purple-500/15 text-purple-700 hover:text-purple-800 hover:bg-purple-500/25 transition-colors w-full"
                    onClick={() => {
                      setRecipeToApply(recipe);
                      setApplyDialogOpen(true);
                    }}
                  >
                    <Package className="h-3.5 w-3.5 mr-2" />
                    Aplicar receta
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
      </div>

      {/* Paginación */}
      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalCount={totalRecipes}
        onPageChange={setCurrentPage}
        onPageSizeChange={setEntriesPerPage}
      />

      <RecipeFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        recipe={recipeToEdit}
        onRecipeSaved={handleRecipeSaved}
        user={currentUser} // <- aquí pasas el usuario
      />


      {/* Dialog Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar receta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la receta{" "}
              <span className="font-semibold">{recipeToDelete?.nombreReceta}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Aplicar Receta */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              ¿Aplicar receta?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4">
                <div>
                  Estás a punto de aplicar la receta{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {recipeToApply?.nombreReceta}
                  </span>
                </div>

                {recipeToApply && (
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Se descontará:
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Código:</span> {recipeToApply.codigoPadre}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Cantidad:</span> -{recipeToApply.cantidadPadre} unidades
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <ArrowDown className="h-5 w-5 text-purple-600" />
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Se agregará:
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Código:</span> {recipeToApply.codigoHijo}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Cantidad:</span> +{recipeToApply.cantidadHijo} unidades
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button
              className=""
              onClick={handleApplyRecipe}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}