import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WEEKSPORT — Indumentaria Deportiva",
    template: "%s | WEEKSPORT",
  },
  description:
    "Catálogo de indumentaria deportiva WEEKSPORT. Calzas, remeras y accesorios. Comprá online y coordiná tu pedido por WhatsApp.",
  keywords: ["indumentaria deportiva", "calzas", "remeras", "WEEKSPORT", "ropa deportiva argentina"],
  authors: [{ name: "WEEKSPORT" }],
  openGraph: {
    title: "WEEKSPORT — Indumentaria Deportiva",
    description: "Catálogo de indumentaria deportiva. Pedidos por WhatsApp.",
    type: "website",
    locale: "es_AR",
  },
};

import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0F0F12] text-white">
        <CartProvider>
          <Header />
          <CartDrawer />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
