"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Package, TrendingUp, TrendingDown } from "lucide-react"
import { InventoryLog } from "@/lib/types"
import { Input } from "@/components/ui/input"


export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<InventoryLog[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLog, setSelectedLog] = useState<InventoryLog | null>(null)



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm")
  }

  const totalEntradas = logs.filter((log) => log.tipo === "Entrada").reduce((acc, log) => acc + log.cantidad, 0)
  const totalSalidas = Math.abs(logs.filter((log) => log.tipo === "Salida").reduce((acc, log) => acc + log.cantidad, 0))

  // Cargar logs desde la API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/inventory/logs")
        if (!res.ok) throw new Error("Error al cargar los registros")
        const data = await res.json()
        setLogs(data)
        setFilteredLogs(data)
      } catch (err: any) {
        console.error("Error fetching logs:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  // Filtrado (excepto createdAt)
  useEffect(() => {
    const term = search.toLowerCase()

    const result = logs.filter((log) => {
      return (
        log.codigo.toString().includes(term) ||
        log.tipo.toLowerCase().includes(term) ||
        log.motivo.toLowerCase().includes(term) ||
        log.createdBy.toLowerCase().includes(term) ||
        log.cantidad.toString().includes(term)
      )
    })

    setFilteredLogs(result)
  }, [search, logs])


  return (
    <div className=" bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        {/* Header + Search Side by Side */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance text-foreground">
              Historial de Inventario
            </h1>
            <p className="text-muted-foreground">
              Visualiza y gestiona todos los movimientos del inventario
            </p>
          </div>

          {/* Search input */}
          <div className="w-full max-w-sm">
            <Input
              placeholder="Buscar por código, motivo, tipo o usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>



        {/* Stats Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[80px] mb-2" />
                  <Skeleton className="h-3 w-[140px]" />
                </CardContent>
              </Card>
            ))}

          </div>

        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <p className="text-xs text-muted-foreground">movimientos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">+{totalEntradas}</div>
                <p className="text-xs text-muted-foreground">unidades agregadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salidas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">-{totalSalidas}</div>
                <p className="text-xs text-muted-foreground">unidades retiradas</p>
              </CardContent>
            </Card>
          </div>
        )}



        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Movimientos</CardTitle>
            <CardDescription>Historial detallado de todas las transacciones de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead >Cantidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Usuario</TableHead>
                      {/*<TableHead className="text-center">Acción</TableHead>*/}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className=" text-sm text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className=" font-medium">{log.codigo}</TableCell>
                        <TableCell className="">
                          <span
                            className={log.tipo === "Entrada" ? "text-emerald-500 font-extrabold" : "text-red-500 font-extrabold"}
                          >
                            {log.tipo === "Entrada" ? "+" : "- "}
                            {log.cantidad}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.tipo === "Entrada"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                            }
                          >
                            {log.tipo === "Entrada" ? "Entrada" : "Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.motivo && log.motivo !== "Sin definir" ? (
                            log.motivo
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-300 rounded-full">
                              Sin definir
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {log.createdBy}
                        </TableCell>
                        {/*<TableCell className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver detalle
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalle del Movimiento</DialogTitle>
                                <DialogDescription>Información completa del registro de inventario</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">ID de Registro</p>
                                    <p className="text-sm font-mono break-all">{log._id}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Código de Producto</p>
                                    <p className="text-lg font-bold font-mono">{log.codigo}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Cantidad</p>
                                    <p
                                      className={`text-lg font-bold ${log.tipo === "Entrada" ? "text-emerald-500" : "text-red-500"}`}
                                    >
                                      {log.tipo === "Entrada" ? "+" : ""}
                                      {log.cantidad} unidades
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tipo de Movimiento</p>
                                    <Badge
                                      variant={log.tipo === "Entrada" ? "default" : "destructive"}
                                      className="mt-1"
                                    >
                                      {log.tipo === "Entrada" ? "Entrada" : "Salida"}
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                                  <p className="text-sm">{log.motivo}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                                  <p className="text-sm font-mono">{log.createdBy}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Fecha y Hora</p>
                                  <p className="text-sm font-mono">{formatDate(log.createdAt)}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>*/}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
