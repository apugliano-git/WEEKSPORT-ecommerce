import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Running seed...");
    const correoAdmin = 'admin@weeksport.com';
    const contraseñaAdmin = 'WeekSport2026!';
  
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correoAdmin,
      password: contraseñaAdmin,
    });
  
    if (authError && authError.message !== 'User already registered') {
      console.error('Error al crear el administrador:', authError);
    }
  
    await supabase.auth.signInWithPassword({
      email: correoAdmin,
      password: contraseñaAdmin,
    });
  
    let { data: categorias } = await supabase.from('categorias').select('id, nombre');
    
    if (!categorias || categorias.length === 0) {
      const { data: nuevaCategoria } = await supabase
        .from('categorias')
        .insert([{ nombre: 'Indumentaria Deportiva', slug: 'indumentaria-deportiva' }])
        .select();
      categorias = nuevaCategoria || [];
    }
  
    const categoriaBaseId = categorias?.[0]?.id || null;
  
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
      return;
    }
  
    const loteVariantes = [];
    productosInsertados.forEach((producto) => {
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
      return;
    }
  
    console.log('Semillado exitoso.');
}

run();
