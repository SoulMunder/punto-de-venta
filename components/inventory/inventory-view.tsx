"use client"

import { useState, useEffect, useRef } from "react"
import type { Branch, Product, Inventory } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Search, Eye, Package, Pencil, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductDetailsModal } from "@/components/products/product-details-modal"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"




import { useRouter } from "next/navigation"
import { Plus, Book } from "lucide-react"
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
import Link from "next/link"
import { DataTablePagination } from "./data-table-pagination"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ProductWithInventory extends Product {
  cantidad: number
  branch: {
    name: string
    address: string
  }
}

// 🟢 Recibe el estado del modal desde el padre
interface InventoryViewProps {
  manualModalOpen: boolean
  setManualModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  deleteInventoryModalOpen: boolean
  setDeleteInventoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}


export function InventoryView({
  manualModalOpen,
  setManualModalOpen,
  deleteInventoryModalOpen,
  setDeleteInventoryModalOpen,
}: InventoryViewProps) {

  const router = useRouter()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductWithInventory | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedBranch, setSelectedBranch] = useState("all")


  // --- 📦 Estados del modal manual ---
  const [productCode, setProductCode] = useState("")
  const [quantity, setQuantity] = useState("")
  const [selectedBranchManual, setSelectedBranchManual] = useState<Branch | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)


  // --- 📦 Estados del inventario ---
  const [shouldReload, setShouldReload] = useState(false)
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(true)
  // Estado para indicar si se está eliminando
  const [isDeleting, setIsDeleting] = useState(false);



  // --- 🔍 Filtros y paginación ---
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const offset = (currentPage - 1) * entriesPerPage

  // --- 🔢 Rangos de paginación ---
  const start = totalProducts === 0 ? 0 : offset + 1
  const end = Math.min(currentPage * entriesPerPage, totalProducts)

  // --- 📍 Referencias ---
  const productCodeRef = useRef<HTMLInputElement | null>(null)


  // =====================================================
  // 🧩 HANDLERS
  // =====================================================


  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productCode || !quantity || !selectedBranchManual) {
      toast.error("Por favor completa todos los campos")
      return
    }
    setIsSubmitting(true)
  }

  // =====================================================
  // 🚀 FUNCIONES ASÍNCRONAS
  // =====================================================

  const agregarProductoManual = async () => {
    try {
      setIsSubmitting(true)

      // 📨 Enviar datos al endpoint
      const res = await fetch("/api/inventory/carga-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // body que envías desde el frontend
        body: JSON.stringify({
          codigo: productCode,
          cantidad: quantity,
          branch: {
            name: selectedBranchManual?.name,
            address: selectedBranchManual?.address,
          }
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al agregar el producto")
      }

      // ✅ Éxito
      toast.success("Producto agregado exitosamente.", {
        description: `Código: ${productCode} | Cantidad: ${quantity} | Sucursal: ${selectedBranchManual?.name}`,
      })

      // 🧹 Limpieza sin cerrar modal
      setProductCode("")
      setQuantity("")

      // 🔄 Forzar recarga del inventario
      setShouldReload(true)

      // 🔁 Enfocar input principal
      setTimeout(() => productCodeRef.current?.focus(), 50)
    } catch (error: any) {
      toast.error("Error al agregar el producto.", {
        description: error.message || "Por favor intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  const cargarInventario = async (signal: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/inventory?searchTerm=${encodeURIComponent(searchTerm)}&limit=${entriesPerPage}&offset=${offset}`,
        { signal }
      )
      if (!res.ok) throw new Error("Error cargando inventario")

      const { data, total } = await res.json()

      const mapped = data
        .filter((item: any) => item.product)
        .map((item: any) => ({
          ...item.product!,
          cantidad: item.cantidad,
          branch: item.branch || { name: "", address: "" },
        }))

      setProducts(mapped)
      setTotalProducts(total)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("❌ Error cargando inventario:", err)
        setProducts([])
        setTotalProducts(0)
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  // 2. Modificar la función cargarSucursales
  const cargarSucursales = async () => {
    setLoadingBranches(true) // 🔄 Iniciar carga
    try {
      const res = await fetch("/api/branches")
      if (!res.ok) throw new Error("Error cargando sucursales")
      const data: Branch[] = await res.json()
      setBranches(data)


    } catch (err) {
      console.error("❌ Error cargando sucursales:", err)
      setBranches([])
    } finally {
      setLoadingBranches(false) // ✅ Finalizar carga
    }
  }



  // =====================================================
  // 🧠 EFECTOS
  // =====================================================

  // 1️⃣ Efecto: manejar envío manual
  useEffect(() => {
    if (isSubmitting) agregarProductoManual()
  }, [isSubmitting])

  // 2️⃣ Efecto: cargar inventario
  useEffect(() => {
    const controller = new AbortController()
    cargarInventario(controller.signal)
    if (shouldReload) setShouldReload(false)
    return () => controller.abort()
  }, [searchTerm, entriesPerPage, offset, shouldReload])

  // 3️⃣ Efecto: cargar sucursales una vez
  useEffect(() => {
    cargarSucursales()
  }, [])

  useEffect(() => {
    if (manualModalOpen) {
      // 🟢 Si las sucursales ya están cargadas y no hay una seleccionada, seleccionar la primera
      if (!loadingBranches && branches.length > 0 && !selectedBranchManual) {
        setSelectedBranchManual(branches[0])
      }

      setTimeout(() => {
        const input = productCodeRef.current
        if (input) {
          input.focus()
          const length = input.value.length
          input.setSelectionRange(length, length)
        }
      }, 100)
    }
  }, [manualModalOpen, loadingBranches, branches, selectedBranchManual])


  const handleDelete = async () => {
    if (!productToDelete) {
      toast.error("No hay producto seleccionado");
      return;
    }

    try {
      setIsDeleting(true); // opcional: mostrar spinner

      const res = await fetch("/api/inventory/delete-product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: productToDelete.codigo,
          branch: productToDelete.branch.name,
        }),
      });

      // Manejar JSON solo si existe
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || "Error eliminando producto");
      }

      toast.success(data.message || "Producto eliminado correctamente");

      // Limpiar estados
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setShouldReload(true); // recargar inventario
    } catch (error: any) {
      console.error("Error eliminando producto:", error);
      toast.error("Error eliminando producto", {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };


  const handleDeleteInventory = async () => {
    try {
      setIsDeleting(true); // inicia cargando

      // Llamada al endpoint DELETE
      const res = await fetch("/api/inventory", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar inventario");
      }

      const data = await res.json();
      toast.success(data.message || "Inventario eliminado correctamente");

      // Cerrar modal
      setDeleteInventoryModalOpen(false);

      // Recargar la lista de inventario
      setShouldReload(true);
    } catch (error: any) {
      toast.error("Error eliminando inventario", {
        description: error.message,
      });
    } finally {
      setIsDeleting(false); // termina cargando
    }
  };


  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Sin stock", variant: "destructive" as const }
    if (quantity < 10) return { label: "Stock bajo", variant: "secondary" as const }
    return { label: "En stock", variant: "default" as const }
  }

  // 🔵 Filtrar productos por sucursal seleccionada
  const filteredProducts =
    selectedBranch === "all"
      ? products
      : products.filter((p) => p.branch?.name === selectedBranch)



  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Buscador y botón nuevo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 max-w-full sm:max-w-md">
          {/* Input de búsqueda */}
          <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm w-[25vw]"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


      </div>

      {/* Contenido */}
      {loading ? (
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
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">
            {searchTerm ? "No se encontraron productos" : "No hay productos registrados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">

          {filteredProducts.map((product) => {
            const status = getStockStatus(product.cantidad);

            // Generar key única combinando _id + branch + codigo
            const branchName = product.branch?.name ?? "SinSucursal";
            const uniqueKey = `${product._id}_${branchName}_${product.codigo}`;

            return (
              <Card key={uniqueKey} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden rounded-md">
                    {"image_url" in product && product.image_url ? (
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
                    {product.codigo && (
                      <p className="truncate flex-1">
                        <span className="font-medium">Codigo:</span> {product.codigo}
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
                          {Number.isFinite(Number(product.precioDistribuidorConIVA)) &&
                            String(product.precioDistribuidorConIVA) !== "*"
                            ? `$${Number(product.precioDistribuidorConIVA).toFixed(2)}`
                            : ""}
                        </p>

                      </div>
                      <div className="px-1.5 sm:px-2">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5">Publico</p>
                        <p className="text-xs sm:text-sm font-bold text-primary">
                          {Number.isFinite(Number(product.precioPublicoConIVA)) &&
                            String(product.precioPublicoConIVA) !== "*"
                            ? Number(product.precioPublicoConIVA).toFixed(2)
                            : product.precioPublicoConIVA}
                        </p>

                      </div>
                      <div className="pl-1.5 sm:pl-2">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5">Mayoreo</p>
                        <p className="text-xs sm:text-sm font-bold text-primary">
                          {Number.isFinite(Number(product.precioMayoreoConIVA)) &&
                            String(product.precioMayoreoConIVA) !== "*"
                            ? Number(product.precioMayoreoConIVA).toFixed(2)
                            : product.precioMayoreoConIVA}
                        </p>

                      </div>
                    </div>
                  </div>


                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Sucursal:</span>
                    <span className="text-muted-foreground">
                      {product.branch?.name || "Sin definir"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Cantidad:</span>
                    <span className="text-xl font-bold">{product.cantidad}</span>
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
            )
          })}


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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2"
              disabled={isDeleting} // Deshabilitar mientras se elimina
            >
              {isDeleting ? (
                <>
                  <span className="loader h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gestión Manual</DialogTitle>

          </DialogHeader>
          <form onSubmit={handleManualSubmit}>
            <div className="grid gap-4 py-4">
              {/* Código del producto */}
              <div className="grid gap-2">
                <Label htmlFor="productCode">Código del producto</Label>
                <Input
                  ref={productCodeRef} // 🟢 referencia
                  id="productCode"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder="Ingresa el código"
                  disabled={isSubmitting}
                />
              </div>

              {/* Cantidad */}
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ingresa la cantidad"
                  disabled={isSubmitting}
                  min="1"
                />
              </div>

              {/* Sucursal */}
              <div className="grid gap-2">
                <Label htmlFor="branch">Sucursal</Label>
                <Select
                  value={selectedBranchManual?.name || ""}
                  onValueChange={(name) => {
                    const branch = branches.find((b) => b.name === name) || null
                    setSelectedBranchManual(branch)
                  }}
                  disabled={isSubmitting || loadingBranches} // 🔄 Deshabilitar mientras carga
                >
                  <SelectTrigger id="branch" className="w-full">
                    <SelectValue
                      placeholder={
                        loadingBranches
                          ? "Cargando sucursales..."
                          : "Selecciona una sucursal"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingBranches ? (
                      <SelectItem value="loading" disabled>
                        Cargando...
                      </SelectItem>
                    ) : branches.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay sucursales disponibles
                      </SelectItem>
                    ) : (
                      branches.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="loader h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                    Agregando...
                  </>
                ) : (
                  "Agregar"
                )}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>


      <AlertDialog open={deleteInventoryModalOpen} onOpenChange={setDeleteInventoryModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todo el inventario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los productos y sus datos asociados del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInventory}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar inventario"}
            </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>






    </div>
  )
}
