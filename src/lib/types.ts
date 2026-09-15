export type Role = "admin" | "user";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type OrderStatus = "pending" | "partial" | "closed";

export const SIZES: { value: Size; label: string }[] = [
  { value: "XS", label: "Extra Small" },
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
  { value: "XL", label: "Extra Large" },
];

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  factory_code: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  article_id: string;
  size: Size;
  qty_ordered: number;
  qty_delivered: number;
  created_at: string;
  updated_at: string;
  article?: Article;
}

export interface ReturnRow {
  id: string;
  customer_id: string;
  order_id: string | null;
  article_id: string;
  size: Size;
  qty: number;
  note: string | null;
  created_at: string;
  article?: Article;
  order?: { order_number: number } | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}
