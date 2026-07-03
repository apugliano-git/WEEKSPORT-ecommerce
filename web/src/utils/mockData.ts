import { Producto } from "@/types";

export const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Calzas" },
  { id: "cat-2", name: "Remeras" },
  { id: "cat-3", name: "Tops" },
];

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: "prod-1",
    nombre: "Calza Deportiva Pro Flex",
    descripcion: "Calza larga de lycra premium con cintura alta y costuras reforzadas. Ideal para entrenamientos de alta intensidad y running.",
    categoria_id: "cat-1",
    imagenes: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=80"],
    activo: true,
    created_at: new Date().toISOString(),
    variantes_stock: [
      { id: "v-1", producto_id: "prod-1", talle: "S", color: "Negro", cantidad: 12, precio: 18500 },
      { id: "v-2", producto_id: "prod-1", talle: "M", color: "Negro", cantidad: 15, precio: 18500 },
      { id: "v-3", producto_id: "prod-1", talle: "L", color: "Negro", cantidad: 0, precio: 18500 },
      { id: "v-4", producto_id: "prod-1", talle: "M", color: "Azul", cantidad: 5, precio: 18500 },
    ]
  },
  {
    id: "prod-2",
    nombre: "Remera Dry-Fit Aero",
    descripcion: "Remera manga corta confeccionada con tejido tecnológico respirable que mantiene la piel seca durante todo el día.",
    categoria_id: "cat-2",
    imagenes: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80"],
    activo: true,
    created_at: new Date().toISOString(),
    variantes_stock: [
      { id: "v-5", producto_id: "prod-2", talle: "S", color: "Blanco", cantidad: 20, precio: 12500 },
      { id: "v-6", producto_id: "prod-2", talle: "M", color: "Blanco", cantidad: 25, precio: 12500 },
      { id: "v-7", producto_id: "prod-2", talle: "M", color: "Negro", cantidad: 18, precio: 12500 },
    ]
  },
  {
    id: "prod-3",
    nombre: "Top Deportivo Support",
    descripcion: "Top con soporte medio, espalda deportiva cruzada y tazas desmontables. Comodidad y ajuste perfecto.",
    categoria_id: "cat-3",
    imagenes: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80"],
    activo: true,
    created_at: new Date().toISOString(),
    variantes_stock: [
      { id: "v-8", producto_id: "prod-3", talle: "S", color: "Gris", cantidad: 10, precio: 9900 },
      { id: "v-9", producto_id: "prod-3", talle: "M", color: "Gris", cantidad: 0, precio: 9900 },
      { id: "v-10", producto_id: "prod-3", talle: "L", color: "Gris", cantidad: 2, precio: 9900 }, // Stock crítico: cantidad > 0 y < 3
    ]
  }
];
