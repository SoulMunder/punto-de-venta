import mongoose from "mongoose"
import { ProductForm } from "@/components/inventory/product-form"

interface EditProductPageProps {
  params: Promise<{ id: string }>  // params ahora es una promesa
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params  // ⚠️ await aquí

  const uri = process.env.MONGODB_URI
  const dbName = process.env.TRUPPER_DB_NAME

  if (!uri || !dbName) throw new Error("❌ Faltan variables de entorno")

  const connection = await mongoose.createConnection(uri, { dbName }).asPromise()
  console.log(`🟢 Conectado a la base: ${dbName}`)

  const ProductSchema = new mongoose.Schema({}, { strict: false })
  const Product = connection.model("Product", ProductSchema, "products")

  let product: any = null
  try {
    product = await Product.findById(id).lean()
    console.log("🟢 Producto encontrado:", product?._id || "No encontrado")
  } catch (err) {
    console.error(err)
  } finally {
    await connection.close()
    console.log("🟢 Conexión cerrada")
  }

  const productData = { ...product, _id: product?._id?.toString() || "" }
  console.log("🟢 productData preparado:", productData)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Editar Producto</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        {product ? <ProductForm product={productData} /> : <p>❌ Producto no encontrado</p>}
      </main>
    </div>
  )
}
