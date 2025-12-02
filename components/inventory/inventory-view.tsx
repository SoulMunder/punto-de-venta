"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Branch, Product } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Search, Eye, Package, Pencil, Trash2, Plus, X, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductDetailsModal } from "@/components/products/product-details-modal"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
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
import { DataTablePagination } from "./data-table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ProductWithInventory extends Product {
  cantidad: number
  branch: {
    name: string
    address: string
  }
  lowStockThreshold: number
}

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
  const { data: session } = useSession()

  const router = useRouter()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductWithInventory | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedBranch, setSelectedBranch] = useState("all")

  const [productCode, setProductCode] = useState("")
  const [quantity, setQuantity] = useState("")
  const [selectedBranchManual, setSelectedBranchManual] = useState<Branch | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [shouldReload, setShouldReload] = useState(false)
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(true)

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteQuantity, setDeleteQuantity] = useState<number | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<ProductWithInventory | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editLowStockThreshold, setEditLowStockThreshold] = useState("10")
  const [customPrices, setCustomPrices] = useState<Array<{ price_name: string; price_value: string }>>([])
  const [editImageUrl, setEditImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const offset = (currentPage - 1) * entriesPerPage

  const start = totalProducts === 0 ? 0 : offset + 1
  const end = Math.min(currentPage * entriesPerPage, totalProducts)

  const productCodeRef = useRef<HTMLInputElement | null>(null)

  // Agregar estos estados al componente
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!manualModalOpen) {
      setSearchResults([])
      return
    }

    const controller = new AbortController()
    const signal = controller.signal

    const fetchResults = async () => {
      if (!productCode.trim()) {
        setSearchResults([])
        return
      }

      // Marcar este request con un ID único
      const requestId = ++requestIdRef.current
      setIsSearching(true)

      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(productCode)}&limit=5`,
          { signal }
        )
        if (!res.ok) throw new Error("Error buscando productos")
        const data = await res.json()

        // Solo aplicar resultados si este es el request más reciente
        if (requestId === requestIdRef.current) {
          setSearchResults(data)
        }
      } catch (err: any) {
        if (err.name === "AbortError") return // petición cancelada
        console.error("Error buscando productos:", err)
        // Solo limpiar si este es el request más reciente
        if (requestId === requestIdRef.current) {
          setSearchResults([])
        }
      } finally {
        // Solo desactivar loading si este es el request más reciente
        if (requestId === requestIdRef.current) {
          setIsSearching(false)
        }
      }
    }

    // Ejecutar inmediatamente (sin debounce)
    fetchResults()

    // Cleanup: cancelar petición anterior si cambia productCode
    return () => controller.abort()
  }, [productCode, manualModalOpen])


  // Función para seleccionar un producto sugerido
  const seleccionarProducto = (product: Product) => {
    // Guardar el código y mantener la sugerencia seleccionada en la lista
    // para que al reabrir el input no aparezca "No se encontraron productos".
    setProductCode(String(product.codigo))
    setShowSuggestions(false)
    setSearchResults([product])
    // Opcionalmente enfocar el siguiente campo
    document.getElementById('quantity')?.focus()
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productCode || !quantity || !selectedBranchManual) {
      toast.error("Por favor completa todos los campos")
      return
    }
    setIsSubmitting(true)
  }

  const agregarProductoManual = async () => {
    try {
      setIsSubmitting(true)

      const payload = {
        codigo: productCode,
        cantidad: quantity,
        branch: {
          name: selectedBranchManual?.name,
          address: selectedBranchManual?.address,
        },
        createdBy: session?.user?.username,
      }

      console.log("📦 Payload que se enviará al endpoint:", payload)

      const res = await fetch("/api/inventory/carga-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al agregar el producto")
      }

      toast.success("Producto agregado exitosamente.", {
        description: `Código: ${productCode} | Cantidad: ${quantity} | Sucursal: ${selectedBranchManual?.name}`,
      })

      setProductCode("")
      setQuantity("")
      setShouldReload(true)
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
        { signal },
      )
      if (!res.ok) throw new Error("Error cargando inventario")

      const { data, total } = await res.json()

      const mapped = data
        .filter((item: any) => item.product)
        .map((item: any) => ({
          ...item.product!,
          _id: item._id, // ID del documento de inventario
          cantidad: item.cantidad,
          branch: item.branch || { name: "", address: "" },
          // 👇 Agregar campos adicionales del documento de inventario
          lowStockThreshold: item.lowStockThreshold,
          customPrices: item.customPrices || [],
        }))
      console.log(mapped)

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

  const cargarSucursales = async () => {
    setLoadingBranches(true)
    try {
      const res = await fetch("/api/branches")
      if (!res.ok) throw new Error("Error cargando sucursales")
      const data: Branch[] = await res.json()
      setBranches(data)
    } catch (err) {
      console.error("❌ Error cargando sucursales:", err)
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    if (isSubmitting) agregarProductoManual()
  }, [isSubmitting])

  useEffect(() => {
    const controller = new AbortController()
    cargarInventario(controller.signal)
    if (shouldReload) setShouldReload(false)
    return () => controller.abort()
  }, [searchTerm, entriesPerPage, offset, shouldReload])

  useEffect(() => {
    cargarSucursales()
  }, [])

  useEffect(() => {
    if (manualModalOpen) {
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
      toast.error("No hay producto seleccionado")
      return
    }

    if (!deleteQuantity || deleteQuantity < 1) {
      toast.error("Ingresa una cantidad válida")
      return
    }

    try {
      setIsDeleting(true)

      const payload = {
        codigo: productToDelete.codigo,
        branch: productToDelete.branch.name,
        cantidad: deleteQuantity,
        motivo: deleteReason || null,
        createdBy: session?.user?.username,
      }

      console.log("Payload a enviar:", payload)
      console.log("Payload JSON:", JSON.stringify(payload))

      const res = await fetch("/api/inventory/delete-product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch { }

      if (!res.ok) {
        throw new Error(data.error || "Error eliminando producto")
      }

      toast.success(data.message || "Producto eliminado correctamente")

      setDeleteDialogOpen(false)
      setProductToDelete(null)
      setDeleteQuantity(null)
      setDeleteReason("")
      setShouldReload(true)
    } catch (error: any) {
      console.error("Error eliminando producto:", error)
      toast.error("Error eliminando producto", { description: error.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteInventory = async () => {
    try {
      setIsDeleting(true)

      const res = await fetch("/api/inventory", {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al eliminar inventario")
      }

      const data = await res.json()
      toast.success(data.message || "Inventario eliminado correctamente")

      setDeleteInventoryModalOpen(false)
      setShouldReload(true)
    } catch (error: any) {
      toast.error("Error eliminando inventario", {
        description: error.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
  }

  const handleOpenEditModal = (product: ProductWithInventory) => {
    console.log(product)
    setProductToEdit(product)

    setEditQuantity(product.cantidad.toString())

    // Usar lowStockThreshold del producto o 10 por defecto
    setEditLowStockThreshold(
      "lowStockThreshold" in product && product.lowStockThreshold
        ? product.lowStockThreshold.toString()
        : "10"
    )

    setCustomPrices(
      product.customPrices?.map(p => ({
        price_name: p.price_name,
        price_value: String(p.price_value)  // convertimos a string para el input
      })) || []
    );




    // Usar image_url del inventario o del producto
    const currentImage = "image_url" in product ? (product.image_url as string) || "" : ""
    setEditImageUrl(currentImage)
    setImagePreview(currentImage)

    setEditModalOpen(true)
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImagePreview(base64)
        setEditImageUrl(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setEditImageUrl(url)
    setImagePreview(url)
  }

  const handleSaveEdit = async () => {
    if (!productToEdit) return

    if (!editQuantity || Number(editQuantity) < 0) {
      toast.error("Ingresa una cantidad válida")
      return
    }

    try {
      setIsUpdating(true)

      const validCustomPrices = customPrices.filter((price) => price.price_name.trim() !== "" && price.price_value.trim() !== "")

      const payload = {
        id: productToEdit._id, // 👈 Enviar el _id
        cantidad: Number(editQuantity),
        lowStockThreshold: editLowStockThreshold ? Number(editLowStockThreshold) : 10,
        customPrices: validCustomPrices.map((price) => ({
          price_name: price.price_name,
          price_value: Number(price.price_value),
        })),
        imageUrl: editImageUrl || null,
        updatedBy: session?.user?.username,
      }

      console.log("📝 Payload de edición:", payload)

      const res = await fetch("/api/inventory/update-product", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el producto")
      }

      toast.success("Producto actualizado exitosamente")

      setEditModalOpen(false)
      setProductToEdit(null)
      setEditQuantity("")
      setEditLowStockThreshold("10")
      setCustomPrices([])
      setEditImageUrl("")
      setImagePreview("")
      setShouldReload(true)
    } catch (error: any) {
      toast.error("Error al actualizar el producto", {
        description: error.message || "Por favor intenta nuevamente.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const addCustomPrice = () => {
    setCustomPrices([...customPrices, { price_name: "", price_value: "" }])
  }

  const removeCustomPrice = (index: number) => {
    setCustomPrices(customPrices.filter((_, i) => i !== index))
  }

  const updateCustomPrice = (index: number, field: "price_name" | "price_value", value: string) => {
    const updated = [...customPrices]
    updated[index][field] = value
    setCustomPrices(updated)
  }

  const getStockStatus = (quantity: number, lowStockThreshold: number = 10) => {
    if (quantity === 0) return { label: "Sin stock", variant: "destructive" as const }
    if (quantity < lowStockThreshold) return { label: "Stock bajo", variant: "secondary" as const }
    return { label: "En stock", variant: "default" as const }
  }

  const filteredProducts =
    selectedBranch === "all" ? products : products.filter((p) => p.branch?.name === selectedBranch)

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 max-w-full sm:max-w-md">
          <div className="flex items-center gap-2 max-w-full sm:max-w-md">
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
      </div>

      {loading ? (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product.cantidad, product.lowStockThreshold ?? 10)
            const branchName = product.branch?.name ?? "SinSucursal"
            const uniqueKey = `${product._id}_${branchName}_${product.codigo}`

            return (
              <Card key={uniqueKey} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden rounded-md">
                    {"image_url" in product && product.image_url ? (
                      <img
                        src={product.image_url || "/placeholder.svg"}
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
                    <span className="text-muted-foreground">{product.branch?.name || "Sin definir"}</span>
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
                    onClick={() => handleOpenEditModal(product)}
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

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteQuantity(null)
            setDeleteReason("")
            setProductToDelete(null)
          }
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setTimeout(() => {
              const input = document.querySelector('input[type="number"]') as HTMLInputElement
              if (input) {
                input.focus()
                input.blur()
                input.focus()
              }
            }, 0)
          }}
        >
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Ingresa la <strong>cantidad</strong> a eliminar. El motivo es opcional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Cantidad a eliminar</label>
              <input
                type="number"
                min={1}
                max={productToDelete?.cantidad || undefined}
                value={deleteQuantity ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    setDeleteQuantity(null)
                    return
                  }
                  const numberValue = Number(value)
                  if (productToDelete && numberValue > productToDelete.cantidad) {
                    toast.error(`No puedes eliminar más de lo que hay en stock (${productToDelete.cantidad})`)
                    setDeleteQuantity(productToDelete.cantidad)
                  } else {
                    setDeleteQuantity(numberValue)
                  }
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Ej. 5"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
                placeholder="Ej. Producto dañado, caducado, error de inventario..."
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancelar
              </Button>
            </DialogClose>

            <Button
              onClick={handleDelete}
              disabled={isDeleting || !deleteQuantity || Number(deleteQuantity) < 1}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gestión Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="productCode">Código del producto</Label>
                <div className="relative">
                  <Input
                    ref={productCodeRef}
                    id="productCode"
                    value={productCode}
                    onChange={(e) => {
                      setProductCode(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      // Delay para permitir click en sugerencias
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    placeholder="Ingresa el código"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />

                  {/* Indicador de búsqueda */}
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin inline-block"></span>
                    </div>
                  )}
                </div>

                {/* Lista de sugerencias */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault() // Previene que se dispare el blur
                          seleccionarProducto(product)
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-start gap-2 border-b last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{product.codigo}</span>
                            {product.ean && (
                              <span className="text-xs text-muted-foreground">
                                EAN: {product.ean}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.descripcion}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {product.marca}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              ${Number(product.precioPublicoConIVA).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </button>

                    ))}
                  </div>
                )}

                {/* Mensaje cuando no hay resultados */}
                {showSuggestions && !isSearching && productCode.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md p-3">
                    <p className="text-xs text-muted-foreground text-center">
                      No se encontraron productos con ese código
                    </p>
                  </div>
                )}
              </div>

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

              <div className="grid gap-2">
                <Label htmlFor="branch">Sucursal</Label>
                <Select
                  value={selectedBranchManual?.name || ""}
                  onValueChange={(name) => {
                    const branch = branches.find((b) => b.name === name) || null
                    setSelectedBranchManual(branch)
                  }}
                  disabled={isSubmitting || loadingBranches}
                >
                  <SelectTrigger id="branch" className="w-full">
                    <SelectValue placeholder={loadingBranches ? "Cargando sucursales..." : "Selecciona una sucursal"} />
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

      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open)
          if (!open) {
            setProductToEdit(null)
            setEditQuantity("")
            setEditLowStockThreshold("10")
            setCustomPrices([])
            setEditImageUrl("")
            setImagePreview("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              {productToEdit?.descripcion} - {productToEdit?.codigo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <div className="flex flex-col gap-3">
                <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="grid gap-2">
                  <Input
                    placeholder="URL de la imagen"
                    value={editImageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    disabled={isUpdating}
                    className="text-sm"
                  />

                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Imagen
                    </Button>

                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditImageUrl("")
                          setImagePreview("")
                        }}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Puedes ingresar una URL o subir una imagen desde tu dispositivo (máx. 5MB)
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editQuantity">Cantidad</Label>
              <Input
                id="editQuantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="Ingresa la cantidad"
                min="0"
                disabled={isUpdating}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lowStockThreshold">Stock bajo (umbral)</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={editLowStockThreshold}
                onChange={(e) => setEditLowStockThreshold(e.target.value)}
                placeholder="Ej. 10"
                min="0"
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">Cantidad mínima antes de considerar el stock como bajo</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Precios Personalizados</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomPrice}
                  disabled={isUpdating}
                  className="h-8 bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Precio
                </Button>
              </div>

              {customPrices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No hay precios personalizados. Haz clic en "Agregar Precio" para añadir uno.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {customPrices.map((price, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nombre del precio"
                          value={price.price_name}
                          onChange={(e) => updateCustomPrice(index, "price_name", e.target.value)}
                          disabled={isUpdating}
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={price.price_value}
                          onChange={(e) => updateCustomPrice(index, "price_value", e.target.value)}
                          disabled={isUpdating}
                          step="0.01"
                          min="0"
                          className="text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeCustomPrice(index)}
                        disabled={isUpdating}
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating} className="flex items-center gap-2">
              {isUpdating ? (
                <>
                  <span className="loader h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
