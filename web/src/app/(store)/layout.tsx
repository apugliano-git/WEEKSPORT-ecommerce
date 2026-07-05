import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <CartDrawer />
      {children}
    </CartProvider>
  );
}
