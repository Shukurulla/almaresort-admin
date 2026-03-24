"use client";

import { create } from "zustand";
import { User, Restaurant } from "@/types";
import * as api from "@/lib/api";

interface AuthStore {
  user: User | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthStore>()((set) => ({
  user: null,
  restaurant: null,
  loading: true,

  login: async (phone, password) => {
    const { token, user } = await api.login(phone, password);
    localStorage.setItem("token", token);
    set({ user, loading: false });
    if (user.restaurantId) {
      api.getRestaurantById(user.restaurantId).then((r: Restaurant) => set({ restaurant: r })).catch(() => {});
    }
  },

  loadUser: async () => {
    try {
      const user = await api.getMe();
      set({ user, loading: false });
      if (user.restaurantId) {
        api.getRestaurantById(user.restaurantId).then((r: Restaurant) => set({ restaurant: r })).catch(() => {});
      }
    } catch {
      localStorage.removeItem("token");
      set({ user: null, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, restaurant: null });
  },
}));
