"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  Star,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-foreground hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 mt-1 w-48 origin-top-right rounded-xl border border-border bg-surface p-1 shadow-lg transition",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
          Painel
        </MenuLink>
        <MenuLink href="/rooms" icon={<Radio className="h-4 w-4" />}>
          Salas ao vivo
        </MenuLink>
        <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-2">
          <Star className="h-4 w-4" />
          Favoritos
          <span className="ml-auto text-[10px] uppercase">Em breve</span>
        </span>
        <MenuLink href="/settings" icon={<Settings className="h-4 w-4" />}>
          Definições
        </MenuLink>
        <button
          type="button"
          role="menuitem"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Terminar sessão
        </button>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
