"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Headphones, Send, Building2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function SuperAdminSupportPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const loadTickets = async () => {
    try {
      let user: any = null;
      try {
        const meRes = await apiFetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          user = meData.user;
        }
      } catch (e) {}

        if (!user && typeof window !== "undefined") {
          const saved = (localStorage.getItem("ecofrais_user") || localStorage.getItem("schoolpay_user"));
          if (saved) user = JSON.parse(saved);
        }

        if (!user) {
          window.location.href = "/login";
          return;
        }

        if (user.role !== "SUPER_ADMIN") {
          window.location.href = "/";
          return;
        }

        setCurrentUser(user);

      const res = await apiFetch("/api/support/tickets");
      const json = await res.json();
      setTickets(json.tickets || []);
      if (json.tickets && json.tickets.length > 0) {
        setSelectedTicket(json.tickets[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;

    try {
      const res = await apiFetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLY",
          ticketId: selectedTicket.id,
          message: replyMessage
        })
      });
      if (res.ok) {
        setReplyMessage("");
        await loadTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xs font-semibold text-slate-500">Chargement du centre d'assistance SaaS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="SUPER_ADMIN" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div>
            <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
              Gestion des Demandes de Support des Établissements
            </h1>
            <p className="text-xs text-slate-500">
              Réponses aux tickets, assistance technique et accompagnement des écoles
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tous les Tickets</h3>
              {tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-purple-600" />
                    {t.schoolName}
                  </p>
                  <p className="font-bold mt-1 text-slate-900 truncate">{t.subject}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-400">{formatDate(t.createdAt)}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Établissement : {selectedTicket.schoolName}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Par {selectedTicket.creatorName} • Priorité : {selectedTicket.priority}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900">{selectedTicket.creatorName} ({selectedTicket.schoolName})</p>
                      <p className="text-slate-700 mt-1 leading-relaxed">{selectedTicket.message}</p>
                    </div>

                    {selectedTicket.replies?.map((r: any) => (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-xl text-xs ${
                          r.isAdmin
                            ? "bg-purple-50 border border-purple-200 text-purple-900"
                            : "bg-blue-50 border border-blue-200 text-blue-900"
                        }`}
                      >
                        <p className="font-bold">{r.senderName} {r.isAdmin && "• Support ECO & FRAIS"}</p>
                        <p className="mt-1 leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendReply} className="pt-4 border-t flex gap-2">
                    <input
                      type="text"
                      placeholder="Répondre à l'école en tant que Super-Administrateur..."
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      className="flex-1 text-xs p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-purple-600"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Sélectionnez un ticket pour y répondre.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
