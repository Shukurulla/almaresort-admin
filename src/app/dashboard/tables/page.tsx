"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, QrCode, Trash2, Table2, Users, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Table } from "@/types";

export default function TablesPage() {
  const user = useAuth((s) => s.user);
  const [tables, setTables] = useState<Table[]>([]);
  const [creating, setCreating] = useState(false);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState("4");
  const [qrDialog, setQrDialog] = useState<{
    qrCode: string;
    url: string;
    tableNumber?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const restaurantId = user?.restaurantId || "";

  useEffect(() => {
    if (restaurantId) {
      api.getTables(restaurantId).then(setTables).catch(() => {});
    }
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!number) return;
    const table = await api.createTable(restaurantId, {
      number: parseInt(number),
      label: label || undefined,
      seats: parseInt(seats) || 4,
    });
    setTables((prev) => [...prev, table]);
    setCreating(false);
    setNumber("");
    setLabel("");
    setSeats("4");
  };

  const handleDelete = async (id: string) => {
    await api.deleteTable(id);
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const handleQr = async (table: Table) => {
    const result = await api.getTableQr(table.id);
    setQrDialog({ ...result, tableNumber: table.number });
  };

  const handleDownloadQr = () => {
    if (!qrDialog) return;
    const link = document.createElement("a");
    link.download = `table-${qrDialog.tableNumber || "qr"}.png`;
    link.href = qrDialog.qrCode;
    link.click();
  };

  const handleCopyLink = async () => {
    if (!qrDialog) return;
    await navigator.clipboard.writeText(qrDialog.url);
    setCopied(true);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Столы</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {tables.length} столов
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить стол
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => handleQr(table)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-500">
                  {table.number}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Стол #{table.number}
                  </h3>
                  {table.label && (
                    <p className="text-xs text-gray-500">{table.label}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {table.seats} мест
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleQr(table); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Table2 className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Нет столов</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый стол</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Номер стола</Label>
              <Input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Название (необязательно)</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VIP-1"
              />
            </div>
            <div>
              <Label>Количество мест</Label>
              <Input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Отмена
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleCreate}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => { setQrDialog(null); setCopied(false); }}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>
              Стол #{qrDialog?.tableNumber} — QR код
            </DialogTitle>
          </DialogHeader>
          {qrDialog && (
            <div>
              <img
                src={qrDialog.qrCode}
                alt="QR Code"
                className="mx-auto h-64 w-64 rounded-lg"
              />

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={handleDownloadQr}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать QR
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Скопировано!" : "Копировать ссылку"}
                </Button>
              </div>

              <p className="mt-3 break-all text-xs text-gray-400">
                {qrDialog.url}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
