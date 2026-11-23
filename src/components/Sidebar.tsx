"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Headphones,
  Users,
  GraduationCap,
  Layers,
  Coins,
  Receipt,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Clock,
  MessageSquare,
  ArrowLeft,
  Inbox,
  Bell
} from "lucide-react";
import { UserRole } from "@/lib/auth";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const currentPath = pathname || "";

  // Navigation sur mesure selon le profil actif et le chemin actuel
  const getNavItems = () => {
    if (role === "SUPER_ADMIN") {
      return [
        { label: "Vue d'ensemble SaaS", href: "/superadmin", icon: LayoutDashboard },
        { label: "Établissements", href: "/superadmin/establishments", icon: Building2 },
        { label: "Formules & Abonnements", href: "/superadmin/plans", icon: CreditCard },
        { label: "Tickets & Assistance", href: "/superadmin/support", icon: Headphones },
        { label: "Journaux d'Audit", href: "/superadmin/audit", icon: ShieldAlert }
      ];
    }

    if (role === "PARENT") {
      return [
        { label: "Mes Enfants", href: "/parent", icon: GraduationCap },
        { label: "Paiements & Reçus", href: "/parent/receipts", icon: Receipt }
      ];
    }

    // A. Tableau de bord de Présentation Globale de l'Établissement & Annuaire Équipe
    // STRICTEMENT aucun bouton de messagerie ni accès direct aux opérations internes ici
    if (currentPath === "/admin" || currentPath === "/admin/staff") {
      return [
        { label: "Tableau de bord (École)", href: "/admin", icon: LayoutDashboard },
        { label: "Équipe & Profils", href: "/admin/staff", icon: Users }
      ];
    }

    // B. Profil Administrateur Dédié (Strictement séparé du tableau de bord de présentation)
    if (currentPath.startsWith("/admin/profile")) {
      return [
        { label: "Profil Administrateur", href: "/admin/profile", icon: ShieldCheck },
        { label: "Équipe & Profils", href: "/admin/staff", icon: Users },
        { label: "← Tableau de bord (École)", href: "/admin", icon: ArrowLeft }
      ];
    }

    // C. Profil Directeur Dédié (Avec sa boîte de messagerie unique au Directeur)
    if (currentPath.startsWith("/director") || role === "DIRECTOR") {
      return [
        { label: "Tableau de bord (Directeur)", href: "/director", icon: LayoutDashboard },
        { label: "Boîte de Messagerie (Directeur)", href: "/director/messages", icon: Inbox },
        { label: "Équipe & Profils", href: "/admin/staff", icon: Users },
        { label: "← Présentation École", href: "/admin", icon: ArrowLeft }
      ];
    }

    // D. Profil Comptable Dédié (Avec sa boîte de messagerie unique au Comptable)
    if (currentPath.startsWith("/accounting") || role === "ACCOUNTANT") {
      return [
        { label: "Guichet Caisse", href: "/accounting", icon: Wallet },
        { label: "Paiements Récents", href: "/accounting/payments", icon: Receipt },
        { label: "Impayés & Relances WhatsApp", href: "/accounting/debts", icon: MessageSquare },
        { label: "Boîte de Messagerie (Comptable)", href: "/accounting/messages", icon: Inbox },
        { label: "← Présentation École", href: "/admin", icon: ArrowLeft }
      ];
    }

    // Repli : Présentation de l'établissement
    return [
      { label: "Tableau de bord (École)", href: "/admin", icon: LayoutDashboard },
      { label: "Équipe & Profils", href: "/admin/staff", icon: Users }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#14213D] text-white flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Menu Principal
        </p>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          if (item.href.startsWith("/api")) {
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white"
              >
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#0284c7] text-white shadow-lg shadow-sky-600/30 font-extrabold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white active:scale-98"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Note d'information de pied de menu */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Plateforme Togo (XOF)
        </p>
        <p className="text-[11px] leading-relaxed">
          Support Mobile Money : TMoney & Flooz intégrés au guichet.
        </p>
      </div>
    </aside>
  );
}
