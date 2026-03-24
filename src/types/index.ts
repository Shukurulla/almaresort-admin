export interface User {
  id: string;
  name: string;
  phone: string;
  role: "SYSTEM_ADMIN" | "RESTAURANT_ADMIN" | "WAITER";
  restaurantId?: string;
  assignedTableIds?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  logo?: string;
  coverImage?: string;
  isActive: boolean;
}

export interface Table {
  id: string;
  number: number;
  label?: string;
  seats: number;
  qrCode?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  weight?: string;
  cookingTime?: number;
  isAvailable: boolean;
  categoryId: string;
  category?: { id: string; name: string };
}

export interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  dishPrice: number;
  dishImage?: string;
  status: "ACTIVE" | "CANCELLED";
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: "NEW" | "ACCEPTED" | "PREPARING" | "READY" | "FULFILLED" | "CANCELLED";
  restaurantId: string;
  tableId: string;
  waiterId?: string;
  totalAmount: number;
  totalItems: number;
  items: OrderItem[];
  table: { number: number; label?: string };
  clientNote?: string;
  createdAt: string;
  updatedAt: string;
}
