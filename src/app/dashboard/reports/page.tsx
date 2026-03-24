"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  ClipboardList,
  DollarSign,
  UtensilsCrossed,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Trophy,
  Medal,
  Award,
} from "lucide-react";

type Period = "day" | "week" | "month" | "year";

interface Summary {
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  avgOrderAmount: number;
}

interface TopDish {
  dishId: string;
  name: string;
  count: number;
  revenue: number;
}

interface CancelReport {
  totalCancelled: number;
  totalLost: number;
}

const periodLabels: Record<Period, string> = {
  day: "Сегодня",
  week: "Неделя",
  month: "Месяц",
  year: "Год",
};

const statConfig = [
  {
    key: "orders",
    label: "Заказов",
    icon: ClipboardList,
    iconBg: "bg-blue-50 text-blue-500",
  },
  {
    key: "revenue",
    label: "Выручка",
    icon: DollarSign,
    iconBg: "bg-emerald-50 text-emerald-500",
  },
  {
    key: "items",
    label: "Блюд продано",
    icon: UtensilsCrossed,
    iconBg: "bg-orange-50 text-orange-500",
  },
  {
    key: "avg",
    label: "Средний чек",
    icon: TrendingUp,
    iconBg: "bg-violet-50 text-violet-500",
  },
];

const rankIcons = [Trophy, Medal, Award];
const rankColors = [
  "bg-amber-50 text-amber-500 border-amber-200",
  "bg-gray-50 text-gray-400 border-gray-200",
  "bg-orange-50 text-orange-400 border-orange-200",
];

export default function ReportsPage() {
  const user = useAuth((s) => s.user);
  const [period, setPeriod] = useState<Period>("day");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [cancellations, setCancellations] = useState<CancelReport | null>(
    null
  );

  const restaurantId = user?.restaurantId || "";

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getReportSummary(restaurantId, period)
      .then(setSummary)
      .catch(() => {});
    api
      .getTopDishes(restaurantId, period)
      .then(setTopDishes)
      .catch(() => {});
    api
      .getCancellations(restaurantId, period)
      .then(setCancellations)
      .catch(() => {});
  }, [restaurantId, period]);

  const statValues: Record<string, string | number> = summary
    ? {
        orders: summary.totalOrders,
        revenue: formatPrice(summary.totalRevenue),
        items: summary.totalItemsSold,
        avg: formatPrice(summary.avgOrderAmount),
      }
    : { orders: "—", revenue: "—", items: "—", avg: "—" };

  // Find max revenue among top dishes for bar width
  const maxRevenue = topDishes.length
    ? Math.max(...topDishes.map((d) => d.revenue))
    : 1;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Отчёты</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Аналитика по ресторану
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mt-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              period === p
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-500">
                  {stat.label}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-900">
                {statValues[stat.key]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Dishes */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">Топ блюд</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Самые популярные позиции
          </p>

          <div className="mt-4 space-y-3">
            {topDishes.map((dish, idx) => {
              const RankIcon = rankIcons[idx] || null;
              const barWidth = Math.round((dish.revenue / maxRevenue) * 100);

              return (
                <div key={dish.dishId} className="flex items-center gap-3">
                  {/* Rank */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      idx < 3
                        ? rankColors[idx]
                        : "border-gray-100 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {RankIcon ? (
                      <RankIcon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {dish.name}
                      </span>
                      <span className="ml-2 shrink-0 text-xs font-medium text-gray-500">
                        {dish.count} шт.
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-400 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="mt-0.5 text-[11px] text-gray-400">
                      {formatPrice(dish.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}

            {topDishes.length === 0 && (
              <div className="flex flex-col items-center py-8">
                <UtensilsCrossed className="h-10 w-10 text-gray-200" />
                <p className="mt-2 text-sm text-gray-400">Нет данных</p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellations */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">Отмены</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Отменённые позиции и потери
          </p>

          {cancellations ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Отменено позиций
                  </p>
                  <span className="text-2xl font-bold text-red-500">
                    {cancellations.totalCancelled}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Потери</p>
                  <span className="text-2xl font-bold text-amber-600">
                    {formatPrice(cancellations.totalLost)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center py-8">
              <XCircle className="h-10 w-10 text-gray-200" />
              <p className="mt-2 text-sm text-gray-400">Нет данных</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
