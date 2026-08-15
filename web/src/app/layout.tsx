import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#0F0F12",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://weeksport.vercel.app"),
  title: {
    default: "WEEKSPORT — Indumentaria Deportiva",
    template: "%s | WEEKSPORT",
  },
  description:
    "Catálogo de indumentaria deportiva WEEKSPORT. Calzas, remeras y accesorios. Comprá online y coordiná tu pedido por WhatsApp.",
  keywords: ["indumentaria deportiva", "calzas", "remeras", "WEEKSPORT", "ropa deportiva argentina"],
  authors: [{ name: "WEEKSPORT" }],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WEEKSPORT",
  },
  openGraph: {
    title: "WEEKSPORT — Indumentaria Deportiva",
    description: "Catálogo de indumentaria deportiva. Pedidos por WhatsApp.",
    url: "https://weeksport.vercel.app",
    siteName: "WEEKSPORT",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "WEEKSPORT Logo",
      },
    ],
    type: "website",
    locale: "es_AR",
  },
};

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
      <body className="min-h-full bg-[#0F0F12] text-white">
        {children}
      </body>
    </html>
  );
}
