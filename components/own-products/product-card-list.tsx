"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Package, Eye, Loader2 } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { OwnProduct } from "@/lib/types"
import { useToast } from "../ui/use-toast"
import { DataTablePagination } from "../inventory/data-table-pagination"
import { OwnProductDetailsModal } from "./product-details-modal"
import { ProductFormModal } from "./new-product-modal"

export function ProductCardList() {
  const router = useRouter()
  const [products, setProducts] = useState<OwnProduct[]>([])
  const [Loading, setLoading] = useState(true)

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const offset = (currentPage - 1) * entriesPerPage

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<OwnProduct | null>(null)
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<OwnProduct | null>(null)
  
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<OwnProduct | null>(null)

  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  // ✅ Función de fetch reutilizable con useCallback
  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/own-products?searchTerm=${encodeURIComponent(searchTerm)}&limit=${entriesPerPage}&offset=${offset}`,
        { signal },
      )
      if (!res.ok) throw new Error("Error cargando productos")

      const data = await res.json()
      setProducts(data.products)
      setTotalProducts(data.total)
    } catch (err: any) {
      if (err.name === "AbortError") return
      console.error(err)
      setProducts([])
      setTotalProducts(0)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [searchTerm, entriesPerPage, offset])

  // Cargar productos al montar y cuando cambien las dependencias
  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  const handleDelete = async () => {
    if (!productToDelete?._id) return

    try {
      setIsDeleting(true)

      const res = await fetch(`/api/own-products/${productToDelete._id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error("❌ Error al eliminar producto:", errorData)
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar el producto.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Producto eliminado",
        description: "El producto fue eliminado correctamente.",
      })

      setDeleteDialogOpen(false)
      setProductToDelete(null)

      // ✅ Volver a cargar la lista después de eliminar
      await fetchProducts()
      router.refresh()
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el producto.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetails = (product: OwnProduct) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
  }

  const handleEdit = (product: OwnProduct) => {
    setProductToEdit(product)
    setFormModalOpen(true)
  }

  const handleNewProduct = () => {
    setProductToEdit(null)
    setFormModalOpen(true)
  }

  // ✅ Callback para cuando se crea o edita un producto
  const handleProductSaved = async () => {
    await fetchProducts()
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Buscador y botón nuevo */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm w-full"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleNewProduct}
            className="h-9 px-3 gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {Loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: entriesPerPage }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="aspect-[4/3] w-full" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                <Skeleton className="h-11 w-full" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 flex-1" />
                </div>
                <div className="pt-1 border-t">
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
              <CardFooter className="p-1.5 sm:p-2 pt-0 flex gap-0.5 sm:gap-1">
                <Skeleton className="flex-1 h-6 sm:h-7" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">
            {searchTerm ? "No se encontraron productos" : "No hay productos registrados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden rounded-md">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.descripcion}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">
                  {product.descripcion}
                </h3>

                <div className="flex items-center gap-1">
                  {product.marca && (
                    <Badge variant="secondary" className="font-semibold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                      {product.marca}
                    </Badge>
                  )}
                  {product.descripcionFamilia && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0">
                      {product.descripcionFamilia}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground">
                  {product.codigo && (
                    <p className="truncate flex-1">
                      <span className="font-medium">Código:</span> {product.codigo}
                    </p>
                  )}
                  {product.ean && (
                    <p className="truncate flex-1">
                      <span className="font-medium">EAN:</span> {product.ean}
                    </p>
                  )}
                </div>

                <div className="pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground">Precio</p>
                    <p className="text-base sm:text-lg font-bold text-primary">
                      ${Number(product.precio).toFixed(2)}
                    </p>
                  </div>
                  {product.unidad && (
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5">
                      por {product.unidad}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-1.5 sm:p-2 pt-0 flex gap-0.5 sm:gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 sm:h-7 text-[10px] sm:text-xs bg-transparent px-1 sm:px-2"
                  onClick={() => handleViewDetails(product)}
                >
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Ver</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-transparent"
                  onClick={() => handleEdit(product)}
                >
                  <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-transparent"
                  onClick={() => {
                    setProductToDelete(product)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ✅ Modal de Formulario con callback */}
      <ProductFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        product={productToEdit}
        onProductSaved={handleProductSaved}
      />

      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalCount={totalProducts}
        onPageChange={setCurrentPage}
        onPageSizeChange={setEntriesPerPage}
      />

      <OwnProductDetailsModal 
        product={selectedProduct} 
        open={detailsModalOpen} 
        onOpenChange={setDetailsModalOpen} 
      />

      {/* Dialog de Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto{" "}
              <span className="font-semibold">{productToDelete?.descripcion}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}