"use client";

import { useEffect, useState, useRef } from "react";
import * as api from "@/lib/api";
import { imgSrc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, toRawPhone } from "@/components/ui/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Upload, X, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Restaurant } from "@/types";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState<Restaurant | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getRestaurants().then(setRestaurants).catch(() => {});
  }, []);

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setter(url);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const resetCreateForm = () => {
    setName("");
    setAddress("");
    setPhone("");
    setLogo("");
    setAdminName("");
    setAdminPhone("");
    setAdminPassword("");
  };

  const handleCreate = async () => {
    if (!name || !adminName || !adminPhone || !adminPassword) return;
    try {
      const restaurant = await api.createRestaurant({
        name,
        address: address || undefined,
        phone: phone ? toRawPhone(phone) : undefined,
        logo: logo || undefined,
        adminName,
        adminPhone: toRawPhone(adminPhone),
        adminPassword,
      });
      setRestaurants((prev) => [restaurant, ...prev]);
      setCreating(false);
      resetCreateForm();
      toast.success("Ресторан создан");
    } catch {
      toast.error("Ошибка создания");
    }
  };

  const openEdit = (r: Restaurant) => {
    setEditing(r);
    setEditName(r.name);
    setEditAddress(r.address || "");
    setEditPhone(r.phone || "");
    setEditLogo(r.logo || "");
  };

  const handleEdit = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateRestaurant(editing.id, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
        logo: editLogo || undefined,
      });
      setRestaurants((prev) =>
        prev.map((r) => (r.id === editing.id ? updated : r))
      );
      setEditing(null);
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteRestaurant(deleting.id);
      setRestaurants((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
      toast.success("Ресторан удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const logoUploadBlock = (
    currentLogo: string,
    setCurrentLogo: (v: string) => void,
    uploading: boolean,
    setUploading: (v: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) => (
    <div>
      <Label>Логотип</Label>
      <div className="mt-1 flex items-center gap-3">
        {currentLogo ? (
          <div className="relative">
            <img
              src={imgSrc(currentLogo)}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              onClick={() => setCurrentLogo("")}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-orange-400 hover:text-orange-400"
          >
            <Upload className="h-5 w-5" />
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleLogoUpload(e, setCurrentLogo, setUploading, ref)}
        />
        {uploading && <span className="text-xs text-gray-400">Загрузка...</span>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рестораны</h1>
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Создать ресторан
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <Card key={r.id} className="group relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {r.logo ? (
                  <img
                    src={imgSrc(r.logo)}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-500">
                    {r.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{r.name}</span>
                    <Badge
                      variant={r.isActive ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {r.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {r.address && (
                <p className="text-sm text-gray-500">{r.address}</p>
              )}
              {r.phone && <p className="text-sm text-gray-500">{r.phone}</p>}
              <p className="mt-1 text-xs text-gray-400">Slug: {r.slug}</p>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => openEdit(r)}
                >
                  <Pencil className="mr-1.5 h-3 w-3" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setDeleting(r)}
                >
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новый ресторан</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {logoUploadBlock(logo, setLogo, logoUploading, setLogoUploading, fileRef)}
            <div>
              <Label>Название ресторана</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Адрес</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Телефон ресторана</Label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <hr />
            <p className="text-sm font-medium">Админ ресторана</p>
            <div>
              <Label>Имя администратора</Label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div>
              <Label>Телефон администратора</Label>
              <PhoneInput value={adminPhone} onChange={setAdminPhone} />
            </div>
            <div>
              <Label>Пароль администратора</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Отмена
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleCreate}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать: {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {logoUploadBlock(editLogo, setEditLogo, editLogoUploading, setEditLogoUploading, editFileRef)}
            <div>
              <Label>Название</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Адрес</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div>
              <Label>Телефон</Label>
              <PhoneInput value={editPhone} onChange={setEditPhone} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              disabled={saving}
              onClick={handleEdit}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ресторан?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Вы уверены, что хотите удалить <strong>{deleting?.name}</strong>? Это действие нельзя отменить.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
