"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder, cancelOrderItem } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Order, OrderItem } from "@/types";

const statusLabels: Record<string, string> = {
  NEW: "Новый",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  FULFILLED: "Выполнен",
  CANCELLED: "Отменён",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [cancelItem, setCancelItem] = useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const { socketRef, connected } = useSocket(user?.restaurantId);

  useEffect(() => {
    getOrder(id).then(setOrder).catch(console.error);
  }, [id]);

  // Real-time updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    const handleItemCancelled = (data: {
      orderId: string;
      itemId: string;
      cancelReason: string;
      totalAmount: number;
      totalItems: number;
    }) => {
      setOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          totalAmount: data.totalAmount,
          totalItems: data.totalItems,
          items: prev.items.map((i) =>
            i.id === data.itemId
              ? { ...i, status: "CANCELLED" as const, cancelReason: data.cancelReason }
              : i
          ),
        };
      });
    };

    socket.on("order:itemCancelled", handleItemCancelled);
    return () => {
      socket.off("order:itemCancelled", handleItemCancelled);
    };
  }, [socketRef, connected]);

  const handleCancel = async () => {
    if (!cancelItem || !cancelReason.trim() || !order) return;
    setCancelling(true);
    try {
      const result = await cancelOrderItem(order.id, cancelItem.id, cancelReason);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              totalAmount: result.totalAmount,
              totalItems: result.totalItems,
              items: prev.items.map((i) =>
                i.id === cancelItem.id
                  ? { ...i, status: "CANCELLED" as const, cancelReason }
                  : i
              ),
            }
          : prev
      );
      setCancelItem(null);
      setCancelReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (!order) {
    return <div className="py-12 text-center text-gray-400">Загрузка...</div>;
  }

  const activeItems = order.items.filter((i) => i.status === "ACTIVE");
  const cancelledItems = order.items.filter((i) => i.status === "CANCELLED");

  return (
    <div>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Заказ #{order.orderNumber}</h1>
        <Badge>{statusLabels[order.status]}</Badge>
        <span className="text-sm text-gray-500">
          Стол {order.table.number}
          {order.table.label ? ` (${order.table.label})` : ""}
        </span>
      </div>

      {order.clientNote && (
        <p className="mt-2 text-sm text-gray-500">
          Комментарий клиента: {order.clientNote}
        </p>
      )}

      {/* Active items */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">
          Активные позиции ({activeItems.length})
        </h2>
        <div className="space-y-2">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div>
                <span className="font-medium">{item.dishName}</span>
                <span className="ml-3 text-gray-500">
                  {formatPrice(item.dishPrice)}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelItem(item)}
              >
                Отменить
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Cancelled items */}
      {cancelledItems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-400">
            Отменённые ({cancelledItems.length})
          </h2>
          <div className="space-y-2">
            {cancelledItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
              >
                <div>
                  <span className="font-medium text-gray-400 line-through">
                    {item.dishName}
                  </span>
                  <span className="ml-3 text-gray-300 line-through">
                    {formatPrice(item.dishPrice)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {item.cancelReason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-4 text-lg">
        <span className="font-medium">Итого:</span>
        <span className="font-bold">{formatPrice(order.totalAmount)}</span>
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelItem}
        onOpenChange={(v) => !v && setCancelItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить: {cancelItem?.dishName}</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-2 text-sm text-gray-500">
              Укажите причину отмены (обязательно):
            </p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Причина отмены..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelItem(null)}>
              Назад
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelling}
              onClick={handleCancel}
            >
              {cancelling ? "Отмена..." : "Подтвердить отмену"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
