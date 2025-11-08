'use server'

import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase"
import { ObjectId } from 'mongodb'

export default async function updateSalePaymentStatus(newPaymentStatus:string, saleId:string){
  try {
    const mainDb = await connectToMainDatabase()
    const paymentsCollection = mainDb.collection('payments')
    const saleObjectId = new ObjectId(saleId)
    const updateResult = paymentsCollection.findOneAndUpdate(
      { _id : saleObjectId },
      { payment_status : newPaymentStatus })
    if (!updateResult) {
      return {error:'No se actualizo el estado en la base de datos'};
    }
    return {success: true}
  } catch (error) {
    console.log('No se actualizo el estado en la base de datos: ', error)
    return {error:'No se actualizo el estado en la base de datos'};
  }
}