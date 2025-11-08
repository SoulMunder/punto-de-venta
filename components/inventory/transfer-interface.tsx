"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import type { Branch, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TransferItem {
  product: Product
  quantity: number
  availableQuantity: number
}

interface ProductWithInventory extends Product {
  cantidad: number
  branch: {
    name: string
    address: string
  }
}

export function TransferInterface() {
  const router = useRouter()
  const [fromBranchId, setFromBranchId] = useState("")
  const [toBranchId, setToBranchId] = useState("")
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [lineFilter, setLineFilter] = useState<string>("all")
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(true)

  const { data: session } = useSession()

  // const supabase = createClient()

  useEffect(() => {
    const cargarSucursales = async () => {
      setLoadingBranches(true)
      try {
        const res = await fetch("/api/branches")
        if (!res.ok) throw new Error("Error cargando sucursales")
        const data: Branch[] = await res.json()

        // Agregamos la opción "Sin sucursal"
        setBranches([{ id: "undefined", name: "Sin sucursal", address: "" }, ...data])
      } catch (err) {
        console.error("❌ Error cargando sucursales:", err)
        setBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }

    cargarSucursales()
  }, [])

  // --- 🟢 Cargar TODO el inventario una sola vez ---
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const cargarInventario = async () => {
      setLoadingInventory(true)
      try {
        // Sin parámetros de búsqueda, cargamos todo
        const res = await fetch(`/api/inventory`, { signal })
        if (!res.ok) throw new Error("Error cargando inventario")

        const data = await res.json()
        const newInventory = data.data

        const mappedProducts: ProductWithInventory[] = newInventory
          .filter((item: any) => item.product)
          .map((item: any) => ({
            ...item.product!,
            cantidad: item.cantidad,
            branch: item.branch || { name: "", address: "" },
          }))

        setProducts(mappedProducts)

        console.log("✅ Inventario cargado:", mappedProducts)
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("❌ Error cargando inventario:", err)
          setProducts([])
        }
      } finally {
        if (!signal.aborted) setLoadingInventory(false)
      }
    }

    cargarInventario()
    return () => controller.abort()
  }, []) // Solo se carga una vez al montar

  const addToTransfer = (product: ProductWithInventory) => {
    const availableQuantity = product.cantidad

    if (availableQuantity <= 0) {
      toast.error("Inventario insuficiente", {
        description: "No hay inventario disponible en la sucursal de origen",
      })
      return
    }

    const existingItem = transferItems.find((item) => item.product._id === product._id)

    if (existingItem) {
      if (existingItem.quantity < availableQuantity) {
        setTransferItems(
          transferItems.map((item) =>
            item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        )
      } else {
        toast.error("Cantidad excedida", {
          description: "No puedes transferir más de lo disponible",
        })
      }
    } else {
      setTransferItems([...transferItems, { product, quantity: 1, availableQuantity }])
    }

    console.log("🟢 Producto agregado al traslado:", transferItems)
  }

  const removeFromTransfer = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return

    const item = transferItems[index]
    if (quantity > item.availableQuantity) {
      toast.error("Cantidad no disponible", {
        description: `Solo hay ${item.availableQuantity} unidades disponibles`,
      })
      return
    }

    const updated = [...transferItems]
    updated[index].quantity = quantity
    setTransferItems(updated)
  }

  const processTransfer = async () => {
    if (!fromBranchId || !toBranchId) {
      toast.error("Sucursales requeridas", {
        description: "Selecciona las sucursales de origen y destino",
      })
      return
    }

    if (fromBranchId === toBranchId) {
      toast.error("Sucursales inválidas", {
        description: "Las sucursales de origen y destino deben ser diferentes",
      })
      return
    }

    if (transferItems.length === 0) {
      toast.error("Productos requeridos", {
        description: "Agrega al menos un producto para transferir",
      })
      return
    }

    // Validate quantities
    for (const item of transferItems) {
      if (item.quantity > item.availableQuantity) {
        toast.error("Inventario insuficiente", {
          description: `No hay suficiente inventario de ${item.product.descripcion}`,
        })
        return
      }
    }

    setIsProcessing(true)

    try {
      // Llamamos al endpoint de la API que hace el traslado
      const fromBranch = branches.find((b) => b.id === fromBranchId)
      const toBranch = branches.find((b) => b.id === toBranchId)

      // --- Aquí agregamos el nombre del usuario ---
      const createdBy = session?.user?.name || "Usuario Desconocido"

      if (!fromBranch || !toBranch) {
        toast.error("Error de validación", {
          description: "Selecciona sucursales válidas",
        })
        return
      }

      const bodyToSend = {
        fromBranch: {
          name: fromBranch.name,
          address: fromBranch.address,
        },
        toBranch: {
          name: toBranch.name,
          address: toBranch.address,
        },
        notes,
        items: transferItems.map((item) => ({
          productId: item.product.codigo, // o _id si prefieres
          quantity: item.quantity,
          descripcion: item.product.descripcion,
          unidad: item.product.unidad,
        })),
        createdByProfile: { name: createdBy }, // <--- agregado
      }

      console.log("🟢 Body que se enviará:", bodyToSend)

      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      })

      if (!res.ok) throw new Error("Error procesando el traslado")

      const data = await res.json()

      toast.success("Traslado completado", {
        description: "El traslado se ha procesado exitosamente",
      })
      setTransferItems([])
      setNotes("")
      setToBranchId("")
      router.push("/admin/inventory")

    } catch (error) {
      console.error("[v0] Error processing transfer:", error)
      toast.error("Error en el traslado", {
        description: "No se pudo procesar el traslado. Intenta nuevamente",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 🟢 Filtrado en el frontend ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.codigo || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(product.ean || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesBrand = brandFilter === "all" || product.marca === brandFilter

    // Filtrado por sucursal
    let matchesBranch = true

    if (fromBranchId && fromBranchId !== "undefined") {
      // Sucursal específica seleccionada
      const selectedBranchName = branches.find((b) => b.id === fromBranchId)?.name
      matchesBranch = product.branch?.name === selectedBranchName
    } else if (fromBranchId === "undefined") {
      // "Sin sucursal" seleccionada
      matchesBranch = !product.branch?.name
    }

    return matchesSearch && matchesBrand && matchesBranch
  })

  // const uniqueBrands = [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[]
  // const uniqueLines = [...new Set(products.map((p) => p.line).filter(Boolean))] as string[]

  const availableToBranches = branches.filter((b) => b.id !== fromBranchId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 p-2 sm:p-4">
      {/* Product Search and Selection */}
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Seleccionar Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {/* Branch Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Sucursal de Origen</Label>
                <Select value={fromBranchId} onValueChange={setFromBranchId} disabled={loadingBranches}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder={loadingBranches ? "Cargando sucursales..." : "Selecciona sucursal"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Sucursal de Destino</Label>
                <Select value={toBranchId} onValueChange={setToBranchId} disabled={!fromBranchId || loadingBranches}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder={loadingBranches ? "Cargando sucursales..." : "Selecciona sucursal"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fromBranchId && toBranchId && (
              <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-md text-xs sm:text-sm">
                <span className="font-medium">{branches.find((b) => b.id === fromBranchId)?.name}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">{branches.find((b) => b.id === toBranchId)?.name}</span>
              </div>
            )}

            <Separator />

            {/* Product Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                    disabled={!fromBranchId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                <Select value={brandFilter} onValueChange={setBrandFilter} disabled={!fromBranchId}>
                  <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {/* {uniqueBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))} */}
                  </SelectContent>
                </Select>

                <Select value={lineFilter} onValueChange={setLineFilter} disabled={!fromBranchId}>
                  <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Todas las líneas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las líneas</SelectItem>
                    {/* {uniqueLines.map((line) => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))} */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product List */}
            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto border rounded-md">
              {!fromBranchId ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
                  Selecciona una sucursal de origen para comenzar
                </div>
              ) : loadingInventory ? (
                <div className="p-6 sm:p-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando inventario...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm">No se encontraron productos</div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const availableQty = inventory[product._id] || 0

                    return (
                      <div
                        key={product._id}
                        className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer"
                        onClick={() => addToTransfer(product)}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-md mx-auto sm:mx-0">
                            <AvatarImage src={product.image_url || undefined} alt={product.descripcion} />
                            <AvatarFallback className="rounded-md text-sm sm:text-base">
                              {product.descripcion.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 w-full">
                            <h3 className="font-semibold text-sm sm:text-base text-center sm:text-left">
                              {product.descripcion}
                            </h3>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs">
                              {product.codigo && (
                                <span className="text-xs sm:text-sm font-medium text-primary">{product.codigo}</span>
                              )}
                              {product.marca && (
                                <span className="text-muted-foreground">
                                  <span className="font-medium">Marca:</span> {product.marca}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2">
                              {product.marca && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  Marca: {product.marca}
                                </Badge>
                              )}
                              {product.familia && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  Familia: {product.descripcionFamilia}
                                </Badge>
                              )}
                              {product.clave && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  Clave: {product.clave}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
                            <Badge variant={product.cantidad > 0 ? "default" : "destructive"} className="text-xs">
                              {product.cantidad} disponibles
                            </Badge>

                            <span className="text-xs text-muted-foreground">{product.unidad}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Cart */}
      <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Productos a Transferir ({transferItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {transferItems.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                Agrega productos para transferir
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transferItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 border rounded text-xs sm:text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{item.product.descripcion}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Disponible: {item.availableQuantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={item.availableQuantity}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 1)}
                        className="w-14 sm:w-16 h-7 sm:h-8 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                        onClick={() => removeFromTransfer(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs sm:text-sm">
                    Notas (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Motivo del traslado, observaciones..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20 text-xs sm:text-sm"
                  />
                </div>

                <Button
                  className="w-full text-sm sm:text-base h-10 sm:h-11"
                  onClick={processTransfer}
                  disabled={isProcessing || !fromBranchId || !toBranchId || transferItems.length === 0}
                >
                  {isProcessing ? "Procesando..." : "Completar Traslado"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
