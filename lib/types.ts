import { ObjectId } from "mongodb"

export interface Branch {
  id: string
  name: string
  address: string | null
}

export type Product = {
  // Identificador
  _id: string

  // Información básica
  codigo: number
  clave: string
  descripcion: string
  margenDeMercado: string
  caja: number
  master: number
  precio: number
  unidad: string
  ean: string
  precioMinimoDeVenta: number
  altaRotacion: number

  // Precios con IVA
  precioMayoreoConIVA: number
  precioDistribuidorConIVA: number
  precioPublicoConIVA: number

  // Precios sin IVA
  precioMayoreoSinIVA: number
  precioDistribuidorSinIVA: number
  precioPublicoSinIVA: number

  // Marca y medias
  marca: string
  precioMedioMayoreoSinIVA: number
  precioMedioMayoreoConIVA: number

  // Información SAT
  codigoSAT: string
  descripcionSAT: string

  // Familia
  familia: string
  descripcionFamilia: string

  // Peso y volumen
  // Peso y volumen con corchetes
  pesoKg: number
  volumenCm3: number

  // Imagen opcional
  image_url?: string
  
   // 🟢 Precios personalizados
  customPrices?: {
    price_name: string
    price_value: number
  }[]
}

export interface InventoryProduct extends Product{
  barcode: string
  custom_prices: number[]
  cantidad:number
  branch: string
}

export interface CustomPrice {
  id: string
  product_id: string
  price_name: string
  price_value: number
  created_at: string
}

export interface Inventory {
  _id: string
  codigo: string
  branch: {
    name: string
    address: string
  }
  cantidad: number
  createdAt: string
  updatedAt: string
}


export interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface Purchase {
  _id: string
  createdBy: string
  fecha: string         // ISO string de la fecha
  noPedido: number      // Número de pedido
  noOrden: string       // Número de orden
  notes: string | null
  createdAt: string
}

export interface PurchaseItem {
  _id: string
  purchaseId: string
  productId: string
  material: number      // Código del material
  descripcion: string   // Descripción del producto
  cantidad: number      // Cantidad comprada
  precioUnitario: number // Precio unitario
  subtotal: number      // Subtotal de la compra
  createdAt: string
}


export interface Sale {
  id: string
  branch_id: string
  customer_id: string | null
  sale_date: string
  total_amount: number
  payment_received: number
  change_given: number
  created_by: string
  created_at: string
  sale_type: "remision" | "credito" | "cotizacion"
  payment_status: "pending" | "confirmed" | "paid"
  parent_sale_id: string | null
}

export interface SaleWithRelations extends Sale {
  branch: Branch
  sale_date: string
  customer: {
    name: string
  } | null
  created_by_profile: {
    name: string | null
    username: string
  } | null
  sale_items: {
    quantity: number,
    unit_price: number,
    product_code: string
    product: {
      name: string
      truper_code: string
      brand: string
      product_code:string
    }
  }
}

export interface NewSale extends Omit<Sale, 'id' | 'sale_date' | 'created_at'> {
  cart: CartItem[]
}

export interface CartItem {
  product: InventoryProduct
  quantity: number
  unit_price: number
  price_type: string
}

export interface SaleItem {
  id: string
  sale_id: string 
  product_code: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface SaleReceipt {
  id: string
  sale_date: string
  total_amount: number
  payment_received: number
  change_given: number
  branch: {
    name: string
  }
  customer: {
    name: string
  } | null
  sale_items: {
    quantity: number
    unit_price: number
    product_code: string
    product: {
      name: string
      truper_code: string
      brand: string
    }
  }[]
}

export interface QuoteSale{
  id: string;
  branch_id: string;
  customer_id: string | null;
  total_amount: number;
  payment_received: number;
  change_given: number;
  created_by: string;
  sale_type: string;
  payment_status: string;
  parent_sale_id: string | null;
  created_at: string;
  sale_items: SaleItem[];
} 

export interface Profile {
  id: string
  username: string
  full_name: string | null
  role: AllowedRole
  branch_id: string | null
  created_at: string
  updated_at: string
}

export interface ProfileWithBranches extends Profile {
  assignedBranches?: string[]
}

export interface ProfileWithPassword extends ProfileWithBranches {
  password?: string
}

const allowedRoles = ["admin", "branch_manager", "cashier", "user"] as const

export type AllowedRole = (typeof allowedRoles)[number]
