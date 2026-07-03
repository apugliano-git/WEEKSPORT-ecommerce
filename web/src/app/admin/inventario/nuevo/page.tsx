'use client';

import { useState } from 'react';
import { crearArticuloCompleto, NuevaVariante } from '@/lib/inventarioService';

export default function NuevoArticuloPage() {
  // Estado base del producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<number | ''>('');
  const [categoriaId, setCategoriaId] = useState('');
  
  // Array de variantes a crear
  const [variantes, setVariantes] = useState<NuevaVariante[]>([]);
  
  // Estado volátil para el sub-formulario de variantes
  const [vSku, setVSku] = useState('');
  const [vTalle, setVTalle] = useState('');
  const [vColor, setVColor] = useState('');
  const [vStock, setVStock] = useState<number>(0);

  // Estados de interfaz y feedback
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const agregarVariante = () => {
    if (!vTalle || !vColor || vStock < 0) {
      setMensaje({ tipo: 'error', texto: 'Completá Talle, Color y un stock válido.' });
      return;
    }
    
    setVariantes([...variantes, { sku: vSku, talle: vTalle, color: vColor, stock: vStock }]);
    
    // Purga del sub-formulario
    setVSku('');
    setVTalle('');
    setVColor('');
    setVStock(0);
    setMensaje(null);
  };

  const quitarVariante = (index: number) => {
    setVariantes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !precio || !categoriaId) {
      setMensaje({ tipo: 'error', texto: 'Completá los campos obligatorios del artículo (Nombre, Precio, Categoría).' });
      return;
    }

    if (variantes.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agregá al menos una variante con stock inicial.' });
      return;
    }

    setIsLoading(true);
    setMensaje(null);

    const payload = {
      nombre,
      descripcion,
      precio: Number(precio),
      categoria_id: categoriaId,
      variantes
    };

    const result = await crearArticuloCompleto(payload);

    if (result.status === 'success') {
      setMensaje({ tipo: 'success', texto: result.message });
      // Limpiar formulario principal (Reset)
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setCategoriaId('');
      setVariantes([]);
    } else {
      setMensaje({ tipo: 'error', texto: result.message });
    }

    setIsLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Alta de Inventario: Nuevo Artículo</h1>

      {mensaje && (
        <div className={`p-4 mb-6 rounded font-semibold ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Datos Principales (Tabla productos) */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Estructura Base del Producto</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Artículo *</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Botines Tiempo Legend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría ID (UUID) *</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                placeholder="ID relacional de la categoría"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Precio Unitario Base *</label>
              <input 
                type="number"
                step="0.01" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Características, material, etc..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Lote de Variantes (Tabla variantes_stock) */}
        <div className="bg-white p-6 rounded shadow border flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Configuración y Stock Físico</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SKU (Opcional)</label>
              <input type="text" className="w-full p-2 border rounded text-sm" value={vSku} onChange={e => setVSku(e.target.value)} placeholder="SKU-XXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Talle *</label>
              <input type="text" className="w-full p-2 border rounded text-sm" value={vTalle} onChange={e => setVTalle(e.target.value)} placeholder="Ej: 42, XL" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color *</label>
              <input type="text" className="w-full p-2 border rounded text-sm" value={vColor} onChange={e => setVColor(e.target.value)} placeholder="Ej: Negro/Rojo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stock Inicial *</label>
              <input type="number" min="0" className="w-full p-2 border rounded text-sm bg-gray-50" value={vStock} onChange={e => setVStock(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          
          <button type="button" onClick={agregarVariante} className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 transition text-sm font-semibold shadow-sm mb-6">
            + Añadir Variante al Lote de Creación
          </button>

          {/* Listado del Lote */}
          <div className="flex-1 overflow-y-auto">
            {variantes.length === 0 ? (
              <p className="text-gray-400 text-sm italic text-center mt-4">Esperando variantes para inicializar...</p>
            ) : (
              <ul className="space-y-2">
                {variantes.map((v, i) => (
                  <li key={i} className="flex justify-between items-center bg-gray-50 p-3 border border-gray-200 rounded text-sm hover:shadow-sm transition">
                    <div>
                      <span className="font-bold text-gray-800 mr-2">{v.talle} - {v.color}</span>
                      {v.sku && <span className="text-gray-500 text-xs mr-2 font-mono bg-white px-1 border rounded">{v.sku}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-bold text-xs">STOCK: {v.stock}</span>
                      <button type="button" onClick={() => quitarVariante(i)} className="text-red-500 hover:text-red-700 font-bold bg-red-50 px-2 py-1 rounded">&times;</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Accionador Principal */}
        <div className="md:col-span-2 flex justify-end mt-4 pt-6 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`px-8 py-3 rounded text-white font-bold text-lg shadow transition ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
            }`}
          >
            {isLoading ? 'Inyectando Base de Datos...' : 'Guardar Artículo e Inicializar Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
