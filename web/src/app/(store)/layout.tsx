import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { SearchProvider } from "@/context/SearchContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <CartProvider>
        <Header />
        <CartDrawer />
        {children}
      </CartProvider>
    </SearchProvider>
  );
}
