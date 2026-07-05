'use client';

import { useState } from 'react';
// Asegurate que la ruta de importación coincida con donde guardaste el archivo de servicio
import { procesarVentaAtomicamente, VentaItem } from '@/lib/ventasService';

export default function AdminVentasPage() {
  const [carrito, setCarrito] = useState<VentaItem[]>([]);
  const [varianteIdInput, setVarianteIdInput] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  // Funcionalidad de carrito en memoria para agrupar ítems
  const handleAgregarAlCarrito = () => {
    if (!varianteIdInput || cantidadInput <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingrese un ID de variante válido y una cantidad mayor a 0.' });
      return;
    }

    setCarrito(prev => {
      // Si la variante ya está en el carrito, sumar cantidad en lugar de duplicar fila
      const index = prev.findIndex(item => item.variante_id === varianteIdInput);
      if (index !== -1) {
        const nuevoCarrito = [...prev];
        nuevoCarrito[index].cantidad += cantidadInput;
        return nuevoCarrito;
      }
      return [...prev, { variante_id: varianteIdInput, cantidad: cantidadInput }];
    });
    
    // Resetear inputs para el siguiente escaneo/ingreso
    setVarianteIdInput('');
    setCantidadInput(1);
    setMensaje(null);
  };

  const handleRemoverDelCarrito = (variante_id: string) => {
    setCarrito(prev => prev.filter(item => item.variante_id !== variante_id));
  };

  // Enviar el payload al servicio RPC de Base de datos
  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'El carrito está vacío. Agregue productos para procesar la venta.' });
      return;
    }

    setIsLoading(true);
    setMensaje({ tipo: 'info', texto: 'Iniciando transacción segura en PostgreSQL...' });

    try {
      const resultado = await procesarVentaAtomicamente(carrito);

      if (resultado.status === 'success') {
        setMensaje({ 
          tipo: 'success', 
          texto: `Venta confirmada exitosamente. ID de operación transaccional: ${resultado.venta_id}` 
        });
        setCarrito([]); // Purga el carrito tras commit exitoso
      } else {
        setMensaje({ 
          tipo: 'error', 
          texto: `Fallo atómico (Rollback ejecutado): ${resultado.message} (Cód: ${resultado.errorCode || 'N/A'})` 
        });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error crítico de red o servidor. Verifique consola.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Módulo Administrativo de Ventas (RF-10)</h1>

      {/* Panel de retroalimentación del sistema transaccional */}
      {mensaje && (
        <div className={`p-4 mb-6 rounded font-medium ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          mensaje.tipo === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Ingreso de productos al búfer */}
      <div className="bg-white p-6 rounded shadow mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Ingresar Variante Vendida</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700">ID de Variante (UUID)</label>
            <input 
              id="variante-id"
              name="variante_id"
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={varianteIdInput}
              onChange={(e) => setVarianteIdInput(e.target.value)}
              placeholder="Ej: 550e8400-e29b-41d4-a716-446655440000"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1 text-gray-700">Cantidad</label>
            <input 
              id="cantidad"
              name="cantidad"
              type="number" 
              min="1"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={cantidadInput}
              onChange={(e) => setCantidadInput(parseInt(e.target.value) || 1)}
            />
          </div>
          <button 
            onClick={handleAgregarAlCarrito}
            className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Tabla de pre-visualización de Commit */}
      <div className="bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Payload de Venta Actual</h2>
        
        {carrito.length === 0 ? (
          <p className="text-gray-500 italic">Esperando productos para iniciar transacción...</p>
        ) : (
          <div>
            <table className="w-full mb-6 text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-2 text-gray-600">Variante ID</th>
                  <th className="py-2 text-gray-600">Cantidad a descontar</th>
                  <th className="py-2 text-right text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 font-mono text-sm text-gray-700">{item.variante_id}</td>
                    <td className="py-3 font-semibold text-gray-800">{item.cantidad}</td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => handleRemoverDelCarrito(item.variante_id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button 
                onClick={handleConfirmarVenta}
                disabled={isLoading}
                className={`px-6 py-3 rounded font-bold text-white transition shadow-sm ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow'
                }`}
              >
                {isLoading ? 'Ejecutando Transacción...' : 'Confirmar Venta y Reducir Stock Físico'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
