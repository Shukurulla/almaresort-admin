"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getReportSummary } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

interface Summary {
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  avgOrderAmount: number;
}

const iconBg: Record<string, string> = {
  orders: "bg-blue-50 text-blue-500",
  revenue: "bg-emerald-50 text-emerald-500",
  items: "bg-orange-50 text-orange-500",
  avg: "bg-violet-50 text-violet-500",
};

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (user?.restaurantId) {
      getReportSummary(user.restaurantId, "day")
        .then(setSummary)
        .catch(() => {});
    }
  }, [user?.restaurantId]);

  if (user?.role === "SYSTEM_ADMIN") {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Добро пожаловать, {user.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Перейдите в раздел «Рестораны» для управления.
        </p>
      </div>
    );
  }

  const stats = [
    {
      key: "orders",
      title: "Заказы сегодня",
      value: summary?.totalOrders ?? "—",
      icon: ClipboardList,
    },
    {
      key: "revenue",
      title: "Выручка сегодня",
      value: summary ? formatPrice(summary.totalRevenue) : "—",
      icon: DollarSign,
    },
    {
      key: "items",
      title: "Блюд продано",
      value: summary?.totalItemsSold ?? "—",
      icon: UtensilsCrossed,
    },
    {
      key: "avg",
      title: "Средний чек",
      value: summary ? formatPrice(summary.avgOrderAmount) : "—",
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Главная</h1>
        <p className="mt-0.5 text-sm text-gray-500">Статистика за сегодня</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-500">
                  {stat.title}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg[stat.key]}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
