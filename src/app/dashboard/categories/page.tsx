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
import { Plus, Pencil, Trash2, FolderOpen, GripVertical } from "lucide-react";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const user = useAuth((s) => s.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");

  const restaurantId = user?.restaurantId || "";

  useEffect(() => {
    if (restaurantId) {
      api.getCategories(restaurantId).then(setCategories).catch(() => {});
    }
  }, [restaurantId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editing) {
      const updated = await api.updateCategory(editing.id, { name });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } else {
      const created = await api.createCategory(restaurantId, {
        name,
        sortOrder: categories.length,
      });
      setCategories((prev) => [...prev, created]);
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setName("");
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Категории</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {categories.length} категорий
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500">
              {i + 1}
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">
              {cat.name}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(cat)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Нет категорий</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать категорию" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Закуски"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleSave}
            >
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
