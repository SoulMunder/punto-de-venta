"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Eye, ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/inventory/data-table-pagination"
import { cn } from "@/lib/utils"

export interface RecipeLog {
  action: "CREATE" | "UPDATE" | "DELETE" | "APPLY"
  user: string
  recipeName?: string
  createdAt: Date
}

export function RecipeMovementsList() {
  const [movements, setMovements] = useState<RecipeLog[]>([])
  const [filteredMovements, setFilteredMovements] = useState<RecipeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const router = useRouter()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  useEffect(() => {
    loadMovements()
  }, [])

  useEffect(() => {
    filterMovements()
    setCurrentPage(1) // Reset to first page when filters change
  }, [movements, searchTerm, actionFilter])

  const loadMovements = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching movements from /api/recipes/movements')
      const response = await fetch('/api/recipes/movements')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error al cargar movimientos: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Movements data received:', result)
      
      // El endpoint devuelve { data: [...], total: N }
      const rawData = result.data || []
      
      const processedMovements = rawData.map((m: any) => ({
        action: m.action,
        user: m.user,
        recipeName: m.recipeName || 'Sin nombre',
        createdAt: new Date(m.createdAt)
      }))
      
      console.log('Processed movements:', processedMovements)
      setMovements(processedMovements)
    } catch (error) {
      console.error("Error al cargar movimientos: ", error)
      alert(`Error al cargar los movimientos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filterMovements = () => {
    let filtered = [...movements]

    if (actionFilter !== "all") {
      filtered = filtered.filter((movement) => movement.action === actionFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (movement) =>
          movement.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.recipeName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredMovements(filtered)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-blue-500">Creada</Badge>
      case "UPDATE":
        return <Badge className="bg-amber-500">Actualizada</Badge>
      case "DELETE":
        return <Badge className="bg-red-500">Eliminada</Badge>
      case "APPLY":
        return <Badge className="bg-emerald-500">Aplicada</Badge>
      default:
        return <Badge variant="default">{action}</Badge>
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return 'bg-blue-500'
      case "UPDATE":
        return 'bg-amber-500'
      case "DELETE":
        return 'bg-red-500'
      case "APPLY":
        return 'bg-emerald-500'
      default:
        return 'bg-primary/60'
    }
  }

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">

        {/* Fila 1 - Buscador */}
        <Input
          placeholder="Buscar por usuario o receta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full lg:max-w-sm"
        />

        {/* Fila 2: Filtro de acción + Botones */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 lg:flex-1 lg:flex-row lg:items-center">

          <div className="w-full sm:flex-1 flex items-center gap-4 lg:flex-1">
            <div className="flex-1">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE">Creada</SelectItem>
                  <SelectItem value="UPDATE">Actualizada</SelectItem>
                  <SelectItem value="DELETE">Eliminada</SelectItem>
                  <SelectItem value="APPLY">Aplicada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-0 lg:ml-auto">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 w-9 p-0"
                aria-label="Vista en tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>

              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-9 w-9 p-0"
                aria-label="Vista en tabla"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando movimientos...</div>
      ) : filteredMovements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay movimientos registrados</div>
      ) : viewMode === 'table' ? (
        <>
          <div className={cn("rounded-lg border bg-card shadow-sm m-0")}>
            <div style={{ height: "65vh", overflowY: "auto" }}>
              <Table>
                <TableHeader
                  className={cn("sticky top-0 z-10", "bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/95")}
                >
                  <TableRow className={cn("border-b bg-muted hover:bg-muted")}>
                    <TableHead className="font-semibold text-foreground bg-muted">Fecha</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Receta</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted">Usuario</TableHead>
                    <TableHead className="font-semibold text-foreground bg-muted text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.map((movement, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                      <TableCell className="text-sm">
                        {movement.createdAt.toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getActionColor(movement.action)}`} />
                          <span className="text-sm">{movement.recipeName || "Sin nombre"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{movement.user}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 flex-wrap items-center justify-center">
                          {getActionBadge(movement.action)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMovements.map((movement, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {movement.createdAt.toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50">
                          <div className={`h-1.5 w-1.5 rounded-full ${getActionColor(movement.action)}`} />
                          <span className="text-xs font-medium truncate">{movement.recipeName || "Sin nombre"}</span>
                        </div>
                        {getActionBadge(movement.action)}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-muted-foreground text-xs">Usuario:</span>
                      <span className="font-medium text-right truncate flex-1">{movement.user}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2 pt-2 border-t">
                      <span className="text-muted-foreground text-xs">Acción:</span>
                      <span className="font-medium text-right">{movement.action}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <DataTablePagination
        currentPage={currentPage}
        entriesPerPage={itemsPerPage}
        totalCount={filteredMovements.length}
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