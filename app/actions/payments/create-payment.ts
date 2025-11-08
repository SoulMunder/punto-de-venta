'use server'

import { Payment } from "@/components/sales/payment-dialog";
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { ObjectId } from "mongodb"

export default async function createPayment(payment: Partial<Payment>){
  try {
    const mainDb = await connectToMainDatabase()
    const paymentsCollection = mainDb.collection('payments')
    const newPayment = {
      sale_id: new ObjectId(payment.sale_id), 
      amount: payment.amount, 
      payment_date: new Date(),
      payment_method: payment.payment_method ?? null,
      notes: payment.notes ?? null, 
      created_by: payment.created_by ? new ObjectId(payment.created_by) : null, 
    }

    const result = await paymentsCollection.insertOne(newPayment)
    if (!result.acknowledged) {
      return { error: "No se pudo insertar el pago en la base de datos." }
    }
    return { success: true }
  } catch (error) {
    console.log("No se pudo insertar el pago en la base de datos: ",error)
    return { error: "No se pudo insertar el pago en la base de datos." }
  }
}