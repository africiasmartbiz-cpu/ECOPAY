"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2 
} from "lucide-react";

function AuthForms() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Liste des établissements disponibles
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("OTHER");
  const [customSchoolName, setCustomSchoolName] = useState<string>("");

  useEffect(() => {
    const fetchEsts = async () => {
      try {
        const res = await fetch("/api/establishments");
        if (res.ok) {
          const json = await res.json();
          if (json.establishments && json.establishments.length > 0) {
            setEstablishments(json.establishments);
            setSelectedEstablishment(json.establishments[0].id);
          }
        }
      } catch (e) {}
    };
    fetchEsts();
  }, []);

  // État formulaire de connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // État formulaire d'inscription (Nouveau Directeur / École)
  const [schoolName, setSchoolName] = useState("");
  const [directorLastName, setDirectorLastName] = useState("");
  const [directorFirstName, setDirectorFirstName] = useState("");
  const [city, setCity] = useState("Lomé");
  const [phone, setPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [planCode, setPlanCode] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Soumission Connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const selectedEstObj = establishments.find(est => est.id === selectedEstablishment);
      const estNameToPass = selectedEstablishment === "OTHER" ? customSchoolName.trim() : (selectedEstObj?.name || "");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: loginEmail.trim(), 
          password: loginPassword,
          establishmentId: selectedEstablishment,
          establishmentName: estNameToPass
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Adresse email ou mot de passe incorrect.");
        setLoginLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("ecofrais_user", JSON.stringify(data.user));
        localStorage.setItem("schoolpay_user", JSON.stringify(data.user));
        window.location.href = data.redirectUrl || "/";
      }
    } catch (err) {
      setLoginError("Erreur technique de connexion.");
      setLoginLoading(false);
    }
  };

  // Soumission Inscription Nouvel Établissement
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const emailToUse = regEmail.trim();
    const passToUse = regPassword.trim();

    if (!emailToUse || !passToUse) {
      setRegError("Veuillez renseigner votre adresse e-mail et un mot de passe.");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: schoolName.trim() || `Complexe Scolaire ${directorLastName.trim() || "Excellence"}`,
          directorFirstName: directorFirstName.trim() || "Fondateur",
          directorLastName: directorLastName.trim() || "Promoteur",
          city: city.trim() || "Lomé",
          phone: phone.trim() || "+228 90 12 34 56",
          email: emailToUse,
          password: passToUse,
          planCode,
          billingCycle: planCode === "YEARLY" ? "YEARLY" : "MONTHLY",
          role: "ESTABLISHMENT_ADMIN"
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRegError(data.error || "Erreur lors de la création de l'établissement.");
        setRegLoading(false);
        return;
      }

      // Redirection immédiate vers le dashboard école créé
      if (typeof window !== "undefined") {
        localStorage.setItem("ecofrais_user", JSON.stringify(data.user));
        localStorage.setItem("schoolpay_user", JSON.stringify(data.user));
        window.location.href = data.redirectUrl || "/admin";
      }
    } catch (err) {
      setRegError("Erreur technique lors de la création du compte.");
      setRegLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/10 border border-slate-100">
        
        {/* En-tête avec logo Eco~frais et onglets */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" showSubtitle={true} />
          </div>
          <h2 className="text-2xl font-black text-[#1E143E] tracking-tight">
            Accès Plateforme ECO & FRAIS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Application de Gestion Scolaire, écolages par tranches et finances (Togo & UEMOA)
          </p>

          {/* BANNIÈRE SPÉCIALE ACCÈS PARENTS (WHATSAPP SANS MOT DE PASSE) */}
          <div className="mt-4">
            <Link
              href="/parent/login"
              className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md hover:from-emerald-500 hover:to-teal-600 transition-all group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-xl">👨‍👩‍👦</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>Espace Parents & Tuteurs</span>
                    <span className="px-2 py-0.5 bg-white text-emerald-800 text-[9px] font-black rounded-full">
                      WhatsApp Direct
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Consultez la scolarité de vos enfants et payez sans mot de passe
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Onglets de sélection pour les Établissements */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mt-4">
            <button
              type="button"
              onClick={() => { setActiveTab("LOGIN"); setLoginError(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "LOGIN"
                  ? "bg-white text-[#5D3CF2] shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              J'ai déjà un compte (Connexion)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("REGISTER"); setRegError(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "REGISTER"
                  ? "bg-[#5D3CF2] text-white shadow-md btn-glow-purple font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nouveau Directeur ? (Créer un compte)
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ONGLET 1 : FORMULAIRE DE CONNEXION                             */}
        {/* ============================================================== */}
        {activeTab === "LOGIN" && (
          <div>
            {loginError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Nom de l'établissement scolaire */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#5D3CF2]" />
                    <span>Nom de l'établissement scolaire * :</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold lowercase">sélectionnez ou saisissez</span>
                </label>
                {establishments.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedEstablishment}
                      onChange={e => setSelectedEstablishment(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] cursor-pointer"
                    >
                      {establishments.map(est => (
                        <option key={est.id} value={est.id}>
                          {est.name} ({est.city || "Togo"})
                        </option>
                      ))}
                      <option value="OTHER">➕ Autre établissement (Saisir un autre nom)...</option>
                    </select>

                    {selectedEstablishment === "OTHER" && (
                      <div className="relative animate-in fade-in">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={customSchoolName}
                          onChange={e => setCustomSchoolName(e.target.value)}
                          placeholder="Saisissez le nom officiel de votre école..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={customSchoolName}
                      onChange={e => setCustomSchoolName(e.target.value)}
                      placeholder="Ex: Complexe Scolaire L'Excellence, Collège Protestant..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Adresse e-mail :
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="directeur@etablissement.tg"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mot de passe :
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading || !loginEmail || !loginPassword}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#5D3CF2] hover:bg-[#4E2DE3] active:scale-[0.98] text-white font-black text-sm shadow-xl btn-glow-purple cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loginLoading ? "Connexion en cours..." : "Se connecter"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("REGISTER")}
                  className="text-xs text-[#5D3CF2] hover:underline font-bold"
                >
                  Nouveau Directeur ou Établissement ? Créer un compte
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* ONGLET 2 : FORMULAIRE D'INSCRIPTION D'UN ÉTABLISSEMENT         */}
        {/* ============================================================== */}
        {activeTab === "REGISTER" && (
          <div>
            <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
              🏢 <strong>Création du Compte Établissement (Promoteur / Fondateur) :</strong>
              <p className="text-[11px] text-indigo-700 mt-1">
                Renseignez le nom, l'email et le numéro officiel de l'école. Dès votre inscription, vous pourrez créer au sein de votre espace les profils individuels de votre <strong>Directeur</strong>, <strong>Comptable / Caisse</strong> et <strong>Administrateur</strong> avec leurs propres identifiants.
              </p>
            </div>

            {regError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              {/* Nom de l'établissement */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom officiel de l'établissement scolaire * :
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="Ex: Complexe Scolaire L'Excellence"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
              </div>

              {/* Nom & Prénom du promoteur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nom du Promoteur / Fondateur * :
                  </label>
                  <input
                    type="text"
                    required
                    value={directorLastName}
                    onChange={e => setDirectorLastName(e.target.value)}
                    placeholder="Ex: AMEGASSI"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Prénom(s) du Promoteur * :
                  </label>
                  <input
                    type="text"
                    required
                    value={directorFirstName}
                    onChange={e => setDirectorFirstName(e.target.value)}
                    placeholder="Ex: Koffi Marc"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
              </div>

              {/* Ville et Téléphone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ville (Togo) :
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Lomé"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Téléphone officiel de l'école * :
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+228 90 12 34 56"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Email officiel de l'école */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Adresse e-mail officielle (Identifiant maître du compte) * :
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="direction@votre-ecole.tg"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Cet email servira d'accès administrateur maître pour configurer vos équipes et profils.
                </p>
              </div>

              {/* Mot de passe maître */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mot de passe maître du compte * :
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Créez un mot de passe sécurisé"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] outline-none"
                  />
                </div>
              </div>

              {/* Formule d'abonnement */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Formule d'abonnement souhaitée :
                </label>
                <select
                  value={planCode}
                  onChange={e => setPlanCode(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                >
                  <option value="MONTHLY">Abonnement Mensuel : 5 000 FCFA / mois</option>
                  <option value="YEARLY">Abonnement Annuel : 50 000 FCFA / an (2 mois offerts)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm shadow-xl btn-glow-green cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{regLoading ? "Création en cours..." : "Créer mon Établissement & Accéder à mon Dashboard"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("LOGIN")}
                  className="text-xs text-[#5D3CF2] hover:underline font-bold"
                >
                  Vous avez déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-slate-800 flex flex-col justify-between selection:bg-[#5D3CF2] selection:text-white relative overflow-hidden">
      {/* Motifs géométriques décoratifs légers */}
      <div className="absolute top-12 left-10 w-24 h-24 rounded-full bg-orange-400/10 blur-xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none"></div>

      {/* Barre de navigation */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <BrandLogo size="md" showSubtitle={false} />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/parent/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <span>👨‍👩‍👧 Espace Parents (WhatsApp)</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-[#0284c7] transition-colors hidden sm:inline"
          >
            ← Accueil
          </Link>
          <span className="px-3 py-1 rounded-full bg-sky-50 text-[#0284c7] border border-sky-100 text-xs font-bold">
            Togo • XOF
          </span>
        </div>
      </header>

      {/* Contenu Principal avec les deux modes */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <Suspense fallback={<div className="text-xs text-slate-400 font-medium">Chargement du formulaire...</div>}>
          <AuthForms />
        </Suspense>
      </main>

      {/* Pied de page discret */}
      <footer className="py-6 text-center text-xs text-slate-400">
        <p>© 2025 ECO & FRAIS (Eco~frais). Application professionnelle de gestion scolaire & financière.</p>
      </footer>
    </div>
  );
}
