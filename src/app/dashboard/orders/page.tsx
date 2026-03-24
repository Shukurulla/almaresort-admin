"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Order, OrderItem } from "@/types";

function groupItems(items: OrderItem[]) {
  const active = items.filter((i) => i.status === "ACTIVE");
  const map = new Map<string, { name: string; price: number; count: number }>();
  for (const item of active) {
    const existing = map.get(item.dishName);
    if (existing) existing.count++;
    else
      map.set(item.dishName, {
        name: item.dishName,
        price: item.dishPrice,
        count: 1,
      });
  }
  return Array.from(map.values());
}

function timeAgo(dateStr: string) {
  const mins = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000
  );
  if (mins < 1) return "сейчас";
  if (mins < 60) return `${mins} мин назад`;
  return `${Math.floor(mins / 60)} ч ${mins % 60} мин назад`;
}

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandOrder, setExpandOrder] = useState<Order | null>(null);
  const { socketRef, connected } = useSocket(user?.restaurantId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/mixkit-correct-answer-tone-2870.wav");
  }, []);

  const loadOrders = useCallback(async () => {
    if (!user?.restaurantId) return;
    try {
      const data = await getOrders(user.restaurantId);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, [user?.restaurantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    const handleNew = (order: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      audioRef.current?.play().catch(() => {});
    };

    const handleStatus = (data: {
      orderId: string;
      status: Order["status"];
    }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderId ? { ...o, status: data.status } : o
        )
      );
    };

    const handleItemCancelled = (data: {
      orderId: string;
      itemId: string;
      cancelReason: string;
      totalAmount: number;
      totalItems: number;
    }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== data.orderId) return o;
          return {
            ...o,
            totalAmount: data.totalAmount,
            totalItems: data.totalItems,
            items: o.items.map((i) =>
              i.id === data.itemId
                ? {
                    ...i,
                    status: "CANCELLED" as const,
                    cancelReason: data.cancelReason,
                  }
                : i
            ),
          };
        })
      );
    };

    // When client adds items to existing order — reload full order data
    const handleItemAdded = () => {
      loadOrders();
    };

    socket.on("order:new", handleNew);
    socket.on("order:statusChanged", handleStatus);
    socket.on("order:itemCancelled", handleItemCancelled);
    socket.on("order:itemAdded", handleItemAdded);

    return () => {
      socket.off("order:new", handleNew);
      socket.off("order:statusChanged", handleStatus);
      socket.off("order:itemCancelled", handleItemCancelled);
      socket.off("order:itemAdded", handleItemAdded);
    };
  }, [socketRef, connected, loadOrders]);

  const handleDone = async (orderId: string) => {
    await updateOrderStatus(orderId, "FULFILLED");
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "FULFILLED" } : o
      )
    );
  };

  const activeOrders = orders.filter(
    (o) => o.status !== "FULFILLED" && o.status !== "CANCELLED"
  );
  const doneOrders = orders.filter(
    (o) => o.status === "FULFILLED" || o.status === "CANCELLED"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Заказы</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {activeOrders.length} активных
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-400"
            }`}
          />
          {connected ? "Онлайн" : "Подключение..."}
        </div>
      </div>

      {/* Active orders */}
      <div className="mt-5 space-y-3">
        {activeOrders.map((order) => {
          const grouped = groupItems(order.items);
          const show = grouped.slice(0, 3);
          const more = grouped.length - 3;

          return (
            <div
              key={order.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-orange-500"
                >
                  #{order.orderNumber}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(order.createdAt)}
                  </span>
                  <span>Стол {order.table.number}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {show.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="text-gray-700">
                      {item.name}
                      {item.count > 1 && (
                        <span className="ml-1 text-gray-400">
                          x{item.count}
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-gray-500">
                      {formatPrice(item.price * item.count)}
                    </span>
                  </div>
                ))}
                {more > 0 && (
                  <button
                    onClick={() => setExpandOrder(order)}
                    className="text-[12px] font-medium text-orange-500 hover:underline"
                  >
                    ещё {more} позиций...
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="text-sm font-bold text-gray-900">
                  {formatPrice(order.totalAmount)}
                </span>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-emerald-500 px-4 text-xs font-semibold hover:bg-emerald-600"
                  onClick={() => handleDone(order.id)}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Готово
                </Button>
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Нет активных заказов</p>
          </div>
        )}
      </div>

      {/* Done orders */}
      {doneOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400">
            Выполненные ({doneOrders.length})
          </h2>
          <div className="mt-3 space-y-3">
            {doneOrders.map((order) => {
              const grouped = groupItems(order.items);
              const show = grouped.slice(0, 3);
              const more = grouped.length - 3;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-orange-500"
                    >
                      #{order.orderNumber}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{timeAgo(order.createdAt)}</span>
                      <span>Стол {order.table.number}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        Готово
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    {show.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-gray-500">
                          {item.name}
                          {item.count > 1 && (
                            <span className="ml-1 text-gray-400">
                              x{item.count}
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-gray-400">
                          {formatPrice(item.price * item.count)}
                        </span>
                      </div>
                    ))}
                    {more > 0 && (
                      <button
                        onClick={() => setExpandOrder(order)}
                        className="text-[12px] font-medium text-orange-500 hover:underline"
                      >
                        ещё {more} позиций...
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 border-t border-gray-100 pt-2.5">
                    <span className="text-sm font-bold text-gray-500">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expand items dialog */}
      <Dialog
        open={!!expandOrder}
        onOpenChange={(v) => !v && setExpandOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Заказ #{expandOrder?.orderNumber} — все позиции
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {expandOrder &&
              groupItems(expandOrder.items).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="text-gray-800">
                    {item.name}
                    {item.count > 1 && (
                      <span className="ml-1 text-gray-400">x{item.count}</span>
                    )}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.price * item.count)}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex justify-end border-t pt-3">
            <Link
              href={`/dashboard/orders/${expandOrder?.id}`}
              className="text-sm font-medium text-orange-500 hover:underline"
              onClick={() => setExpandOrder(null)}
            >
              Подробнее
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
