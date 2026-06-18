export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  base_price: number | null;
  has_variants: boolean;
  is_active: boolean;
  main_image_url: string | null;
  category_id: string | null;
  tags: string[];
  created_at: string;
  categories?: Category;
  product_variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string | null;
  title: string;
  variantLabel: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_title: string;
  variant_label: string | null;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_notes: string | null;
  amount_paid: number;
  paystack_reference: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  order_items?: OrderItem[];
}

export interface AdminUser {
  id: string;
  email: string;
}
