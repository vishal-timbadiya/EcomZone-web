import { z } from 'zod';

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================
// Product Schemas
// ============================================

export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  singlePrice: z.number().positive('Price must be positive'),
  cartonPrice: z.number().nonnegative('Carton price cannot be negative').optional(),
  cartonPcsPrice: z.number().nonnegative('Carton pcs price cannot be negative').optional(),
  cartonQty: z.number().int().positive('Carton quantity must be positive'),
  gstPercentage: z.number().nonnegative('GST percentage cannot be negative'),
  hsnCode: z.string().optional(),
  weight: z.number().nonnegative('Weight cannot be negative').optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  categories: z.array(z.string()).optional(),
  subCategory: z.string().optional(),
  isBestseller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isTopRanking: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

// ============================================
// Order Schemas
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  singleQty: z.number().int().nonnegative().optional(),
  cartonQty: z.number().int().nonnegative().optional(),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  address: z.string().min(5, 'Address too short'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  zip: z.string().regex(/^[0-9]{5,6}$/, 'Invalid ZIP code'),
  country: z.string().default('India'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['COD', 'UPI', 'PHONEPE']),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500).optional(),
});

// ============================================
// Category Schemas
// ============================================

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  icon: z.string().optional(),
  imageUrl: z.string().url().optional(),
  position: z.number().int().nonnegative().optional(),
});

// ============================================
// Pagination Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================
// Query Filter Schemas
// ============================================

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  categories: z.string().optional(),
  minPrice: z.string().regex(/^[0-9]+(\.[0-9]{2})?$/).optional(),
  maxPrice: z.string().regex(/^[0-9]+(\.[0-9]{2})?$/).optional(),
  type: z.enum(['top-ranking', 'trending', 'new-arrivals']).optional(),
  ...paginationSchema.shape,
}).partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
