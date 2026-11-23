import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECO & FRAIS — Application de Gestion Scolaire & Recouvrement (Togo & UEMOA)",
  description: "Application professionnelle tout-en-un de gestion scolaire, écolages par tranches, encaissements TMoney/Flooz/Espèces, reçus PDF et relances WhatsApp pour écoles privées.",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
