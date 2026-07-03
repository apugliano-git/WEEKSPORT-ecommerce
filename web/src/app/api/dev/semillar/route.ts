import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Inyección de Usuario Administrador en Supabase Auth
    const correoAdmin = 'admin@weeksport.com';
    const contraseñaAdmin = 'WeekSport2026!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correoAdmin,
      password: contraseñaAdmin,
    });

    if (authError && authError.message !== 'User already registered') {
      console.error('Error al crear el administrador:', authError);
      return NextResponse.json(
        { 
          error: 'Fallo al crear el usuario administrador.', 
          detalle: authError?.message || authError 
        }, 
        { status: 400 }
      );
    }

    // Opcional: intentamos iniciar sesión para obtener los tokens locales 
    // y saltar posibles políticas de seguridad (RLS) en las siguientes inserciones.
    await supabase.auth.signInWithPassword({
      email: correoAdmin,
      password: contraseñaAdmin,
    });

    // 2. Obtener categorías existentes (o crear una por defecto si no existen)
    let { data: categorias } = await supabase.from('categorias').select('id, nombre');
    
    if (!categorias || categorias.length === 0) {
      const { data: nuevaCategoria } = await supabase
        .from('categorias')
        .insert([{ nombre: 'Indumentaria Deportiva', slug: 'indumentaria-deportiva' }])
        .select();
      categorias = nuevaCategoria || [];
    }

    const categoriaBaseId = categorias?.[0]?.id || null;

    // 3. Población del Catálogo (Tabla `productos`)
    const productosDePrueba = [
      {
        nombre: 'Calza Pro Deportiva Premium',
        descripcion: 'Calza de alta compresión en color negro profundo, ideal para entrenamientos de alto impacto.',
        activo: true,
        imagenes: ['https://placehold.co/600x800/0A0A0C/FF5C00/png?text=Calza+Premium'],
        categoria_id: categoriaBaseId
      },
      {
        nombre: 'Top Elastic Black',
        descripcion: 'Top deportivo con agarre elástico y detalles naranjas, transpirable y ligero.',
        activo: true,
        imagenes: ['https://placehold.co/600x800/0A0A0C/FF5C00/png?text=Top+Elastic'],
        categoria_id: categoriaBaseId
      },
      {
        nombre: 'Remera Oversize Entrenamiento',
        descripcion: 'Remera holgada con tejido técnico, máximo confort y absorción de sudor.',
        activo: true,
        imagenes: ['https://placehold.co/600x800/0A0A0C/FF5C00/png?text=Remera+Oversize'],
        categoria_id: categoriaBaseId
      }
    ];

    const { data: productosInsertados, error: productosError } = await supabase
      .from('productos')
      .insert(productosDePrueba)
      .select();

    if (productosError || !productosInsertados) {
      console.error('Error insertando productos:', productosError);
      return NextResponse.json(
        { 
          error: 'Fallo al insertar los productos de prueba.', 
          detalle: productosError?.message || productosError 
        }, 
        { status: 400 }
      );
    }

    // 4. Población de Variantes de Stock (Tabla `variantes_stock`)
    const loteVariantes: any[] = [];

    productosInsertados.forEach((producto) => {
      // Por cada producto, inyectamos combinaciones reales de talles, colores, cantidades y precio
      loteVariantes.push(
        { producto_id: producto.id, talle: 'S', color: 'Negro', cantidad: 12, precio: 35000 },
        { producto_id: producto.id, talle: 'M', color: 'Negro', cantidad: 20, precio: 35000 },
        { producto_id: producto.id, talle: 'L', color: 'Naranja', cantidad: 8, precio: 35000 }
      );
    });

    const { error: variantesError } = await supabase
      .from('variantes_stock')
      .insert(loteVariantes);

    if (variantesError) {
      console.error('Error insertando variantes:', variantesError);
      return NextResponse.json(
        { 
          error: 'Fallo al insertar la matriz de stock.', 
          detalle: variantesError?.message || variantesError 
        }, 
        { status: 400 }
      );
    }

    // 5. Retorno de Control Institucional
    return NextResponse.json({
      mensaje: '¡Operación de semillado exitosa! Entorno de desarrollo preparado.',
      credenciales: {
        correo: correoAdmin,
        contraseña: contraseñaAdmin,
        nota: 'Por favor, resguarde estas credenciales y elimine esta ruta (route.ts) para proteger el entorno.'
      },
      registros: {
        productos_creados: productosInsertados.length,
        variantes_inyectadas: loteVariantes.length
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Excepción crítica en el proceso de semillado', detalle: err.message }, { status: 500 });
  }
}
