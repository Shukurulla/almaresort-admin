"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, toRawPhone } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users, Table2 } from "lucide-react";
import type { Table } from "@/types";

interface Waiter {
  id: string;
  name: string;
  phone: string;
  assignedTableIds: string[];
}

export default function WaitersPage() {
  const user = useAuth((s) => s.user);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [assignDialog, setAssignDialog] = useState<Waiter | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const restaurantId = user?.restaurantId || "";

  useEffect(() => {
    if (restaurantId) {
      api.getWaiters(restaurantId).then(setWaiters).catch(() => {});
      api.getTables(restaurantId).then(setTables).catch(() => {});
    }
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!name || !phone || !password) return;
    const waiter = await api.createWaiter(restaurantId, {
      name,
      phone: toRawPhone(phone),
      password,
    });
    setWaiters((prev) => [...prev, waiter]);
    setCreating(false);
    setName("");
    setPhone("");
    setPassword("");
  };

  const handleDelete = async (id: string) => {
    await api.deleteWaiter(id);
    setWaiters((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAssign = async () => {
    if (!assignDialog) return;
    const result = await api.assignWaiterTables(
      assignDialog.id,
      selectedTables
    );
    setWaiters((prev) =>
      prev.map((w) =>
        w.id === assignDialog.id
          ? { ...w, assignedTableIds: result.assignedTableIds }
          : w
      )
    );
    setAssignDialog(null);
  };

  const openAssign = (waiter: Waiter) => {
    setAssignDialog(waiter);
    setSelectedTables(waiter.assignedTableIds || []);
  };

  const toggleTable = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Официанты</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {waiters.length} сотрудников
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {waiters.map((waiter) => (
          <div
            key={waiter.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-orange-500">
                  {waiter.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {waiter.name}
                  </h3>
                  <p className="text-xs text-gray-500">{waiter.phone}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(waiter.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Table2 className="h-3.5 w-3.5" />
                {waiter.assignedTableIds?.length || 0} столов
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => openAssign(waiter)}
              >
                Назначить столы
              </Button>
            </div>
          </div>
        ))}

        {waiters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Нет официантов</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый официант</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Имя</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Телефон</Label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

      {/* Assign Tables Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить столы: {assignDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => toggleTable(table.id)}
                className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${
                  selectedTables.includes(table.id)
                    ? "border-orange-400 bg-orange-50 text-orange-600 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Table2
                  className={`mx-auto mb-1 h-5 w-5 ${
                    selectedTables.includes(table.id)
                      ? "text-orange-500"
                      : "text-gray-400"
                  }`}
                />
                #{table.number}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>
              Отмена
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleAssign}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
