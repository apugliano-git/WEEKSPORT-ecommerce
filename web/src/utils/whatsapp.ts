import { CartItem } from '@/types'

export const procesarCheckoutWhatsApp = (nombreCliente: string, cart: CartItem[]) => {
  // NOTA: Reemplazar con el número real de WhatsApp de la tienda. Debe contener solo números (sin '+', '-' ni letras) para evitar errores 404 de resolución de WhatsApp.
  const TELEFONO = "5491122334455"; 
  
  let mensaje = `¡Hola!, mi nombre es ${nombreCliente.trim()} y estoy interesado/a en estos productos:\n\n`;
  
  let totalPrice = 0;

  cart.forEach(item => {
    const subtotal = item.variante.precio * item.cantidad;
    totalPrice += subtotal;
    // Formatear precio para mejor legibilidad
    const formattedPrice = subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    mensaje += `• ${item.producto.nombre} (Talle: ${item.variante.talle}, Color: ${item.variante.color}) x${item.cantidad} - ${formattedPrice}\n`;
  });
  
  const formattedTotal = totalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  mensaje += `\nTotal estimado: ${formattedTotal}\n`;
  mensaje += `\n¿Podrías darme detalles así pactamos el pago y la entrega?`;
  
  // Utilizar encodeURIComponent para garantizar que los saltos de línea y caracteres especiales viajen correctamente en la URL
  const url = `https://wa.me/${TELEFONO}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};
