"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Package, Eye, Book, Loader2 } from "lucide-react"
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
import { ProductDetailsModal } from "@/components/products/product-details-modal"
import type { ObjectId } from "mongodb"
import Link from "next/link"
import { DataTablePagination } from "./data-table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Product } from "@/lib/types"
import { useToast } from "../ui/use-toast"



export function ProductCardList() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [Loading, setLoading] = useState(true)

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const offset = (currentPage - 1) * entriesPerPage

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const start = totalProducts === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
  const end = Math.min(currentPage * entriesPerPage, totalProducts)

  // useEffect
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const cargarTodo = async () => {
      setLoading(true) // activar cargando
      try {
        const res = await fetch(
          `/api/products/catalog?searchTerm=${encodeURIComponent(searchTerm)}&limit=${entriesPerPage}&offset=${offset}`,
          { signal },
        )
        if (!res.ok) throw new Error("Error cargando productos")

        const data = await res.json()
        const newProducts = data.products
        const total = data.total

        setProducts(newProducts)
        setTotalProducts(total)

      } catch (err: any) {
        if (err.name === "AbortError") return
        console.error(err)
        setProducts([])
        setTotalProducts(0)
      } finally {
        if (!signal.aborted) setLoading(false) // desactivar cargando
      }
    }

    cargarTodo()
    return () => controller.abort()
  }, [searchTerm, entriesPerPage, offset])

  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()


  const handleDelete = async () => {
    if (!productToDelete?._id) return

    try {
      setIsDeleting(true) // 🟡 Activa el loader

      const res = await fetch(`/api/products/${productToDelete._id}`, {
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

      // ✅ Eliminar del estado local
      setProducts(products.filter(p => p._id !== productToDelete._id))
      setDeleteDialogOpen(false)
      setProductToDelete(null)

      // ✅ Mostrar toast de éxito
      toast({
        title: "Producto eliminado",
        description: "El producto fue eliminado correctamente.",
      })

      // 🔄 Recargar la página después de 1 segundo
      router.refresh()

      console.log("✅ Producto eliminado correctamente")
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el producto.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false) // 🔵 Desactiva el loader
    }
  }


  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
  }



  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Buscador y botón nuevo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 max-w-full sm:max-w-md">
          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm w-[25vw]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm inline-flex items-center justify-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Nuevo Producto
          </Link>

          <Link
            href="/admin/products/upload_catalog"
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm inline-flex items-center justify-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <Book className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cargar catálogo
          </Link>
        </div>
      </div>

      {/* Contenido */}
      {Loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
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
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <div>
                      <Skeleton className="h-2 w-12 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div>
                      <Skeleton className="h-2 w-16 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div>
                      <Skeleton className="h-2 w-14 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-1.5 sm:p-2 pt-0 flex gap-0.5 sm:gap-1">
                <Skeleton className="flex-1 h-6 sm:h-7" />
                <Skeleton className="h-6 w-6 sm:h-7 sm:w-7" />
                <Skeleton className="h-6 w-6 sm:h-7 sm:w-7" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {products.map((product) => (
            <Card key={product._id.toString()} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden rounded-md">
                  {("image_url" in product && product.image_url) ? (
                    <img
                      src={product.image_url}
                      alt={product.descripcion}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>


              <CardContent className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{product.descripcion}</h3>

                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="font-semibold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                    {product.marca}
                  </Badge>
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0">
                    {product.descripcionFamilia}
                  </Badge>
                </div>

                <div className="flex gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground">
                  {product.clave && (
                    <p className="truncate flex-1">
                      <span className="font-medium">Clave:</span> {product.clave}
                    </p>
                  )}
                  {product.ean && (
                    <p className="truncate flex-1">
                      <span className="font-medium">EAN:</span> {product.ean}
                    </p>
                  )}
                </div>

                <div className="pt-1 border-t">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 divide-x">
                    <div className="pr-1.5 sm:pr-2">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5">Distribuidor</p>
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        {product.precioDistribuidorConIVA !== null
                          ? product.precioDistribuidorConIVA.toFixed(2)
                          : ""}
                      </p>
                    </div>
                    <div className="px-1.5 sm:px-2">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5">Publico</p>
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        {product.precioPublicoConIVA !== null
                          ? product.precioPublicoConIVA.toFixed(2)
                          : ""}
                      </p>
                    </div>
                    <div className="pl-1.5 sm:pl-2">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5">Mayoreo</p>
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        {product.precioMayoreoConIVA !== null
                          ? product.precioMayoreoConIVA.toFixed(2)
                          : ""}
                      </p>
                    </div>
                  </div>
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
                  onClick={() => router.push(`/admin/products/${product._id.toString()}/edit`)}
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
      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalCount={totalProducts}
        onPageChange={setCurrentPage}
        onPageSizeChange={setEntriesPerPage}
      />

      <ProductDetailsModal product={selectedProduct} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
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
