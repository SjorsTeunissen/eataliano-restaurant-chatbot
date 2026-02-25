"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  CalendarDays,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/orders", label: "Bestellingen", icon: ShoppingBag },
  { href: "/admin/reservations", label: "Reserveringen", icon: CalendarDays },
  { href: "/admin/settings", label: "Instellingen", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch {
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-oven/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-oven flex flex-col transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="admin-sidebar"
      >
        <div className="flex items-center justify-between px-6 py-5">
          <span className="font-headline text-xl text-crema">
            Eataliano Admin
          </span>
          <button
            className="text-crema md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Sluit menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1" role="navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-body transition-colors ${
                isActive(href)
                  ? "bg-fiamma/20 text-fiamma"
                  : "text-crema/70 hover:text-crema hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            isLoading={loggingOut}
            className="w-full justify-start text-crema/70 hover:text-crema hover:bg-white/5"
          >
            <LogOut size={18} className="mr-3" />
            Uitloggen
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-oven/8 md:px-6">
          <button
            className="text-oven md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="hidden md:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            isLoading={loggingOut}
            className="hidden md:inline-flex"
          >
            <LogOut size={16} className="mr-2" />
            Uitloggen
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 bg-crema p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
