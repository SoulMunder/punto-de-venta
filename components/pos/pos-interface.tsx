"use client"

import { useState, useEffect, useRef } from "react"
import type { Branch, CartItem, Customer, InventoryProduct, NewSale, SaleReceipt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ShoppingCart, Trash2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductDetailsModal } from "@/components/products/product-details-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { openSaleReceiptPDFForPrint } from "@/lib/pdf-generator"
import { getInventoryProducts } from "@/app/actions/inventoryProducts/get-inventory-products"
import { getCustomers } from "@/app/actions/customers/get-customers"
import { processProductsSale } from "@/app/actions/sales/process-products-sale"
import { getQuoteSales } from "@/app/actions/sales/get-quote-sales"
import { useSession } from "next-auth/react"


interface POSInterfaceProps {
  branches: Branch[]
  userId: string
  userBranchId: string | null
  allowBranchChange?: boolean // New prop to control if branch can be changed
}

export function POSInterface({ branches, userId, userBranchId, allowBranchChange = false }: POSInterfaceProps) {
  const initialBranch = userBranchId ? userBranchId : branches[0].id || ""
  const [branchId, setBranchId] = useState(initialBranch)
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [familyDescriptionFilter, setFamilyDescriptionFilter] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none")
  const [paymentReceived, setPaymentReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<SaleReceipt | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [customPriceDialogOpen, setCustomPriceDialogOpen] = useState(false)
  const [selectedProductForCustomPrice, setSelectedProductForCustomPrice] = useState<InventoryProduct | null>(null)
  const [productCustomPrices, setProductCustomPrices] = useState<Record<string, Record<string, number>>>({})
  const [saleType, setSaleType] = useState<"remision" | "credito" | "cotizacion">("remision")
  const initialLoadDone = useRef(false);  // Usamos useRef para mantener un estado mutable sin re-renderizar

  const { data: session } = useSession()


  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadProducts();
      loadCustomers();
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const convertQuoteId = urlParams.get("convertQuote")
    if (!products.length || !convertQuoteId) return; // espera a que ambos existan
    if (convertQuoteId) {
      loadQuoteForConversion(convertQuoteId)
    }
  }, [products]);

  useEffect(() => {
    if (!products.length) return; // espera a que ambos existan
    loadAllCustomPrices()
  }, [products]);

  const loadProducts = async () => {
    try {
      const branchesNames = branches.map((branch) => branch.name)
      const { data, error } = await getInventoryProducts(branchesNames)
      if (error || !data) {
        console.error("Error al cargar usuarios:", error)
        return
      }
      setProducts(data)
      console.log(data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadCustomers = async () => {
    try {
      const { data, error } = await getCustomers()
      if (error || !data) {
        console.error("Error al cargar usuarios:", error)
        return
      }
      setCustomers(data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadAllCustomPrices = async () => {
    const pricesMap: Record<string, Record<string, number>> = {};

    products.forEach((product: any) => {
      // Verifica que customPrices exista y sea un array
      if (product.customPrices && product.customPrices.length > 0) {
        // Inicializa el objeto para este producto
        pricesMap[product._id] = {};

        // Itera sobre los precios personalizados
        product.customPrices.forEach((customPrice: any) => {
          pricesMap[product._id][customPrice.price_name] = customPrice.price_value;
        });
      }
    });

    setProductCustomPrices(pricesMap);
  };

  useEffect(() => {
    onSaleTypeChange()
  }, [saleType])

  const onSaleTypeChange = () => {
    const cartToCheck = [...cart]
    const checkedCart = cartToCheck.map((item) => {
      let quantity = item.quantity
      if (item.quantity > item.product.cantidad) quantity = item.product.cantidad
      return ({
        ...item,
        quantity
      })
    })
    setCart(checkedCart)
  }

  const addToCart = (product: InventoryProduct, priceType: "retail" | "wholesale" | "custom", customPrice?: number) => {
    const existingItem = cart.find((item) => item.product.codigo === product.codigo && item.price_type === priceType)

    let unitPrice = product.precioPublicoConIVA
    if (priceType === "wholesale") unitPrice = product.precioMayoreoConIVA
    if (priceType === "custom" && customPrice) unitPrice = customPrice
    const quantity = product.cantidad

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.codigo === product.codigo && item.price_type === priceType
            ? { ...item, quantity: item.quantity >= quantity ? item.quantity : item.quantity + 1 }
            : item,
        ),
      )
    } else {
      setCart([...cart, { product, quantity: 1, unit_price: unitPrice, price_type: priceType }])
    }
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number, saleType: string) => {
    if (quantity < 1) return
    const updated = [...cart]
    const updatedItem = updated[index]
    if (quantity > updatedItem.product.cantidad && saleType !== "cotizacion") {
      updated[index].quantity = updatedItem.product.cantidad
      return
    }

    updated[index].quantity = quantity
    setCart(updated)
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  }

  const calculateChange = () => {
    const total = calculateTotal()
    const payment = Number.parseFloat(paymentReceived) || 0
    return payment - total
  }

  const processSale = async () => {
    if (!branchId) {
      alert("Selecciona una sucursal")
      return
    }

    if (cart.length === 0) {
      alert("El carrito está vacío")
      return
    }

    if (saleType === "credito" && selectedCustomer === "none") {
      alert("Las ventas a crédito requieren un cliente")
      return
    }

    if (saleType === "remision") {
      const payment = Number.parseFloat(paymentReceived) || 0
      const total = calculateTotal()

      if (payment < total) {
        alert("El pago recibido es insuficiente para una remisión")
        return
      }
    }

    if (saleType !== "cotizacion") {
      let hasGreaterQuantity = false
      for (const item of cart) {
        if (item.quantity > item.product.cantidad) {
          alert(`La cantidad del producto ${item.product.descripcion} excede la cantidad en existencia que es: ${item.product.cantidad}`)
          hasGreaterQuantity = true
        }
      }
      if (hasGreaterQuantity) return
    }

    setIsProcessing(true)

    try {
      const customerId = selectedCustomer === "none" ? null : selectedCustomer
      const total = calculateTotal()
      const payment = saleType === "cotizacion" ? 0 : Number.parseFloat(paymentReceived) || 0

      const urlParams = new URLSearchParams(window.location.search)
      const parentQuoteId = urlParams.get("convertQuote")

      const sale = {
        branch_id: branchId,
        customer_id: customerId,
        total_amount: total,
        payment_received: payment,
        change_given: saleType === "cotizacion" ? 0 : Math.max(0, payment - total),
        created_by: userId,
        sale_type: saleType,
        payment_status: saleType === "credito" ? "pending" : saleType === "cotizacion" ? "pending" : "paid" as "pending" | "confirmed" | "paid",
        parent_sale_id: parentQuoteId || null,
        cart,
        created_by_user: session?.user?.username 
        }

      const { data: saleData, error: saleError } = await processProductsSale(sale)

      if (saleError) throw saleError

      if (!saleData) {
        throw new Error("No se obtuvieron los datos de la venta")
      }

      const saleItems = saleData.sale_items.map((saleItem) => {
        const product = products.find(
          (product) => product.codigo === saleItem.product_code
        );

        return {
          ...saleItem,
          product: {
            name: product?.descripcion ?? "",
            truper_code: product?.codigo ?? "",
            brand: product?.marca ?? "",
          },
        };
      });

      const saleReceipt: SaleReceipt = {
        ...saleData,
        sale_items: saleItems,
      };

      setReceiptData(saleReceipt);
      setLastSaleId(saleData.id)
      setShowReceipt(true)
      setCart([])
      setSelectedCustomer("none")
      setPaymentReceived("")
      setSaleType("remision")

      if (parentQuoteId) {
        window.history.replaceState({}, "", window.location.pathname)
      }
    } catch (error) {
      console.error("[v0] Error processing sale:", error)
      alert("Error al procesar la venta")
    } finally {
      setIsProcessing(false)
    }
  }

  const closeReceipt = () => {
    setShowReceipt(false)
    setLastSaleId(null)
    setReceiptData(null)
    loadProducts()
  }

  const handleViewDetails = (product: InventoryProduct) => {
    setSelectedProduct(product)
    setDetailsModalOpen(true)
  }

  const handleCustomPriceClick = (product: InventoryProduct) => {
    setSelectedProductForCustomPrice(product)
    setCustomPriceDialogOpen(true)
  }

  const loadQuoteForConversion = async (quoteId: string) => {
    try {
      const { data, error } = await getQuoteSales(quoteId)
      if (error || !data) {
        console.error("Error al cargar cotización:", error)
        return
      }

      let skippedProducts = ""

      const cartItems: CartItem[] = data.sale_items.reduce((acc: CartItem[], item: any) => {
        const product = products.find((p) => p.codigo === item.product_code);
        if (!product) {
          skippedProducts += `, ${item.product_code}`
          return acc;
        } // si no lo encuentra, simplemente no lo agrega

        acc.push({
          product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          price_type: "custom", // Marcar como personalizado ya que estamos utilizando el precio cotizado
        });

        return acc;
      }, []);

      setCart(cartItems)

      if (data.customer_id) {
        setSelectedCustomer(data.customer_id)
      }

      if (data.branch_id) {
        setBranchId(data.branch_id)
      }

      if (skippedProducts !== "") {
        alert(`Cotización cargada sin los siguientes productos${skippedProducts}. Selecciona el tipo de venta y completa la transacción.`)
      } else {
        alert("Cotización completamente cargada. Selecciona el tipo de venta y completa la transacción.")
      }


    } catch (error) {
      console.error("Error loading quote:", error)
      alert("Error al cargar la cotización")
    }
  }



  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.clave?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBrand = brandFilter === "all" || product.marca === brandFilter
    const matchesLine = familyDescriptionFilter === "all" || product.descripcionFamilia === familyDescriptionFilter
    const selectedBranch = branches.find((branch) => (branch.id === branchId))
    const matchesBranch = product.branch === selectedBranch?.name
    return matchesSearch && matchesBrand && matchesLine && matchesBranch
  })

  const uniqueBrands = [...new Set(products.map((p) => p.marca).filter(Boolean))] as string[]
  const uniqueFamilyDescriptions = [...new Set(products.map((p) => p.descripcionFamilia).filter(Boolean))] as string[]

  const total = calculateTotal()
  const change = calculateChange()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 p-2 sm:p-4">
      {/* Product Search and Selection */}
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">Buscar Productos</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="text-xs sm:text-sm font-medium whitespace-nowrap">Sucursal:</Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={!allowBranchChange}>
                  <SelectTrigger className="w-full sm:w-48 h-8 sm:h-10 text-xs sm:text-sm">
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nombre, código Truper o barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {uniqueBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={familyDescriptionFilter} onValueChange={setFamilyDescriptionFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Todas las líneas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las familias</SelectItem>
                    {uniqueFamilyDescriptions.map((familyDescription) => (
                      <SelectItem key={familyDescription} value={familyDescription}>
                        {familyDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto border rounded-md">
              {filteredProducts.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
                  {searchTerm || brandFilter !== "all" || familyDescriptionFilter !== "all"
                    ? "No se encontraron productos"
                    : "Busca un producto para comenzar"}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const customPrices = productCustomPrices[product._id] || {}
                    const hasCustomPrices = Object.keys(customPrices).length > 0
                    // const characteristics = product.characteristics as Record<string, string> | null

                    return (
                      <div
                        key={product._id}
                        className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleViewDetails(product)}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-md mx-auto sm:mx-0">
                            <AvatarImage src={product.image_url || undefined} alt={product.descripcion} />
                            <AvatarFallback className="rounded-md text-base sm:text-lg">
                              {product.descripcion?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 w-full">
                            <h3 className="font-semibold text-base sm:text-xl text-center sm:text-left">
                              {product.descripcion}
                            </h3>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-1 text-xs sm:text-sm">
                              {product.codigo && (
                                <span className="text-sm sm:text-base font-bold text-primary">
                                  {product.codigo}
                                </span>
                              )}
                              {product.marca && (
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                  <span className="font-medium">Marca:</span> {product.marca}
                                </span>
                              )}
                              {product.descripcionFamilia && (
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                  <span className="font-medium">Familia:</span> {product.descripcionFamilia}
                                </span>
                              )}
                              {product.cantidad && (
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                  <span className="font-medium">Cantidad:</span> {product.cantidad}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-2">
                              <div
                                className="border rounded-md p-2 sm:p-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[100px] sm:min-w-[110px]"
                                onClick={() => addToCart(product, "retail")}
                              >
                                <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                                  Público
                                </div>
                                <div className="text-base sm:text-lg font-bold">${product.precioPublicoConIVA?.toFixed(2)}</div>
                              </div>
                              <div
                                className="border rounded-md p-2 sm:p-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[100px] sm:min-w-[110px]"
                                onClick={() => addToCart(product, "wholesale")}
                              >
                                <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                                  Mayoreo
                                </div>
                                <div className="text-base sm:text-lg font-bold">
                                  ${product.precioMayoreoConIVA?.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCustomPriceClick(product)}
                              className="w-full h-7 sm:h-8 text-xs"
                              disabled={!hasCustomPrices}
                            >
                              Personalizado
                            </Button>
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

      {/* Cart and Checkout */}
      <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              Carrito ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">El carrito está vacío</div>
            ) : (
              <>
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {cart.map((item, index) => {
                    const priceTypeLabel =
                      item.price_type === "retail"
                        ? "Público"
                        : item.price_type === "wholesale"
                          ? "Mayoreo"
                          : "Personalizado"

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 border rounded text-xs sm:text-sm"
                      >
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                          <div className="flex-1 min-w-0 w-full">
                            <p className="font-medium text-xs sm:text-sm truncate">{item.product.descripcion}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {item.product.unidad} • {priceTypeLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value), saleType || 1)}
                              className="w-12 sm:w-14 h-7 sm:h-8 text-xs"
                            />
                            <span className="text-xs whitespace-nowrap">× ${item.unit_price.toFixed(2)}</span>
                            <p className="font-semibold text-xs sm:text-sm whitespace-nowrap min-w-[50px] sm:min-w-[60px] text-right">
                              ${(item.unit_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-base sm:text-lg font-semibold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Tipo de Venta</Label>
                  <Select value={saleType} onValueChange={(value: any) => setSaleType(value)}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remision">Remisión</SelectItem>
                      <SelectItem value="credito">Venta a Crédito</SelectItem>
                      <SelectItem value="cotizacion">Cotización</SelectItem>
                    </SelectContent>
                  </Select>
                  {saleType === "remision" && (
                    <p className="text-xs text-muted-foreground">Se cobra y descuenta del inventario</p>
                  )}
                  {saleType === "credito" && (
                    <p className="text-xs text-muted-foreground">
                      Se descuenta del inventario. Requiere confirmación de pago posterior.
                    </p>
                  )}
                  {saleType === "cotizacion" && (
                    <p className="text-xs text-muted-foreground">No se cobra ni descuenta del inventario</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-xs sm:text-sm">
                    Cliente {saleType === "credito" && <span className="text-destructive">*</span>}
                    {saleType === "credito" ? " (obligatorio)" : " (opcional)"}
                  </Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Sin cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {saleType !== "credito" && <SelectItem value="none">Sin cliente</SelectItem>}
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {saleType !== "cotizacion" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payment" className="text-xs sm:text-sm">
                        Pago Recibido
                      </Label>
                      <Input
                        id="payment"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={paymentReceived}
                        onChange={(e) => setPaymentReceived(e.target.value)}
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>

                    {paymentReceived && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Cambio:</span>
                        <span className={change < 0 ? "text-destructive font-semibold" : "font-semibold"}>
                          ${change.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <Button
                  className="w-full text-sm sm:text-base h-10 sm:h-11"
                  onClick={processSale}
                  disabled={
                    isProcessing ||
                    (saleType === "remision" && change < 0) || // Only validate payment for remision, not credito
                    (saleType === "credito" && selectedCustomer === "none")
                  }
                >
                  {isProcessing
                    ? "Procesando..."
                    : saleType === "remision"
                      ? "Completar Venta"
                      : saleType === "credito"
                        ? "Registrar Venta a Crédito"
                        : "Generar Cotización"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        showEditButton={false}
      />

      {selectedProductForCustomPrice && (
        <Dialog open={customPriceDialogOpen} onOpenChange={setCustomPriceDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar Precio Personalizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Producto: <span className="font-medium">{selectedProductForCustomPrice.descripcion}</span>
              </p>
              <div className="space-y-2">
                {Object.entries(productCustomPrices[selectedProductForCustomPrice._id] || {}).map(([name, price]) => (
                  <Button
                    key={name}
                    variant="outline"
                    className="w-full justify-between bg-transparent"
                    onClick={() => {
                      addToCart(selectedProductForCustomPrice, "custom", Number(price))
                      setCustomPriceDialogOpen(false)
                      setSelectedProductForCustomPrice(null)
                    }}
                  >
                    <span>{name}</span>
                    <span className="font-semibold">${Number(price).toFixed(2)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Dialog open={showReceipt} onOpenChange={closeReceipt}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center">Venta Completada</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="text-center space-y-2 p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">${receiptData.total_amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total de la venta</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(receiptData.sale_date).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sucursal</p>
                  <p className="font-medium">{receiptData.branch.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{receiptData.customer?.name || "Cliente General"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptData.sale_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium wrap-break-word whitespace-normal w-44">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product.truper_code}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">${receiptData.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pago recibido:</span>
                  <span className="font-semibold">${receiptData.payment_received.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cambio:</span>
                  <span className="font-semibold text-emerald-600">${receiptData.change_given.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => openSaleReceiptPDFForPrint(receiptData)}
                  className="w-full bg-transparent"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button className="w-full" size="lg" onClick={closeReceipt}>
                  Nueva Venta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
