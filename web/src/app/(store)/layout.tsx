import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchProvider } from "@/context/SearchContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getSiteConfig } from "@/lib/siteConfig";

export default async function StoreLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const config = await getSiteConfig();
  const telefonoWhatsapp = config?.telefono_whatsapp || "+54 9 11 3094-7663";

  return (
    <SearchProvider>
      <CartProvider>
        <Header />
        <CartDrawer telefonoWhatsapp={telefonoWhatsapp} />
        {children}
        {modal}
        <Footer />
      </CartProvider>
    </SearchProvider>
  );
}
