"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_LINKS } from "./Header";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className="fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-oven p-6 shadow-warm-lg">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-headline text-xl uppercase tracking-wide text-crema">
            Eataliano
          </span>
          <button
            type="button"
            className="text-crema"
            onClick={onClose}
            aria-label="Sluit menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`font-body py-2 text-lg transition-colors ${
                isActive(href)
                  ? "text-fiamma"
                  : "text-crema hover:text-fiamma"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
