const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hjzeamthieodscovfhjh.supabase.co";
const supabaseKey = "sb_publishable_iwTm5XylYKq6lrYrikqw7A_bLRzHWv_";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategorias() {
  console.log('--- CATEGORÍAS EN BASE DE DATOS ---');
  const { data: categorias, error: errCat } = await supabase.from('categorias').select('*');
  
  if (errCat) {
    console.error('Error obteniendo categorias:', errCat);
    return;
  }
  
  if (!categorias || categorias.length === 0) {
    console.log('No hay categorías cargadas en la BD.');
  } else {
    categorias.forEach(c => console.log(`- ID: ${c.id} | Nombre: ${c.nombre}`));
  }

  console.log('\n--- PRODUCTOS Y SUS CATEGORÍAS ---');
  const { data: productos, error: errProd } = await supabase.from('productos').select('id, nombre, categoria_id');
  if (errProd) {
    console.error('Error obteniendo productos:', errProd);
    return;
  }
  
  if (!productos || productos.length === 0) {
    console.log('No hay productos cargados en la BD.');
  } else {
    productos.forEach(p => {
      const catName = categorias?.find(c => c.id === p.categoria_id)?.nombre || 'SIN CATEGORÍA';
      console.log(`- Producto: ${p.nombre} | Categoría: ${catName} (ID: ${p.categoria_id})`);
    });
  }
}

checkCategorias();
