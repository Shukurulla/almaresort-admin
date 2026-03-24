"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { imgSrc } from "@/lib/format";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  FolderOpen,
  Table2,
  BarChart3,
  Building2,
  LogOut,
  ChefHat,
  Settings,
} from "lucide-react";

const adminLinks = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Заказы", icon: ClipboardList },
  { href: "/dashboard/dishes", label: "Блюда", icon: UtensilsCrossed },
  { href: "/dashboard/categories", label: "Категории", icon: FolderOpen },
  { href: "/dashboard/tables", label: "Столы", icon: Table2 },
  { href: "/dashboard/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

const systemAdminLinks = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/dashboard/restaurants", label: "Рестораны", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const restaurant = useAuth((s) => s.restaurant);
  const logout = useAuth((s) => s.logout);

  const links = user?.role === "SYSTEM_ADMIN" ? systemAdminLinks : adminLinks;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          {restaurant?.logo ? (
            <img
              src={imgSrc(restaurant.logo)}
              alt=""
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-white">
              {restaurant?.name || "MenuPro"}
            </h2>
            <p className="text-[11px] text-slate-400">{user?.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-orange-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
