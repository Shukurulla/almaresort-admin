"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as api from "@/lib/api";
import { formatPrice, imgSrc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import type { Dish, Category } from "@/types";

export default function DishesPage() {
  const user = useAuth((s) => s.user);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");

  const restaurantId = user?.restaurantId || "";

  useEffect(() => {
    if (restaurantId) {
      api.getDishes(restaurantId).then(setDishes).catch(() => {});
      api.getCategories(restaurantId).then(setCategories).catch(() => {});
    }
  }, [restaurantId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    setImage(url);
  };

  const handleSave = async () => {
    if (!name.trim() || !price || !categoryId) return;
    const data = {
      name,
      description: description || undefined,
      price: parseInt(price),
      categoryId,
      image: image || undefined,
    };

    if (editing) {
      const updated = await api.updateDish(editing.id, data);
      setDishes((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    } else {
      const created = await api.createDish(restaurantId, data);
      setDishes((prev) => [...prev, created]);
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    await api.deleteDish(id);
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleAvailable = async (dish: Dish) => {
    const updated = await api.updateDish(dish.id, {
      isAvailable: !dish.isAvailable,
    });
    setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleEdit = (dish: Dish) => {
    setEditing(dish);
    setName(dish.name);
    setDescription(dish.description || "");
    setPrice(dish.price.toString());
    setCategoryId(dish.categoryId);
    setImage(dish.image || "");
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId("");
    setImage("");
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "";

  const filtered = dishes.filter((d) => {
    if (filterCat !== "all" && d.categoryId !== filterCat) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Блюда</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {dishes.length} блюд в меню
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить блюдо
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-9"
          />
        </div>
        <Select
          value={filterCat}
          onValueChange={(v) => setFilterCat(v ?? "")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((dish) => {
          const catName = getCategoryName(dish.categoryId);
          return (
            <div
              key={dish.id}
              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-50">
                {dish.image ? (
                  <img
                    src={imgSrc(dish.image)}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UtensilsCrossed className="h-10 w-10 text-gray-200" />
                  </div>
                )}

                {/* Unavailable overlay */}
                {!dish.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                      Недоступно
                    </span>
                  </div>
                )}

                {/* Category badge */}
                {catName && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                    {catName}
                  </span>
                )}

                {/* Actions overlay */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleToggleAvailable(dish)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                    title={dish.isAvailable ? "Скрыть" : "Показать"}
                  >
                    {dish.isAvailable ? (
                      <Eye className="h-3.5 w-3.5 text-gray-600" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(dish)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {dish.name}
                </h3>
                {dish.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {dish.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-500">
                    {formatPrice(dish.price)}
                  </span>
                  {!dish.isAvailable && (
                    <span className="text-[10px] font-medium text-red-400">
                      скрыто
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <UtensilsCrossed className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Нет блюд</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать блюдо" : "Новое блюдо"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Название</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Самса"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Описание блюда..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Цена (₸)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1500"
                />
              </div>
              <div>
                <Label>Категория</Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => setCategoryId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите">
                      {categoryId
                        ? getCategoryName(categoryId)
                        : "Выберите"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Фото</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500">
                  <Upload className="h-4 w-4" />
                  Загрузить
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {image && (
                  <img
                    src={imgSrc(image)}
                    alt="preview"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
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
