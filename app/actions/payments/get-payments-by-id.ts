'use server'

import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase"
import { ObjectId } from "mongodb";

export async function getPaymentsById(creditSaleIds:string[]){
  try {
    const mainDb = await connectToMainDatabase()
    const paymentsCollection = mainDb.collection('payments')

    const creditSalesObjectIds = creditSaleIds.map((id)=>(new ObjectId(id)))
    const payments = await paymentsCollection.find({
      sale_id: {$in: creditSalesObjectIds}
    }).toArray()

    if(!payments || payments.length === 0){
      return {data: null, error: "No se encontraron pagos de creditos" }
    }
    const mappedPayments = payments.map((payment)=>(
      {
        id: payment._id.toString(),
        sale_id: payment.sale_id.toString(),
        amount: payment.amount,
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