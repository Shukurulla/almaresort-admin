"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as api from "@/lib/api";
import { imgSrc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Upload, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Restaurant } from "@/types";

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  const setRestaurant = useAuth((s) => s.restaurant);
  const [restaurant, setLocal] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    if (!user?.restaurantId) return;
    api
      .getRestaurantById(user.restaurantId)
      .then((r: Restaurant) => {
        setLocal(r);
        setName(r.name);
        setDescription(r.description || "");
        setAddress(r.address || "");
        setPhone(r.phone || "");
        setLogo(r.logo || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.restaurantId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setLogo(url);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!restaurant || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateRestaurant(restaurant.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        logo: logo || undefined,
      });
      setLocal(updated);
      // Update sidebar restaurant
      useAuth.setState({ restaurant: updated });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Настройки ресторана</h1>

      <div className="mt-6 max-w-lg space-y-5">
        {/* Logo */}
        <div>
          <Label>Логотип</Label>
          <div className="mt-2 flex items-center gap-4">
            {logo ? (
              <div className="relative">
                <img
                  src={imgSrc(logo)}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover shadow-sm"
                />
                <button
                  onClick={() => setLogo("")}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={logoUploading}
                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-orange-400 hover:text-orange-400"
              >
                <Upload className="h-6 w-6" />
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoUploading && (
              <span className="text-sm text-gray-400">Загрузка...</span>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label>Название ресторана</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label>Описание</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1"
            placeholder="Краткое описание ресторана..."
          />
        </div>

        {/* Address */}
        <div>
          <Label>Адрес</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Phone */}
        <div>
          <Label>Телефон</Label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>

        {/* Save */}
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          disabled={saving || !name.trim()}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>
    </div>
  );
}
