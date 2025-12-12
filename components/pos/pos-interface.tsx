"use client"

import { useState, useEffect, useRef } from "react"
import type { Branch, CartItem, Customer, InventoryProduct, SaleReceipt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ShoppingCart, Trash2, FileText, Check, Barcode, Plus, Package, Notebook, FileCheck, CreditCard, Filter } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductDetailsModal } from "@/components/products/product-details-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { openSaleReceiptPDFForPrint } from "@/lib/pdf-generator"
import { searchInventoryProducts } from "@/app/actions/inventoryProducts/get-inventory-products"
import { getCustomers } from "@/app/actions/customers/get-customers"
import { processProductsSale } from "@/app/actions/sales/process-products-sale"
import { getQuoteSales } from "@/app/actions/sales/get-quote-sales"
import { useSession } from "next-auth/react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProductByEAN } from "@/app/actions/inventoryProducts/get-product-by-ean"
import { Clipboard } from "lucide-react"
import { cn } from "@/lib/utils"


// Definir tipos
type SaleType = "remision" | "credito" | "cotizacion"

// Configuración de opciones
const SALE_TYPE_OPTIONS: Array<{
  value: SaleType
  label: string
  description: string
}> = [
    {
      value: "remision",
      label: "Remisión",
      description: "Se cobra y descuenta del inventario",
    },
    {
      value: "credito",
      label: "Venta a Crédito",
      description: "Se descuenta del inventario. Requiere confirmación de pago posterior.",
    },
    {
      value: "cotizacion",
      label: "Cotización",
      description: "No se cobra ni descuenta del inventario",
    },
  ]

interface POSInterfaceProps {
  branches: Branch[]
  userId: string
  userBranchId: string | null
  allowBranchChange?: boolean
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
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [advancedSearchTerm, setAdvancedSearchTerm] = useState("")
  const [advancedSearchResults, setAdvancedSearchResults] = useState<InventoryProduct[]>([])
  const [advancedSearching, setAdvancedSearching] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [notFoundInAdvancedSearch, setNotFoundInAdvancedSearch] = useState(false)

  const [customerSearchValue, setCustomerSearchValue] = useState("Público en general")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerInputRef = useRef<HTMLDivElement>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const initialLoadDone = useRef(false)
  const { data: session } = useSession()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    console.log("Propiedades recibidas: ", { branches, userId, userBranchId, allowBranchChange })
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
        ; (async () => {
          setIsInitialLoading(true)
          // Solo cargar clientes al inicio; los productos se cargan bajo demanda
          await loadCustomers()
          setIsInitialLoading(false)
        })()
    }
  }, [])

  useEffect(() => {
    console.log("Advanced search results updated:", advancedSearchResults)

  }, [advancedSearchResults])


  // Los productos se cargan bajo demanda, no necesitamos estos efectos al inicio
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search)
  //   const convertQuoteId = urlParams.get("convertQuote")
  //   if (!products.length || !convertQuoteId) return
  //   if (convertQuoteId) {
  //     loadQuoteForConversion(convertQuoteId)
  //   }
  // }, [products])

  // useEffect(() => {
  //   if (!products.length) return
  //   loadAllCustomPrices()
  // }, [products])

  {/*const loadProducts = async () => {
    try {
      const branchesNames = branches.map((branch) => branch.name)
      console.time("loadProducts")
      const { data, error } = await getInventoryProducts(branchesNames)
      console.timeEnd("loadProducts")
      if (error || !data) {
        console.error("Error al cargar usuarios:", error)
        return
      }
      setProducts(data)
    } catch (error) {
      console.error(error)
    }
  }*/}

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
    const pricesMap: Record<string, Record<string, number>> = {}
    products.forEach((product: any) => {
      if (product.customPrices && product.customPrices.length > 0) {
        pricesMap[product._id] = {}
        product.customPrices.forEach((customPrice: any) => {
          pricesMap[product._id][customPrice.price_name] = customPrice.price_value
        })
      }
    })
    setProductCustomPrices(pricesMap)
  }

  useEffect(() => {
    onSaleTypeChange()
  }, [saleType])

  const onSaleTypeChange = () => {
    const cartToCheck = [...cart]
    const checkedCart = cartToCheck.map((item) => {
      let quantity = item.quantity
      if (item.quantity > item.product.cantidad) quantity = item.product.cantidad
      return {
        ...item,
        quantity,
      }
    })
    setCart(checkedCart)
  }


  const addToCart = (
    product: InventoryProduct,
    priceType: "retail" | "wholesale" | "custom",
    customPrice?: number
  ) => {
    const existingItem = cart.find(
      (item) =>
        item.product.codigo === product.codigo &&
        item.price_type === priceType
    )

    let unitPrice = product.precioPublicoConIVA
    if (priceType === "wholesale") unitPrice = product.precioMayoreoConIVA
    if (priceType === "custom" && customPrice) unitPrice = customPrice

    const stock = product.cantidad ?? 0

    // ❌ Sin inventario
    if (stock <= 0) {
      toast.error("Este producto no tiene inventario disponible")
      return
    }

    // 🛒 Producto ya en carrito
    if (existingItem) {
      if (existingItem.quantity >= stock) {
        toast.error("No hay más unidades en inventario")
        return
      }

      setCart(
        cart.map((item) =>
          item.product.codigo === product.codigo &&
            item.price_type === priceType
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )

      // ✔ Mostrar el toast aunque ya estuviera en el carrito
      toast.success("Producto agregado al carrito")
      return
    }

    // 🆕 Producto nuevo en carrito
    setCart([
      ...cart,
      {
        product,
        quantity: 1,
        unit_price: unitPrice,
        price_type: priceType,
      },
    ])

    // ✔ Misma alerta para producto nuevo
    toast.success("Producto agregado al carrito")
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
          alert(
            `La cantidad del producto ${item.product.descripcion} excede la cantidad en existencia que es: ${item.product.cantidad}`,
          )
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
        payment_status:
          saleType === "credito"
            ? "pending"
            : saleType === "cotizacion"
              ? "pending"
              : ("paid" as "pending" | "confirmed" | "paid"),
        parent_sale_id: parentQuoteId || null,
        cart,
        created_by_user: session?.user?.username,
      }

      const { data: saleData, error: saleError } = await processProductsSale(sale)
      if (saleError) throw saleError
      if (!saleData) {
        throw new Error("No se obtuvieron los datos de la venta")
      }

      const saleItems = saleData.sale_items.map((saleItem) => {
        const product = products.find((product) => product.codigo.toString() === saleItem.product_code)
        return {
          ...saleItem,
          product: {
            name: product?.descripcion ?? "",
            truper_code: (product?.codigo ?? "").toString(),
            brand: product?.marca ?? "",
          },
        }
      })

      const saleReceipt: SaleReceipt = {
        ...saleData,
        sale_items: saleItems,
      }

      setReceiptData(saleReceipt)
      setLastSaleId(saleData.id)
      setShowReceipt(true)
      setCart([])
      setSelectedCustomer("none")
      setCustomerSearchValue("Público en general") // Reset to default
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
    //loadProducts()
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
        const product = products.find((p) => p.codigo === item.product_code)
        if (!product) {
          skippedProducts += `, ${item.product_code}`
          return acc
        }
        acc.push({
          product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          price_type: "custom",
        })
        return acc
      }, [])

      setCart(cartItems)
      if (data.customer_id) {
        setSelectedCustomer(data.customer_id)
        const customer = customers.find((c) => c.id === data.customer_id)
        if (customer) {
          setCustomerSearchValue(customer.name)
        }
      }
      if (data.branch_id) {
        setBranchId(data.branch_id)
      }
      if (skippedProducts !== "") {
        alert(
          `Cotización cargada sin los siguientes productos${skippedProducts}. Selecciona el tipo de venta y completa la transacción.`,
        )
      } else {
        alert("Cotización completamente cargada. Selecciona el tipo de venta y completa la transacción.")
      }
    } catch (error) {
      console.error("Error loading quote:", error)
      alert("Error al cargar la cotización")
    }
  }


  // Filtrar clientes: si el valor de búsqueda es vacío o "Público en general", mostrar todos
  const filteredCustomers =
    !customerSearchValue || customerSearchValue === "Público en general"
      ? customers
      : customers.filter((customer) => customer.name.toLowerCase().includes(customerSearchValue.toLowerCase()))

  const uniqueBrands = [...new Set(products.map((p) => p.marca).filter(Boolean))] as string[]
  const uniqueFamilyDescriptions = [...new Set(products.map((p) => p.descripcionFamilia).filter(Boolean))] as string[]

  const total = calculateTotal()
  const change = calculateChange()

  const performAdvancedSearch = async () => {
    const term = advancedSearchTerm.trim();
    if (!term) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }

    setAdvancedSearching(true);
    setNotFoundInAdvancedSearch(false);

    try {
      const selectedBranchName = branches.find(b => b.id === branchId)?.name;
      if (!selectedBranchName) {
        toast.error("No se pudo determinar la sucursal seleccionada");
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
        return;
      }

      // Llamada a la función que ya filtra por término en la base de datos
      const { data, error } = await searchInventoryProducts(selectedBranchName, term);
      console.log("Resultados de búsqueda avanzada:", data);

      if (error) {
        toast.error("Error al buscar productos");
        return;
      }

      // Aplicar filtros adicionales en el frontend (marca y familia)
      const filtered = data.filter((product: InventoryProduct) => {
        const matchesBrand = brandFilter === "all" || product.marca === brandFilter;
        const matchesLine = familyDescriptionFilter === "all" || product.descripcionFamilia === familyDescriptionFilter;
        return matchesBrand && matchesLine;
      });

      console.log("Resultados después de aplicar filtros adicionales:", filtered);

      setAdvancedSearchResults(filtered);

      if (filtered.length === 0) {
        setNotFoundInAdvancedSearch(true);
        toast.error("No se encontraron productos con los criterios de búsqueda");
      } else {
        setNotFoundInAdvancedSearch(false);
        toast.success(`${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error("Error en búsqueda avanzada:", err);
      toast.error("Error en la búsqueda");
    } finally {
      setAdvancedSearching(false);
    }
  };

  const handleQuickAdd = async () => {
    const q = searchTerm.trim()
    if (!q) {
      toast.error("Ingresa el codigo de barras para buscar")
      // 👇 ENFOCAR INMEDIATAMENTE
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
      return
    }

    const selectedBranchName = branches.find(b => b.id === branchId)?.name
    if (!selectedBranchName) {
      toast.error("No se pudo determinar la sucursal seleccionada")
      // 👇 ENFOCAR INMEDIATAMENTE
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
      return
    }

    setIsSearching(true)
    try {
      const { data: product, error } = await getProductByEAN(q, selectedBranchName)
      console.log("Producto obtenido por EAN:", product)

      if (error || !product) {
        toast.error(error || "No se encontró el producto")
        setSearchTerm("")
        setIsSearching(false) // 👈 IMPORTANTE: Cambiar estado ANTES de enfocar

        // 👇 ENFOCAR DESPUÉS DE LIMPIAR TODO
        requestAnimationFrame(() => {
          searchInputRef.current?.focus()
          searchInputRef.current?.select() // 👈 TAMBIÉN SELECCIONAR TODO EL TEXTO
        })
        return
      }

      addToCart(product, "retail")
      setSearchTerm("")
      setIsSearching(false) // 👈 IMPORTANTE: Cambiar estado ANTES de enfocar

      // 👇 ENFOCAR DESPUÉS DE AGREGAR AL CARRITO
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select() // 👈 SELECCIONAR TODO EL TEXTO
      })

    } catch (err) {
      console.error("Error al buscar producto:", err)
      toast.error("Error al buscar producto. Intenta de nuevo.")
      setSearchTerm("")
      setIsSearching(false) // 👈 IMPORTANTE: Cambiar estado ANTES de enfocar

      // 👇 ENFOCAR DESPUÉS DEL ERROR
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      })
    }
    // 👇 ELIMINAR el finally ya que manejamos isSearching arriba
  }



  const handleAdvancedSearchClose = (open: boolean) => {
    if (!open) {
      setAdvancedSearchTerm("")
      setAdvancedSearchResults([])
      setAdvancedSearchOpen(false)
      setNotFoundInAdvancedSearch(false)
    }
  }

  const clearCart = () => {
    setCart([])                  // Vacía los productos
    setPaymentReceived("")       // Limpia el pago recibido
    setSelectedCustomer("none")  // Resetea cliente si aplica
    setSaleType("remision")      // Regresa al tipo inicial (si es lo que usas)
  };


  if (isInitialLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3 p-2 sm:p-4">
        {/* Panel principal - Izquierda */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tipo de documento */}
          <Card className="gap-0">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="relative">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escanear producto */}
          <Card className="gap-0">
            <CardHeader className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <Skeleton className="h-6 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Carrito skeleton */}
              <Card>
                <CardHeader className="p-4">
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3 p-4">

                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Panel de resumen - Derecha */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Total */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>

                {/* Pago recibido */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Cambio */}
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>

                {/* Botones */}
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-10 w-full" />

                {/* Stats */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    )
  }
  return (

    <div className="grid gap-6 lg:grid-cols-3">
      {/* Panel principal */}
      <div className="lg:col-span-2 space-y-4">

        <Card className="gap-0 sm:pt-0">
          <CardHeader className="p-3 sm:p-6 gap-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tipo de documento
            </CardTitle>
          </CardHeader>

          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {/* Tipo de venta */}
            <div className="mb-3 sm:mb-4">
              <Label className="text-xs sm:text-sm mb-2 block">
                Tipo de venta
              </Label>

              {/* TABS - Versión compacta para móvil (sm) */}
              <div className="sm:hidden">
                <Tabs value={saleType} onValueChange={(v) => setSaleType(v as SaleType)}>
                  <TabsList className="grid grid-cols-3 w-full h-auto min-h-[2.5rem] p-1 gap-1">
                    <TabsTrigger
                      value="remision"
                      className="flex flex-col items-center justify-center py-2 px-1 text-xs h-auto min-h-[2.5rem]"
                    >
                      <FileCheck className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[10px] leading-tight">Nota de venta</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="credito"
                      className="flex flex-col items-center justify-center py-2 px-1 text-xs h-auto min-h-[2.5rem]"
                    >
                      <CreditCard className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[10px] leading-tight">Nota de crédito</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="cotizacion"
                      className="flex flex-col items-center justify-center py-2 px-1 text-xs h-auto min-h-[2.5rem]"
                    >
                      <FileText className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[10px] leading-tight">Cotización</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* TABS - Versión original para sm y más grandes */}
              <div className="hidden sm:block">
                <Tabs value={saleType} onValueChange={(v) => setSaleType(v as SaleType)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="remision"
                      className="flex items-center gap-2 text-sm"
                    >
                      <FileCheck className="w-4 h-4" />
                      Nota de venta
                    </TabsTrigger>

                    <TabsTrigger
                      value="credito"
                      className="flex items-center gap-2 text-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Nota de Crédito
                    </TabsTrigger>

                    <TabsTrigger
                      value="cotizacion"
                      className="flex items-center gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Cotización
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* DESCRIPCIÓN */}
              {saleType && (
                <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground leading-tight sm:leading-normal">
                  {SALE_TYPE_OPTIONS.find((opt) => opt.value === saleType)?.description}
                </p>
              )}
            </div>

            {/* SELECTOR DE CLIENTE */}
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-xs sm:text-sm">
                Cliente {saleType === "credito" && <span className="text-destructive">*</span>}
                {saleType === "credito" && (
                  <span className="text-xs text-muted-foreground ml-1">(requerido)</span>
                )}
              </Label>

              <div className="relative" ref={customerInputRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer"
                    type="text"
                    placeholder="Buscar cliente..."
                    value={customerSearchValue}
                    onChange={(e) => {
                      setCustomerSearchValue(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                {/* DROPDOWN */}
                {showCustomerDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-muted-foreground font-medium border-b">
                      Clientes
                    </div>

                    {/* PÚBLICO EN GENERAL (solo si NO es crédito) */}
                    {saleType !== "credito" && (
                      <div
                        className="flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => {
                          setSelectedCustomer("none");
                          setCustomerSearchValue("Público en general");
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
                            PG
                          </div>
                          <span>Público en general</span>
                        </div>

                        {selectedCustomer === "none" && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    )}

                    {/* CLIENTES FILTRADOS */}
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => {
                            setSelectedCustomer(customer.id);
                            setCustomerSearchValue(customer.name);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
                              {customer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.name}</span>
                            </div>
                          </div>

                          {selectedCustomer === customer.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))
                    ) : customerSearchValue &&
                      customerSearchValue !== "Público en general" ? (
                      <div className="px-3 py-2 text-xs sm:text-sm text-muted-foreground">
                        No se encontró el cliente
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>



        <Card className="gap-0 sm:pt-0">
          <CardHeader className="p-3 sm:p-6  gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Escanear Producto
              </CardTitle>              <div className="flex items-center gap-2 w-full sm:w-auto">
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
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 sm:pt-0 sm:pb-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleQuickAdd()
              }}
              className="flex flex-col md:flex-row gap-2 md:gap-3"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 md:h-4 md:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Escanee o ingrese código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isSearching}
                    className="pl-8 md:pl-9 h-9 md:h-10 text-xs md:text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  type="submit"
                  className="h-9 md:h-10 text-xs md:text-sm bg-[var(--chart-2)] hover:bg-[var(--chart-2)] text-white flex-1 md:flex-initial"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setAdvancedSearchOpen(true)}
                  type="button"
                  className="h-9 md:h-10 text-xs md:text-sm bg-[var(--chart-2)] hover:bg-[var(--chart-2)] text-white flex items-center gap-2 flex-1 md:flex-initial"
                >
                  <Filter className="h-4 w-4" />
                  Búsqueda avanzada
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 opacity-40" />
                  <p className="text-sm sm:text-base mt-3">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  {/* Cards para móvil y tablet (hasta lg) */}
                  <div className="lg:hidden space-y-2 max-h-64 overflow-y-auto">
                    {cart.map((item, index) => {
                      // Función para obtener el nombre del precio actual
                      const getCurrentPriceName = (): string => {
                        if (item.price_type === 'custom' && item.product.customPrices) {
                          const customPrice = item.product.customPrices.find(
                            (cp: any) => cp.price_value === item.unit_price
                          );
                          if (customPrice) {
                            return customPrice.price_name.charAt(0).toUpperCase() + customPrice.price_name.slice(1);
                          }
                        }
                        if (item.unit_price === item.product.precioPublicoConIVA) return 'Público con IVA';
                        if (item.unit_price === item.product.precioMayoreoConIVA) return 'Mayoreo con IVA';
                        if (item.unit_price === item.product.precioDistribuidorConIVA) return 'Distribuidor con IVA';
                        if (item.unit_price === item.product.precioMedioMayoreoConIVA) return 'Medio Mayoreo con IVA';
                        if (item.unit_price === item.product.precioPublicoSinIVA) return 'Público sin IVA';
                        if (item.unit_price === item.product.precioMayoreoSinIVA) return 'Mayoreo sin IVA';
                        if (item.unit_price === item.product.precioDistribuidorSinIVA) return 'Distribuidor sin IVA';
                        if (item.unit_price === item.product.precioMedioMayoreoSinIVA) return 'Medio Mayoreo sin IVA';
                        if (item.unit_price === item.product.precioMinimoDeVenta) return 'Precio Mínimo';
                        return 'Personalizado';
                      };

                      // Construir opciones de precio para el select
                      const priceOptions: { value: string; label: string; price: number }[] = [];

                      // Precios con IVA
                      if (item.product.precioPublicoConIVA)
                        priceOptions.push({ value: 'publico_iva', label: 'Público con IVA', price: item.product.precioPublicoConIVA });
                      if (item.product.precioMayoreoConIVA)
                        priceOptions.push({ value: 'mayoreo_iva', label: 'Mayoreo con IVA', price: item.product.precioMayoreoConIVA });
                      if (item.product.precioDistribuidorConIVA)
                        priceOptions.push({ value: 'distribuidor_iva', label: 'Distribuidor con IVA', price: item.product.precioDistribuidorConIVA });
                      if (item.product.precioMedioMayoreoConIVA)
                        priceOptions.push({ value: 'medio_mayoreo_iva', label: 'Medio Mayoreo con IVA', price: item.product.precioMedioMayoreoConIVA });

                      // Precios sin IVA
                      if (item.product.precioPublicoSinIVA)
                        priceOptions.push({ value: 'publico_sin_iva', label: 'Público sin IVA', price: item.product.precioPublicoSinIVA });
                      if (item.product.precioMayoreoSinIVA)
                        priceOptions.push({ value: 'mayoreo_sin_iva', label: 'Mayoreo sin IVA', price: item.product.precioMayoreoSinIVA });
                      if (item.product.precioDistribuidorSinIVA)
                        priceOptions.push({ value: 'distribuidor_sin_iva', label: 'Distribuidor sin IVA', price: item.product.precioDistribuidorSinIVA });
                      if (item.product.precioMedioMayoreoSinIVA)
                        priceOptions.push({ value: 'medio_mayoreo_sin_iva', label: 'Medio Mayoreo sin IVA', price: item.product.precioMedioMayoreoSinIVA });

                      // Precio mínimo
                      if (item.product.precioMinimoDeVenta)
                        priceOptions.push({ value: 'precio_minimo', label: 'Precio mínimo', price: item.product.precioMinimoDeVenta });

                      // Precios personalizados
                      if (item.product.customPrices && item.product.customPrices.length > 0) {
                        item.product.customPrices.forEach((cp: any) => {
                          priceOptions.push({
                            value: `custom_${cp.price_name}`,
                            label: cp.price_name.charAt(0).toUpperCase() + cp.price_name.slice(1),
                            price: cp.price_value
                          });
                        });
                      }

                      // Determinar valor actual del select
                      const currentSelectValue =
                        item.price_type === 'custom' && item.product.customPrices
                          ? `custom_${item.product.customPrices.find((cp: any) => cp.price_value === item.unit_price)?.price_name || ''}`
                          : item.price_type;

                      return (
                        <div key={index} className="border rounded-lg p-3 space-y-2 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">{item.product.descripcion}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.product.unidad} • {getCurrentPriceName()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={() => removeFromCart(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Cantidad:</span>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, Number(e.target.value), saleType || 1)}
                                className="w-14 h-7 text-xs"
                              />
                              <span className="text-xs text-muted-foreground">× ${item.unit_price.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Subtotal</p>
                              <p className="font-bold text-sm">
                                ${(item.unit_price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Select de precios para versión móvil */}
                          <div className="pt-2">
                            <Select
                              value={currentSelectValue}
                              onValueChange={(value) => {
                                const updated = [...cart];
                                const selectedPrice = priceOptions.find(p => p.value === value);
                                if (selectedPrice) {
                                  updated[index].unit_price = selectedPrice.price;
                                  updated[index].price_type = value.startsWith('custom_') ? 'custom' : value;
                                }
                                setCart(updated);
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue>
                                  <span className="truncate">{getCurrentPriceName()}</span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {priceOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-xs">
                                    <div className="flex justify-between items-center w-full">
                                      <span className="truncate mr-2">{option.label}</span>
                                      <span className="font-semibold whitespace-nowrap">${option.price.toFixed(2)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabla solo para lg y más grandes */}
                  <div className="hidden lg:block border rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        {/* HEADER */}
                        <TableHeader
                          className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}
                        >
                          <TableRow>
                            <TableHead className="font-semibold text-foreground ">Producto</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Cantidad</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Precio Unit.</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Subtotal</TableHead>
                            <TableHead className="font-semibold text-foreground text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item, index) => {
                            // Función para obtener el nombre del precio actual
                            const getCurrentPriceName = (): string => {
                              if (item.price_type === 'custom' && item.product.customPrices) {
                                const customPrice = item.product.customPrices.find(
                                  (cp: any) => cp.price_value === item.unit_price
                                );
                                if (customPrice) {
                                  return customPrice.price_name.charAt(0).toUpperCase() + customPrice.price_name.slice(1);
                                }
                              }
                              if (item.unit_price === item.product.precioPublicoConIVA) return 'Público con IVA';
                              if (item.unit_price === item.product.precioMayoreoConIVA) return 'Mayoreo con IVA';
                              if (item.unit_price === item.product.precioDistribuidorConIVA) return 'Distribuidor con IVA';
                              if (item.unit_price === item.product.precioMedioMayoreoConIVA) return 'Medio Mayoreo con IVA';
                              if (item.unit_price === item.product.precioPublicoSinIVA) return 'Público sin IVA';
                              if (item.unit_price === item.product.precioMayoreoSinIVA) return 'Mayoreo sin IVA';
                              if (item.unit_price === item.product.precioDistribuidorSinIVA) return 'Distribuidor sin IVA';
                              if (item.unit_price === item.product.precioMedioMayoreoSinIVA) return 'Medio Mayoreo sin IVA';
                              if (item.unit_price === item.product.precioMinimoDeVenta) return 'Precio Mínimo';
                              return 'Personalizado';
                            };

                            // Construir opciones de precio para el select
                            const priceOptions: { value: string; label: string; price: number }[] = [];

                            // Precios con IVA
                            if (item.product.precioPublicoConIVA)
                              priceOptions.push({ value: 'publico_iva', label: 'Público con IVA', price: item.product.precioPublicoConIVA });
                            if (item.product.precioMayoreoConIVA)
                              priceOptions.push({ value: 'mayoreo_iva', label: 'Mayoreo con IVA', price: item.product.precioMayoreoConIVA });
                            if (item.product.precioDistribuidorConIVA)
                              priceOptions.push({ value: 'distribuidor_iva', label: 'Distribuidor con IVA', price: item.product.precioDistribuidorConIVA });
                            if (item.product.precioMedioMayoreoConIVA)
                              priceOptions.push({ value: 'medio_mayoreo_iva', label: 'Medio Mayoreo con IVA', price: item.product.precioMedioMayoreoConIVA });

                            // Precios sin IVA
                            if (item.product.precioPublicoSinIVA)
                              priceOptions.push({ value: 'publico_sin_iva', label: 'Público sin IVA', price: item.product.precioPublicoSinIVA });
                            if (item.product.precioMayoreoSinIVA)
                              priceOptions.push({ value: 'mayoreo_sin_iva', label: 'Mayoreo sin IVA', price: item.product.precioMayoreoSinIVA });
                            if (item.product.precioDistribuidorSinIVA)
                              priceOptions.push({ value: 'distribuidor_sin_iva', label: 'Distribuidor sin IVA', price: item.product.precioDistribuidorSinIVA });
                            if (item.product.precioMedioMayoreoSinIVA)
                              priceOptions.push({ value: 'medio_mayoreo_sin_iva', label: 'Medio Mayoreo sin IVA', price: item.product.precioMedioMayoreoSinIVA });

                            // Precio mínimo
                            if (item.product.precioMinimoDeVenta)
                              priceOptions.push({ value: 'precio_minimo', label: 'Precio mínimo', price: item.product.precioMinimoDeVenta });

                            // Precios personalizados
                            if (item.product.customPrices && item.product.customPrices.length > 0) {
                              item.product.customPrices.forEach((cp: any) => {
                                priceOptions.push({
                                  value: `custom_${cp.price_name}`,
                                  label: cp.price_name.charAt(0).toUpperCase() + cp.price_name.slice(1),
                                  price: cp.price_value
                                });
                              });
                            }

                            // Determinar valor actual del select
                            const currentSelectValue =
                              item.price_type === 'custom' && item.product.customPrices
                                ? `custom_${item.product.customPrices.find((cp: any) => cp.price_value === item.unit_price)?.price_name || ''}`
                                : item.price_type;

                            return (
                              <TableRow key={index} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm leading-tight">{item.product.descripcion}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.unidad}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(index, Number(e.target.value), saleType || 1)}
                                    className="w-16 h-8 text-xs text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  ${item.unit_price.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  ${(item.unit_price * item.quantity).toFixed(2)}
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center justify-center gap-2">
                                    <Select
                                      value={currentSelectValue}
                                      onValueChange={(value) => {
                                        const updated = [...cart];
                                        const selectedPrice = priceOptions.find(p => p.value === value);
                                        if (selectedPrice) {
                                          updated[index].unit_price = selectedPrice.price;
                                          updated[index].price_type = value.startsWith('custom_') ? 'custom' : value;
                                        }
                                        setCart(updated);
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs min-w-[140px]">
                                        <SelectValue>
                                          <span className="truncate">{getCurrentPriceName()}</span>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {priceOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value} className="text-xs">
                                            <div className="flex justify-between items-center w-full">
                                              <span className="truncate mr-2">{option.label}</span>
                                              <span className="font-semibold whitespace-nowrap">${option.price.toFixed(2)}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeFromCart(index)}
                                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>

          </CardContent>
        </Card>
      </div>



      {/* Panel de resumen */}
      <div className="space-y-4">

        {/* Moved Cart: formerly in the right column — now inside this card */}
        <div className="space-y-3 sm:space-y-4">
          <Card className="gap-0">
            <CardHeader className="pb-3 pl-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Notebook className="h-4 w-4 sm:h-5 sm:w-5" />
                Resumen
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:p-6">
              {cart.length === 0 ? (
                /* Carrito vacío */
                <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-muted-foreground">
                  <Clipboard className="h-8 w-8 sm:h-10 sm:w-10 opacity-40" />
                  <p className="text-sm sm:text-base mt-2 text-center">Agrega productos para ver un resumen aquí</p>

                </div>

              ) : (
                <>
                  {/* TOTAL */}
                  <div className="space-y-2">
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* PAGO (solo si no es cotización) */}
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
                          <span
                            className={
                              change < 0
                                ? "text-destructive font-semibold"
                                : "font-semibold"
                            }
                          >
                            ${change.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* BOTÓN PRINCIPAL */}
                  <Button
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    onClick={processSale}
                    disabled={
                      isProcessing ||
                      (saleType === "remision" && change < 0) ||
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

                  {/* BOTÓN LIMPIAR */}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-background hover:text-black"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Limpiar
                  </Button>

                  {/* STATS — Productos y unidades */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Productos:</span>
                        <span className="font-semibold text-foreground">
                          {cart.length}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Unidades:</span>
                        <span className="font-semibold text-foreground">
                          {cart.reduce((sum, p) => sum + p.quantity, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        showEditButton={false}
      />

      {/* Búsqueda avanzada Modal */}
      <Dialog open={advancedSearchOpen} onOpenChange={handleAdvancedSearchClose}>
        <DialogContent className="w-full max-w-6xl lg:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Búsqueda avanzada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <form
              className="flex gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault(); // evita que la página se recargue
                performAdvancedSearch();
              }}
            >
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre, código o barras..."
                  value={advancedSearchTerm}
                  onChange={(e) => setAdvancedSearchTerm(e.target.value)}
                />
              </div>

              <Button
                type="submit" // importante para que el form lo active
                disabled={advancedSearching}
                className="h-9"
              >
                {advancedSearching ? "Buscando..." : "Buscar"}
              </Button>

              <div className="w-48">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full h-9">
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
              </div>

              <div className="w-48">
                <Select value={familyDescriptionFilter} onValueChange={setFamilyDescriptionFilter}>
                  <SelectTrigger className="w-full h-9">
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
            </form>


            <div className="max-h-[60vh] overflow-y-auto border rounded-md">
              {advancedSearchResults.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {advancedSearching ? "Buscando productos..." : "Presiona 'Buscar' para iniciar la búsqueda"}
                </div>
              ) : (
                <div className="divide-y">
                  {advancedSearchResults.map((product) => {
                    const hasCustomPrices = product.customPrices && product.customPrices.length > 0;

                    return (
                      <div
                        key={`${product._id}_adv`}
                        className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleViewDetails(product)}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          {/* Imagen / Avatar */}
                          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-md mx-auto sm:mx-0">
                            <AvatarImage src={product.image_url || undefined} alt={product.descripcion} />
                            <AvatarFallback className="rounded-md text-base sm:text-lg">
                              {product.descripcion?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Información principal */}
                          <div className="flex-1 min-w-0 w-full">
                            <h3 className="font-semibold text-base sm:text-xl text-center sm:text-left">
                              {product.descripcion}
                            </h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-1 text-xs sm:text-sm">
                              {product.codigo && (
                                <span className="text-sm sm:text-base font-bold text-primary">{product.codigo}</span>
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
                            </div>
                          </div>

                          {/* Precios */}
                          <div className="flex flex-col gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-2">
                              {/* Precio público */}
                              <div
                                className="border rounded-md p-2 sm:p-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[100px] sm:min-w-[110px]"
                                onClick={() => addToCart(product, "retail")}
                              >
                                <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                                  Público
                                </div>
                                <div className="text-base sm:text-lg font-bold">
                                  ${product.precioPublicoConIVA?.toFixed(2)}
                                </div>
                              </div>

                              {/* Precio mayoreo */}
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

                            {/* Botón personalizado */}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCustomPriceClick(product)}
                              className="w-full h-7 sm:h-8 text-xs"
                              disabled={!hasCustomPrices}
                            >
                              Personalizado
                            </Button>

                            {/* Opcional: mostrar lista de precios personalizados debajo del botón */}
                            {hasCustomPrices && (
                              <div className="mt-1 space-y-1">
                                {product.customPrices?.map((cp) => (
                                  <div key={cp.price_name} className="text-xs text-muted-foreground">
                                    {cp.price_name}: ${cp.price_value.toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                {selectedProductForCustomPrice.customPrices?.map((cp) => (
                  <Button
                    key={cp.price_name}
                    variant="outline"
                    className="w-full justify-between bg-transparent"
                    onClick={() => {
                      addToCart(selectedProductForCustomPrice, "custom", Number(cp.price_value));
                      setCustomPriceDialogOpen(false);
                      setSelectedProductForCustomPrice(null);
                    }}
                  >
                    <span>{cp.price_name}</span>
                    <span className="font-semibold">${Number(cp.price_value).toFixed(2)}</span>
                  </Button>
                ))}

                {/* Si no hay precios personalizados */}
                {(!selectedProductForCustomPrice.customPrices || selectedProductForCustomPrice.customPrices.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center">No hay precios personalizados disponibles</p>
                )}
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
