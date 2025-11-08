"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Calendar } from "lucide-react"
import { getPaymentsBySaleId } from "@/app/actions/payments/get-payments-by-sale-id"
import { useSession } from "next-auth/react"
import updateSalePaymentStatus from "@/app/actions/sales/update-sale-payment-status"
import createPayment from "@/app/actions/payments/create-payment"

export interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  notes: string | null
  created_by: string | null
  sale_id?: string
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  totalAmount: number
  onPaymentAdded: () => void
}

export function PaymentDialog({ open, onOpenChange, saleId, totalAmount, onPaymentAdded }: PaymentDialogProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const {data: session} = useSession()

  useEffect(() => {
    if (open) {
      loadPayments()
    }
  }, [open, saleId])

  const loadPayments = async () => {
    setIsLoading(true)
    try{
      const { data, error } = await getPaymentsBySaleId(saleId)
      if (error as string || !data) {
        setIsLoading(false)
        console.log(`Error al cargar los pagos: ${error}`)
      }
      if(data){
        setPayments(data)
      }
    }catch (error){
      console.error("Error al cargar los pagos: ", error)
      alert('Error al cargar los pagos')
    }finally {
      setIsLoading(false)
    }
  }

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const remainingBalance = totalAmount - totalPaid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const paymentAmount = Number.parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Por favor ingrese un monto válido")
      return
    }

    if (paymentAmount > remainingBalance) {
      alert("El monto del pago no puede ser mayor al saldo pendiente")
      return
    }

    setIsSubmitting(true)

    try {
      // Get current user
      const user = session?.user
      // Insert payment
      const payment = {
        sale_id: saleId,
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: notes || null,
        created_by: user?.id,
      }

      const { error } = await createPayment(payment)
      if (error as string ) {
          setIsLoading(false)
          throw new Error(`Error al agregar el pago: ${error}`)
      }

    } catch (error) {
      console.error("Error al agregar el pago:", error)
      alert("Error al agregar el pago")
      setIsSubmitting(false)
    }

    // Calculate new total paid
    const newTotalPaid = totalPaid + paymentAmount
    const newRemainingBalance = totalAmount - newTotalPaid

    // Update sale payment_status
    let newPaymentStatus = "pending"
    if (newRemainingBalance <= 0) {
      newPaymentStatus = "paid"
    } else if (newTotalPaid > 0) {
      newPaymentStatus = "confirmed"
    }

    try {
      const { error } = await updateSalePaymentStatus(newPaymentStatus,saleId)
      if (error as string ) {
          setIsLoading(false)
          throw new Error(`Error al actualizar el estado del pago: ${error}`)
      }
    } catch (error) {
      console.error("Error al actualizar el estado del pago: ", error)
      alert("Error al actualizar el estado del pago")
      setIsSubmitting(false)
    }

    // Reset form
    setAmount("")
    setNotes("")
    setPaymentMethod("efectivo")

    // Reload payments
    await loadPayments()

    // Notify parent
    onPaymentAdded()

    // Close dialog if fully paid
    if (newRemainingBalance <= 0) {
      alert("¡Venta pagada completamente!")
      onOpenChange(false)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>Registra los pagos en abonos para esta venta a crédito</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Venta</div>
                <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Pagado</div>
                <div className="text-2xl font-bold text-emerald-600">${totalPaid.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Saldo Pendiente</div>
                <div className="text-2xl font-bold text-amber-600">${remainingBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          {remainingBalance > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Nuevo Pago</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto del Pago</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre este pago..."
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                {isSubmitting ? "Registrando..." : "Registrar Pago"}
              </Button>
            </form>
          )}

          {/* Payment History */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold">Historial de Pagos</h3>

            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Cargando pagos...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No hay pagos registrados</div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">
                              {payment.payment_method}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.payment_date).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {payment.notes && <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
