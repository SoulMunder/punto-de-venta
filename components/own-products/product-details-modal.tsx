"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Package, Eye, Book, Loader2, X } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "../ui/use-toast"
import { DataTablePagination } from "../inventory/data-table-pagination"
import { OwnProduct } from "@/lib/types"



// Modal de detalles del producto adaptado para OwnProduct
export function OwnProductDetailsModal({ 
  product, 
  open, 
  onOpenChange 
}: { 
  product: OwnProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Producto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Imagen */}
          {product.imageUrl && (
            <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.descripcion}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Información básica */}
          <div className="space-y-3">
            <div>
              <h3 className="text-2xl font-bold">{product.descripcion}</h3>
              {product.marca && (
                <Badge variant="secondary" className="mt-2">
                  {product.marca}
                </Badge>
              )}
            </div>

            {/* Precio principal */}
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-3xl font-bold text-primary">
                ${Number(product.precio).toFixed(2)}
              </p>
              {product.unidad && (
                <p className="text-sm text-muted-foreground">por {product.unidad}</p>
              )}
            </div>

            {/* Códigos e identificadores */}
            <div className="grid grid-cols-2 gap-4">
              {product.codigo && (
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-semibold">{product.codigo}</p>
                </div>
              )}
              {product.clave && (
                <div>
                  <p className="text-sm text-muted-foreground">Clave</p>
                  <p className="font-semibold">{product.clave}</p>
                </div>
              )}
              {product.ean && (
                <div>
                  <p className="text-sm text-muted-foreground">EAN</p>
                  <p className="font-semibold">{product.ean}</p>
                </div>
              )}
            </div>

            {/* Clasificación */}
            {(product.familia || product.descripcionFamilia) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Clasificación</p>
                <div className="flex gap-2">
                  {product.familia && (
                    <Badge variant="outline">{product.familia}</Badge>
                  )}
                  {product.descripcionFamilia && (
                    <Badge variant="outline">{product.descripcionFamilia}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* SAT */}
            {(product.codigoSAT || product.descripcionSAT) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Información SAT</p>
                <div className="space-y-1">
                  {product.codigoSAT && (
                    <p className="text-sm">
                      <span className="font-medium">Código SAT:</span> {product.codigoSAT}
                    </p>
                  )}
                  {product.descripcionSAT && (
                    <p className="text-sm">
                      <span className="font-medium">Descripción SAT:</span> {product.descripcionSAT}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fecha de creación */}
            {product.createdAt && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de creación</p>
                <p className="text-sm">
                  {new Date(product.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  const [manualModalOpen, setManualModalOpen] = useState(false)

  const start = totalProducts === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
  const end = Math.min(currentPage * entriesPerPage, totalProducts)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const cargarTodo = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/own-products?searchTerm=${encodeURIComponent(searchTerm)}&limit=${entriesPerPage}&offset=${offset}`,
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
        if (!signal.aborted) setLoading(false)
      }
    }

    cargarTodo()
    return () => controller.abort()
  }, [searchTerm, entriesPerPage, offset])

  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleViewDetails = (product: OwnProduct) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
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
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>

              <CardFooter className="p-1.5 sm:p-2 pt-0">
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
                    <p className="text-lg sm:text-xl font-bold text-primary">
                      ${Number(product.precio).toFixed(2)}
                    </p>
                  </div>
                  {product.unidad && (
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground text-right">
                      por {product.unidad}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-1.5 sm:p-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 sm:h-7 text-[10px] sm:text-xs bg-transparent px-1 sm:px-2"
                  onClick={() => handleViewDetails(product)}
                >
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  Ver detalles
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

      <OwnProductDetailsModal 
        product={selectedProduct} 
        open={detailsModalOpen} 
        onOpenChange={setDetailsModalOpen} 
      />
    </div>
  )
}