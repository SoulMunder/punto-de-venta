import { connectToDatabase } from "./mongodb/config";
import { Product } from "./mongodb/models/product";
import { User } from "./mongodb/models/user";

export async function getProducts(query = {}) {
  await connectToDatabase();
  return Product.find(query);
}

export async function getProduct(id: string) {
  await connectToDatabase();
  return Product.findById(id);
}

export async function createProduct(data: any) {
  await connectToDatabase();
  return Product.create(data);
}

export async function updateProduct(id: string, data: any) {
  await connectToDatabase();
  return Product.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteProduct(id: string) {
  await connectToDatabase();
  return Product.findByIdAndDelete(id);
}

export async function getUsers(query = {}) {
  await connectToDatabase();
  return User.find(query);
}

export async function getUser(id: string) {
  await connectToDatabase();
  return User.findById(id);
}

export async function createUser(data: any) {
  await connectToDatabase();
  return User.create(data);
}

export async function updateUser(id: string, data: any) {
  await connectToDatabase();
  return User.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  return User.findByIdAndDelete(id);
}