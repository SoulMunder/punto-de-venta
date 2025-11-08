'use server'

import { Payment } from "@/components/sales/payment-dialog";
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase"
import { ObjectId } from "mongodb";

export async function getPaymentsBySaleId(saleId:string):Promise<{ data: Payment[] | null ; error: string | null }>{
  try {
    const mainDb = await connectToMainDatabase()
    const paymentsCollection = mainDb.collection('payments')

    const saleObjectId = new ObjectId(saleId)
    const payments = await paymentsCollection.find({
      sale_id: saleObjectId
    }).toArray()

    if(!payments || payments.length === 0){
      return {data: null, error: "Advertencia: no se encontraron pagos de creditos" }
    }
    const sortedPayments= payments.sort((a,b)=>(b.payment_date - a.payment_date))
    const mappedPayments = sortedPayments.map((payment)=>(
      {
        id: payment._id.toString(),
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        notes: payment.notes ?? null,
        created_by: payment.created_by.toString(),
      }
    ))
    return {data: mappedPayments, error: null}
  } catch (error) {
    console.log("Error al obtener los pagos de creditos en el servidor:", error);
    return { 
      data: null, 
      error: "Error al obtener los pagos de creditos en el servidor" 
    };
  }
}