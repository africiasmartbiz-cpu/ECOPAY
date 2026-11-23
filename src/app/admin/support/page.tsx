"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Headphones, Send, Plus, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AdminSupportPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage,
          priority: newPriority
        })
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewSubject("");
        setNewMessage("");
        await loadTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;

    try {
      const res = await fetch("/api/support/tickets", {
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
        <p className="text-xs font-semibold text-slate-500">Chargement de l'assistance...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Assistance & Support ECO & FRAIS
              </h1>
              <p className="text-xs text-slate-500">
                Contact direct avec l'équipe technique de la plateforme
              </p>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ouvrir un Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Mes Demandes</h3>
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun ticket ouvert.</p>
              ) : (
                tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTicket?.id === t.id
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{t.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{formatDate(t.createdAt)}</p>
                  </div>
                ))
              )}
            </div>

            {/* Conversation du ticket */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Priorité : {selectedTicket.priority}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Par {selectedTicket.creatorName} le {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {/* Message initial */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900">{selectedTicket.creatorName}</p>
                      <p className="text-slate-700 mt-1 leading-relaxed">{selectedTicket.message}</p>
                    </div>

                    {/* Réponses */}
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

                  {/* Formulaire de réponse */}
                  <form onSubmit={handleSendReply} className="pt-4 border-t flex gap-2">
                    <input
                      type="text"
                      placeholder="Écrire une réponse..."
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      className="flex-1 text-xs p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Sélectionnez un ticket pour voir la discussion.
                </div>
              )}
            </div>
          </div>

          {/* Modal Nouveau Ticket */}
          {showNewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border">
                <h3 className="font-bold text-base text-slate-900">Nouvelle demande d'assistance</h3>
                <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700">Objet de la demande :</label>
                    <input
                      type="text"
                      required
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="Ex: Demande de formation des caissiers"
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Priorité :</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value)}
                      className="w-full p-2 border rounded-lg outline-none"
                    >
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Description détaillée :</label>
                    <textarea
                      rows={4}
                      required
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Expliquez votre problème ou besoin..."
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Envoyer le ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
