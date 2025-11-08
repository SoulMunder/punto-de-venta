"use client"

import type React from "react"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client"
import type { Branch, Product } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: Branch[]
  userId: string
  onSuccess: () => void
}

interface PurchaseItem {
  product_id: string
  product_name: string
  quantity: number
  purchase_price: number
}

export function PurchaseDialog({ open, onOpenChange, branches, userId, onSuccess }: PurchaseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchId, setBranchId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])

  // Product search
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)

  // const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadProducts()
    } else {
      // Reset form
      setBranchId("")
      setPurchaseDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setItems([])
      setSearchTerm("")
      setShowProductSearch(false)
    }
  }, [open])

  const loadProducts = async () => {
    // const { data } = await supabase.from("products").select("*").order("name")
    // if (data) {
    //   setProducts(data)
    // }
  }

  const addProduct = (product: Product) => {
    // Check if product already added
    if (items.find((item) => item.product_id === product.id)) {
      return
    }

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        purchase_price: product.purchase_price,
      },
    ])
    setSearchTerm("")
    setShowProductSearch(false)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: "quantity" | "purchase_price", value: number) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!branchId) {
      setError("Selecciona una sucursal")
      setIsLoading(false)
      return
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto")
      setIsLoading(false)
      return
    }

    // try {
    //   // Create purchase
    //   const { data: purchase, error: purchaseError } = await supabase
    //     .from("purchases")
    //     .insert({
    //       branch_id: branchId,
    //       purchase_date: purchaseDate,
    //       notes: notes || null,
    //       created_by: userId,
    //     })
    //     .select()
    //     .single()

    //   if (purchaseError) throw purchaseError

    //   // Create purchase items
    //   const purchaseItems = items.map((item) => ({
    //     purchase_id: purchase.id,
    //     product_id: item.product_id,
    //     quantity: item.quantity,
    //     purchase_price: item.purchase_price,
    //   }))

    //   const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItems)

    //   if (itemsError) throw itemsError

    //   onSuccess()
    //   onOpenChange(false)
    // } catch (err: unknown) {
    //   setError(err instanceof Error ? err.message : "Error al registrar la compra")
    // } finally {
    //   setIsLoading(false)
    // }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.truper_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Compra</DialogTitle>
          <DialogDescription>Registra la entrada de mercancía a una sucursal</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Sucursal *</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sucursal" />
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
                <Label htmlFor="purchase_date">Fecha de Compra *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Productos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Producto
                </Button>
              </div>

              {showProductSearch && (
                <div className="border rounded-md p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos</div>
                    ) : (
                      <div className="divide-y">
                        {filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                            onClick={() => addProduct(product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.truper_code && `Truper: ${product.truper_code}`}
                              {product.barcode && ` | Barras: ${product.barcode}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-32">Cantidad</TableHead>
                        <TableHead className="w-40">Precio Compra</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.purchase_price}
                              onChange={(e) =>
                                updateItem(index, "purchase_price", Number.parseFloat(e.target.value) || 0)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mt-4">{error}</p>}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
