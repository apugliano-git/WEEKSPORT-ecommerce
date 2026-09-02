import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchProvider } from "@/context/SearchContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { createClient } from "@/lib/supabase/server";

export default async function StoreLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("configuracion_sitio")
    .select("telefono_whatsapp")
    .eq("id", 1)
    .maybeSingle();
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
