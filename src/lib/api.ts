import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7891/api/v1";

export const api = axios.create({
  baseURL: API_URL,
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const login = (phone: string, password: string) =>
  api.post("/auth/login", { phone, password }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

// Restaurants
export const getRestaurants = () => api.get("/restaurants").then((r) => r.data);
export const getRestaurantById = (id: string) =>
  api.get(`/restaurants/${id}`).then((r) => r.data);
export const createRestaurant = (data: Record<string, unknown>) =>
  api.post("/restaurants", data).then((r) => r.data);
export const updateRestaurant = (id: string, data: Record<string, unknown>) =>
  api.patch(`/restaurants/${id}`, data).then((r) => r.data);
export const deleteRestaurant = (id: string) =>
  api.delete(`/restaurants/${id}`).then((r) => r.data);

// Tables
export const getTables = (restaurantId: string) =>
  api.get(`/restaurants/${restaurantId}/tables`).then((r) => r.data);
export const createTable = (restaurantId: string, data: Record<string, unknown>) =>
  api.post(`/restaurants/${restaurantId}/tables`, data).then((r) => r.data);
export const updateTable = (id: string, data: Record<string, unknown>) =>
  api.patch(`/tables/${id}`, data).then((r) => r.data);
export const deleteTable = (id: string) =>
  api.delete(`/tables/${id}`).then((r) => r.data);
export const getTableQr = (id: string) =>
  api.get(`/tables/${id}/qr`).then((r) => r.data);

// Categories
export const getCategories = (restaurantId: string) =>
  api.get(`/restaurants/${restaurantId}/categories`).then((r) => r.data);
export const createCategory = (restaurantId: string, data: Record<string, unknown>) =>
  api.post(`/restaurants/${restaurantId}/categories`, data).then((r) => r.data);
export const updateCategory = (id: string, data: Record<string, unknown>) =>
  api.patch(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id: string) =>
  api.delete(`/categories/${id}`).then((r) => r.data);

// Dishes
export const getDishes = (restaurantId: string, categoryId?: string) =>
  api.get(`/restaurants/${restaurantId}/dishes`, { params: { categoryId } }).then((r) => r.data);
export const createDish = (restaurantId: string, data: Record<string, unknown>) =>
  api.post(`/restaurants/${restaurantId}/dishes`, data).then((r) => r.data);
export const updateDish = (id: string, data: Record<string, unknown>) =>
  api.patch(`/dishes/${id}`, data).then((r) => r.data);
export const deleteDish = (id: string) =>
  api.delete(`/dishes/${id}`).then((r) => r.data);

// Waiters
export const getWaiters = (restaurantId: string) =>
  api.get(`/restaurants/${restaurantId}/waiters`).then((r) => r.data);
export const createWaiter = (restaurantId: string, data: Record<string, unknown>) =>
  api.post(`/restaurants/${restaurantId}/waiters`, data).then((r) => r.data);
export const updateWaiter = (id: string, data: Record<string, unknown>) =>
  api.patch(`/waiters/${id}`, data).then((r) => r.data);
export const assignWaiterTables = (id: string, tableIds: string[]) =>
  api.patch(`/waiters/${id}/tables`, { tableIds }).then((r) => r.data);
export const deleteWaiter = (id: string) =>
  api.delete(`/waiters/${id}`).then((r) => r.data);

// Orders
export const getOrders = (restaurantId: string, params?: Record<string, string>) =>
  api.get(`/restaurants/${restaurantId}/orders`, { params }).then((r) => r.data);
export const getOrder = (id: string) =>
  api.get(`/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id: string, status: string) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);
export const cancelOrderItem = (orderId: string, itemId: string, cancelReason: string) =>
  api.patch(`/orders/${orderId}/items/${itemId}/cancel`, { cancelReason }).then((r) => r.data);

// Reports
export const getReportSummary = (restaurantId: string, period: string) =>
  api.get(`/restaurants/${restaurantId}/reports/summary`, { params: { period } }).then((r) => r.data);
export const getTopDishes = (restaurantId: string, period: string) =>
  api.get(`/restaurants/${restaurantId}/reports/top-dishes`, { params: { period } }).then((r) => r.data);
export const getCancellations = (restaurantId: string, period: string) =>
  api.get(`/restaurants/${restaurantId}/reports/cancellations`, { params: { period } }).then((r) => r.data);

// Upload
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};
