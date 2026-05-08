import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "../client";
import { Product } from "../../types";

const PRODUCTS_COLLECTION = "products";

export interface CreateProductInput {
  merchantId: string;
  merchantUid: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  stock: number;
  status: "ACTIVE" | "DRAFT";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    merchantId: String(data.merchantId || ""),
    merchantUid: data.merchantUid ? String(data.merchantUid) : undefined,
    name: String(data.name || "Untitled Product"),
    slug: data.slug ? String(data.slug) : "",
    description: String(data.description || ""),
    category: String(data.category || "Other"),
    price: Number(data.price || 0),
    imageUrl: String(data.imageUrl || ""),
    stock: Number(data.stock || 0),
    status:
      data.status === "ACTIVE" ||
      data.status === "DRAFT" ||
      data.status === "DISABLED"
        ? data.status
        : "DRAFT",
    createdAt: String(data.createdAt || ""),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

function removeUndefinedValues<T extends Record<string, unknown>>(
  input: T
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

function validateProductInput(input: CreateProductInput): void {
  if (!input.merchantId?.trim()) {
    throw new Error("Missing merchantId. Your merchant profile may be incomplete.");
  }

  if (!input.merchantUid?.trim()) {
    throw new Error("Missing merchantUid. Please log in again.");
  }

  if (!input.name?.trim()) {
    throw new Error("Product name is required.");
  }

  if (!input.description?.trim()) {
    throw new Error("Product description is required.");
  }

  if (!input.category?.trim()) {
    throw new Error("Product category is required.");
  }

  if (Number(input.price) <= 0) {
    throw new Error("Product price must be greater than 0.");
  }

  if (Number(input.stock) < 0) {
    throw new Error("Product stock cannot be negative.");
  }

  if (input.status !== "ACTIVE" && input.status !== "DRAFT") {
    throw new Error("Invalid product status.");
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  validateProductInput(input);

  const now = new Date().toISOString();
  const productData = {
    merchantId: input.merchantId.trim(),
    merchantUid: input.merchantUid.trim(),
    name: input.name.trim(),
    slug: generateSlug(input.name),
    description: input.description.trim(),
    category: input.category.trim() || "Other",
    price: Number(input.price),
    imageUrl: input.imageUrl?.trim() || "",
    stock: Number(input.stock || 0),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  const cleanProductData = removeUndefinedValues(productData);

  const docRef = await addDoc(
    collection(firestoreDb, PRODUCTS_COLLECTION),
    cleanProductData
  );

  return {
    id: docRef.id,
    ...productData,
  };
}

export async function getProduct(productId: string): Promise<Product | null> {
  if (!productId) {
    return null;
  }

  const docRef = doc(firestoreDb, PRODUCTS_COLLECTION, productId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapProduct(snapshot.id, snapshot.data());
}

export const getProductById = getProduct;

export async function getActiveProducts(): Promise<Product[]> {
  const productsQuery = query(
    collection(firestoreDb, PRODUCTS_COLLECTION),
    where("status", "==", "ACTIVE")
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((docSnap) =>
    mapProduct(docSnap.id, docSnap.data())
  );
}

export async function getProductsByMerchant(
  merchantId: string
): Promise<Product[]> {
  if (!merchantId?.trim()) {
    throw new Error("Missing merchantId. Cannot load merchant products.");
  }

  const productsQuery = query(
    collection(firestoreDb, PRODUCTS_COLLECTION),
    where("merchantId", "==", merchantId.trim())
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((docSnap) =>
    mapProduct(docSnap.id, docSnap.data())
  );
}

export async function getMerchantProducts(
  merchantId: string
): Promise<Product[]> {
  return getProductsByMerchant(merchantId);
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<void> {
  if (!productId) {
    throw new Error("Missing productId.");
  }

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (typeof updateData.name === "string" && updateData.name.trim()) {
  const cleanName = updateData.name.trim();

  updateData.name = cleanName;
  updateData.slug = generateSlug(cleanName);
  }

  if (typeof updateData.description === "string") {
    updateData.description = updateData.description.trim();
  }

  if (typeof updateData.category === "string") {
    updateData.category = updateData.category.trim() || "Other";
  }

  if (typeof updateData.imageUrl === "string") {
    updateData.imageUrl = updateData.imageUrl.trim();
  }

  if (updateData.imageUrl === undefined) {
    delete updateData.imageUrl;
  }

  if (updateData.price !== undefined) {
    updateData.price = Number(updateData.price);

    if (Number(updateData.price) <= 0) {
      throw new Error("Product price must be greater than 0.");
    }
  }

  if (updateData.stock !== undefined) {
    updateData.stock = Number(updateData.stock);

    if (Number(updateData.stock) < 0) {
      throw new Error("Product stock cannot be negative.");
    }
  }

  if (
    updateData.status === "INACTIVE" ||
    updateData.status === "DELETED" ||
    updateData.status === "ARCHIVED"
  ) {
    updateData.status = "DISABLED";
  }

  if (
    updateData.status !== undefined &&
    updateData.status !== "ACTIVE" &&
    updateData.status !== "DRAFT" &&
    updateData.status !== "DISABLED"
  ) {
    throw new Error("Invalid product status.");
  }

  const cleanUpdates = removeUndefinedValues(updateData);

  await updateDoc(
    doc(firestoreDb, PRODUCTS_COLLECTION, productId),
    cleanUpdates
  );
}

export async function activateProduct(productId: string): Promise<void> {
  await updateProduct(productId, {
    status: "ACTIVE",
  });
}

export async function disableProduct(productId: string): Promise<void> {
  await updateProduct(productId, {
    status: "DISABLED",
  });
}