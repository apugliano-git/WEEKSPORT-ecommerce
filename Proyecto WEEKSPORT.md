# **DOCUMENTO DE ESPECIFICACIÓN DE REQUERIMIENTOS Y ARQUITECTURA (DERA)**

**Proyecto:** Plataforma Web E-commerce – WEEKSPORT (Fase 1\)

**Autor:** \[Tu Nombre\]

**Fecha:** Junio 2026

## **1\. INTRODUCCIÓN Y OBJETIVOS**

### **1.1. Propósito del Sistema**

El sistema tiene como objetivo digitalizar el catálogo de indumentaria deportiva de **WEEKSPORT**, permitiendo a los clientes preseleccionar productos a través de un carrito de compras y enviar el pedido estructurado directamente al WhatsApp comercial. Asimismo, proveerá un panel privado para que las administradoras gestionen el stock físico y validen las ventas en tiempo real.

### **1.2. Objetivos de Ingeniería**

* **Costo de Infraestructura:** $0 (uso exclusivo de capas gratuitas en entornos Cloud y Serverless).  
* **Seguridad:** Implementación de políticas de acceso estictas a nivel de base de datos (RLS) y autenticación JWT.  
* **Escalabilidad:** Arquitectura preparada para soportar picos de hasta 50 usuarios concurrentes sin degradación del servicio.

## **2\. ARQUITECTURA TECNOLÓGICA (STACK)**

* **Frontend (UI):** \[Framework a definir, ej: Next.js / React / Vue\] alojado en **Vercel** o **Netlify** bajo subdominio gratuito (`weeksport.vercel.app`) con SSL automático.  
* **Backend & Base de Datos:** **Supabase (PostgreSQL)** para persistencia de datos y lógica de seguridad.  
* **Autenticación:** **Supabase Auth** (Manejo de sesiones de administrador mediante JWT).  
* **Almacenamiento (Storage):** **Supabase Buckets** para el alojamiento y entrega de las imágenes de los productos (Calzas, Remeras, etc.).  
* **Integraciones Externas:** WhatsApp Business API (vía enlaces dinámicos `wa.me`).

## **3\. ESPECIFICACIÓN DE REQUERIMIENTOS**

### **3.1. Requerimientos Funcionales (Módulo Usuario / E-commerce)**

* **RF-01 (Catálogo Dinámico):** El sistema debe listar los productos agrupados por categorías (`calzas`, `remeras, accesorios deportivos, etc`).  
* **RF-02 (Filtros):** El usuario podrá filtrar los productos por talle, color y categoría.  
* **RF-03 (Gestión de Carrito):** El usuario podrá añadir, modificar cantidades y eliminar productos de un carrito local (persistido en `localStorage`).  
* **RF-04 (Checkout síncrono por WhatsApp):** Al presionar "Confirmar compra por WhatsApp", el sistema debe capturar un input de texto con el nombre del usuario y abrir una nueva pestaña con la URL de WhatsApp codificada (URL Encode) con la estructura del mensaje predefinida.

### **3.2. Requerimientos Funcionales (Módulo Administrador / Backoffice)**

* **RF-05 (Autenticación):** Acceso restringido mediante login (Email/Password) exclusivo para administradoras.  
* **RF-06 (Control de Inventario):** Pantalla para visualizar el stock crítico, editar cantidades, precios, descripciones y dar de alta nuevos productos (subiendo la foto directamente al Storage).  
* **RF-07 (Validación de Venta manual):** Módulo donde la administradora, tras confirmar el pago por WhatsApp con el cliente, pueda seleccionar los productos vendidos y presionar "Validar Compra", ejecutando una transacción que descuente las unidades correspondientes en la base de datos.

### **3.3. Requerimientos No Funcionales (RNF)**

* **RNF-01 (Seguridad \- RLS):** La base de datos debe tener activado *Row Level Security*. Las tablas solo permitirán peticiones de lectura (`SELECT`) a usuarios anónimos. Las peticiones de escritura (`INSERT`, `UPDATE`, `DELETE`) requerirán un token de administrador válido.  
* **RNF-02 (Rendimiento):** El tiempo de carga inicial de la página no debe superar los 2 segundos, optimizando las imágenes del Storage.

## **4\. MODELO DE DATOS (ESQUEMA POSTGRESQL)**

Para mapear correctamente la estructura en Supabase, se definen provisionalmente las siguientes tablas:

### **4.1. Tabla: `productos`**

Instancia principal que define el modelo de la indumentaria.

* `id` (UUID, Primary Key)  
* `nombre` (VARCHAR)  
* `descripcion` (TEXT)  
* `categoria` (VARCHAR) — *Ej: 'calzas', 'remeras'*  
* `precio` (NUMERIC)  
* `url_imagen` (TEXT) — *URL pública provista por el Bucket de Supabase*  
* `created_at` (TIMESTAMP)

### **4.2. Tabla: `variantes_stock`**

Dado que una remera puede tener stock en talle S pero no en talle M, el stock se maneja en una tabla relacional de cardinalidad 1:N respecto a productos.

* `id` (UUID, Primary Key)  
* `producto_id` (UUID, Foreign Key \-\> `productos.id` ON DELETE CASCADE)  
* `talle` (VARCHAR) — *Ej: 'S', 'M', 'L'*  
* `color` (VARCHAR)  
* `cantidad` (INTEGER) — *Stock físico disponible*

## **5\. ESPECIFICACIÓN DE MÓDULOS CRÍTICOS**

### **5.1. Algoritmo del Link de WhatsApp (Script Frontend)**

El script que maneja el evento `onClick` del checkout debe formatear los datos del `localStorage` de la siguiente manera:

JavaScript  
const enviarPedidoWhatsApp \= (nombreUsuario, carrito) \=\> {  
  const telefonoAdmin \= "54911XXXXXXXX"; // Número de la dueña con código de país  
    
  let mensaje \= \`¡Hola\!, mi nombre es ${nombreUsuario} y estoy interesado/a en estos productos:\\n\`;  
    
  carrito.forEach(item \=\> {  
    mensaje \+= \`- ${item.nombre} (Talle: ${item.talle}, Color: ${item.color}) x${item.cantidad}\\n\`;  
  });  
    
  mensaje \+= \`\\n¿Podrías darme detalles así pactamos la compra?\`;  
    
  // Codificar el texto para que sea válido en una URL  
  const mensajeCodificado \= encodeURIComponent(mensaje);  
    
  // Abrir la API de WhatsApp  
  window.open(\`https://wa.me/${telefonoAdmin}?text=${mensajeCodificado}\`, '\_blank');  
};  
