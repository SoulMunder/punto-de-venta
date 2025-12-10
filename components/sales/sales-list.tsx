"use client"

import { useState, useEffect } from "react"
import type { Branch, Sale, SaleWithRelations } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Eye, FileText, DollarSign, ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentDialog } from "./payment-dialog"
import { openSaleReceiptPDFForPrint } from "@/lib/pdf-generator"
import { getSales } from "@/app/actions/sales/get-sales"
import { getPaymentsById } from "@/app/actions/payments/get-payments-by-id"
import { DataTablePagination } from "@/components/inventory/data-table-pagination"
import { cn } from "@/lib/utils"

interface SalesListProps {
  branches: Branch[]
  userRole: string
}

export function SalesList({ branches, userRole }: SalesListProps) {
  const [sales, setSales] = useState<SaleWithRelations[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const router = useRouter()

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<SaleWithRelations | null>(null)
  const [salePayments, setSalePayments] = useState<Record<string, number>>({})
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    filterSales()
    setCurrentPage(1) // Reset to first page when filters change
  }, [sales, searchTerm, selectedBranch, saleTypeFilter])

  const loadSales = async () => {
    setIsLoading(true)
    try {
      console.time("→ getSales()")
      const { data: salesData, error: salesError } = await getSales()
      console.timeEnd("→ getSales()")

      if (salesError as string || !salesData) {
        setIsLoading(false)
        throw new Error(`Error al cargar ventas: ${salesError}`)
      }
      console.log("[v0] Sales query result:", { salesData, salesError })

      if (salesData && salesData.length > 0) {
        const creditSaleIds = salesData.filter((s: any) => s.sale_type === "credito").map((s: any) => s.id)
        const { data: paymentsData, error: paymentsError } = await getPaymentsById(creditSaleIds)

        if (paymentsError as string || !paymentsData) {
          setIsLoading(false)
          console.log(`Error al cargar los pagos de creditos: ${paymentsError}`)
        }

        if (paymentsData && paymentsData.length > 0) {
          const paymentsMap: Record<string, number> = {}
          paymentsData.forEach((payment: any) => {
            paymentsMap[payment.sale_id] = (paymentsMap[payment.sale_id] || 0) + payment.amount
          })
          setSalePayments(paymentsMap)
        }
      }

      setSales(salesData)
    } catch (error) {
      console.error("Error al cargar ventas: ", error)
      alert('Error al cargar las ventas')
    } finally {
      setIsLoading(false)
    }
  }

  const getBranchColor = (branchId: string) => {
    // Opción 1: Colores predefinidos basados en el índice de la sucursal
    const branchIndex = branches.findIndex(b => b.id === branchId)
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-indigo-500',
      'bg-teal-500'
    ]
    return colors[branchIndex % colors.length] || 'bg-primary/60'
  }


  const filterSales = () => {
    let filtered = [...sales]

    if (selectedBranch !== "all") {
      filtered = filtered.filter((sale) => sale.branch_id === selectedBranch)
    }

    if (saleTypeFilter !== "all") {
      filtered = filtered.filter((sale) => sale.sale_type === saleTypeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.branch.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredSales(filtered)
  }

  const handleViewDetails = (saleId: string) => {
    router.push(`/admin/sales/${saleId}`)
  }

  const handleConvertToSale = (quoteId: string) => {
    router.push(`/pos?convertQuote=${quoteId}`)
  }

  const handleOpenPaymentDialog = (sale: SaleWithRelations) => {
    setSelectedSaleForPayment(sale)
    setPaymentDialogOpen(true)
  }

  const handlePaymentAdded = () => {
    loadSales() // Reload sales to update payment status
  }

  const getSaleTypeBadge = (saleType: string) => {
    switch (saleType) {
      case "remision":
        return <Badge variant="default">Remisión</Badge>
      case "credito":
        return <Badge variant="secondary">Crédito</Badge>
      case "cotizacion":
        return <Badge variant="outline">Cotización</Badge>
      default:
        return <Badge variant="default">Remisión</Badge>
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge className="bg-emerald-500">Pagado</Badge>
      case "confirmed":
        return <Badge className="bg-blue-500">Confirmado</Badge>
      case "pending":
        return <Badge className="bg-amber-500">Pendiente</Badge>
      default:
        return null
    }
  }

  const handleGeneratePDF = async (sale: SaleWithRelations) => {
    try {
      await openSaleReceiptPDFForPrint(sale as any)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error al generar el PDF")
    }
  }

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSales = filteredSales.slice(startIndex, endIndex)


  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Buscar por cliente o sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />

        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="remision">Remisión</SelectItem>
            <SelectItem value="credito">Crédito</SelectItem>
            <SelectItem value="cotizacion">Cotización</SelectItem>
          </SelectContent>
        </Select>

        {/* 👉 Botones de vista alineados a la derecha */}
        <div className="flex items-center sm:ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="ml-2 h-9 w-9 p-0"
            aria-label="Vista en tarjetas"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="ml-2 h-9 w-9 p-0"
            aria-label="Vista en tabla"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando ventas...</div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay ventas registradas</div>
      ) : viewMode === 'table' ? (
        <>

          <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
            <div style={{ height: "65vh" }}>
              <Table>
                <TableHeader
                  className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}
                >
                  <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                    <TableHead className="font-semibold text-foreground bg-muted">Fecha</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Cliente</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Sucursal</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted text-center">Tipo</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted text-center">Total</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => {
                    const totalPaid = salePayments[sale.id] || 0
                    const isFullyPaid = sale.sale_type === "credito" && totalPaid >= (sale.total_amount || 0)

                    return (
                      <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                        <TableCell className=" text-sm ">
                          {new Date(sale.created_at).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{sale.customer?.name || "Cliente General"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getBranchColor(sale.branch_id)}`} />
                            <span className="text-sm">{sale.branch.name || "Sin definir"}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex gap-2 flex-wrap items-center justify-center">
                            {getSaleTypeBadge(sale.sale_type || "remision")}
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-semibold">${(sale.total_amount || 0).toFixed(2)}</TableCell>

                        <TableCell>
                          <div className="flex gap-1 flex-wrap justify-center">
                            {sale.sale_type === "credito" &&
                              (isFullyPaid ? (
                                <Badge className="bg-emerald-500">Pagado</Badge>
                              ) : (
                                getPaymentStatusBadge(sale.payment_status || "pending")
                              ))}
                            {sale.sale_type !== "credito" && (
                              <Badge variant="outline">
                                {sale.sale_type === "remision" ? "Completada" : "Cotización"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">

                            {/* Ver detalles - azul */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(sale.id)}
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* PDF - rojo */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGeneratePDF(sale)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-colors"
                              title="Generar PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>

                            {/* Registrar pago - verde */}
                            {sale.sale_type === "credito" && !isFullyPaid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPaymentDialog(sale)}
                                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 transition-colors"
                                title="Registrar pago"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Convertir cotización → Venta */}
                            {sale.sale_type === "cotizacion" && (
                              <Badge
                                onClick={() => handleConvertToSale(sale.id)}
                                className="cursor-pointer bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors px-2 py-1"
                              >
                                Convertir
                              </Badge>
                            )}

                          </div>
                        </TableCell>

                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

        </>
      ) : (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSales.map((sale) => {
              const totalPaid = salePayments[sale.id] || 0
              const isFullyPaid = sale.sale_type === "credito" && totalPaid >= (sale.total_amount || 0)

              return (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {new Date(sale.created_at).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{sale.branch.name}</Badge>
                          {getSaleTypeBadge(sale.sale_type || "remision")}
                          {sale.sale_type === "credito" &&
                            (isFullyPaid ? (
                              <Badge className="bg-emerald-500">Pagado</Badge>
                            ) : (
                              getPaymentStatusBadge(sale.payment_status || "pending")
                            ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(sale.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">{sale.customer?.name || "Cliente General"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">${(sale.total_amount || 0).toFixed(2)}</span>
                      </div>
                      {sale.sale_type === "credito" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pagado:</span>
                          <span className="font-semibold">${totalPaid.toFixed(2)}</span>
                        </div>
                      )}
                      {sale.sale_type !== "cotizacion" && sale.sale_type !== "credito" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pagado:</span>
                            <span>${(sale.payment_received || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cambio:</span>
                            <span>${(sale.change_given || 0).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Vendedor:</span>
                        <span className="text-xs">
                          {sale.created_by_profile?.name || sale.created_by_profile?.username || "Usuario"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleGeneratePDF(sale)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver PDF
                      </Button>

                      {sale.sale_type === "credito" && !isFullyPaid && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenPaymentDialog(sale)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pagar
                        </Button>
                      )}

                      {sale.sale_type === "cotizacion" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleConvertToSale(sale.id)}
                        >
                          Convertir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

        </>
      )}

      {selectedSaleForPayment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          saleId={selectedSaleForPayment.id}
          totalAmount={selectedSaleForPayment.total_amount || 0}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={itemsPerPage}
        totalCount={filteredSales.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setItemsPerPage(size)
          setCurrentPage(1)
        }}
        pageSizeOptions={[6, 12, 24, 48, 96]}
      />
    </div>
  )
}
