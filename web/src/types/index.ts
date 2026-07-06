export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
}

export interface VarianteStock {
  id: string;
  producto_id: string;
  talle: string;
  color: string;
  cantidad: number;
  precio: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  imagenes: string[];
  activo: boolean;
  genero?: string;
  created_at: string;
  variantes_stock?: VarianteStock[];
}

export interface CartItem {
  variante_id: string;
  producto: Producto;
  variante: VarianteStock;
  cantidad: number;
}
