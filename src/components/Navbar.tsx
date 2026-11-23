"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Building2, 
  ShieldCheck
} from "lucide-react";
import { SessionUser, getRoleBadgeLabel } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

interface NavbarProps {
  user: SessionUser;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const roleBadge = getRoleBadgeLabel(user.role);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ecofrais_user");
        localStorage.removeItem("schoolpay_user");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
          <BrandLogo size="sm" />
        </Link>

        {user.establishmentName && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>{user.establishmentName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Badge rôle actuel */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadge.color}`}>
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          {roleBadge.label}
        </span>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#1E143E] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user.fullName ? user.fullName.charAt(0) : "U"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</p>
            <p className="text-[10px] text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Bouton Déconnexion Luminescent */}
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
