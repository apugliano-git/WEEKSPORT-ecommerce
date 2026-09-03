// Run with PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node supabase/tests/creation-stock.mjs
// Uses an isolated in-memory database, never the connected Supabase project.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    CREATE TYPE public.tipo_talle AS ENUM ('estandar');
    CREATE TYPE public.genero_producto AS ENUM ('Unisex');
    CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS 'SELECT true';
    CREATE TABLE public.categorias (id uuid PRIMARY KEY);
    INSERT INTO public.categorias VALUES ('00000000-0000-0000-0000-000000000001');
    CREATE TABLE public.talles_por_tipo (tipo_talle public.tipo_talle, talle text, orden integer);
    INSERT INTO public.talles_por_tipo VALUES ('estandar','S',1), ('estandar','M',2), ('estandar','L',3);
    CREATE TABLE public.productos (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, nombre text, descripcion text, categoria_id uuid, genero public.genero_producto, tipo_talle public.tipo_talle, imagenes text[], activo boolean);
    CREATE TABLE public.variantes_stock (producto_id uuid REFERENCES public.productos, talle text, color text, cantidad integer, precio numeric);
  `);
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  const rpc = schema.match(/CREATE OR REPLACE FUNCTION public\.crear_producto_con_variantes\([\s\S]*?\$function\$;/)[0];
  await db.exec(rpc);
  const migration = await readFile(new URL('../migrations/202609030004_stock_por_color.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  const create = (stock, colors = ['Verde', 'Rojo']) => db.query(`
    SELECT public.crear_producto_con_variantes('Prueba', '', '00000000-0000-0000-0000-000000000001', 'Unisex', 'estandar', 100, '{}', $1::text[], $2::jsonb) AS result
  `, [colors, JSON.stringify(stock)]);
  const variants = async (stock, colors) => {
    const { rows } = await create(stock, colors);
    return (await db.query('SELECT color, talle, cantidad FROM public.variantes_stock WHERE producto_id = $1 ORDER BY color, talle', [rows[0].result.producto_id])).rows;
  };
  assert.deepEqual(await variants({ Verde: { S: 1, M: 1 }, Rojo: { L: 2 } }), [
    { color: 'Rojo', talle: 'L', cantidad: 2 }, { color: 'Rojo', talle: 'M', cantidad: 0 }, { color: 'Rojo', talle: 'S', cantidad: 0 },
    { color: 'Verde', talle: 'L', cantidad: 0 }, { color: 'Verde', talle: 'M', cantidad: 1 }, { color: 'Verde', talle: 'S', cantidad: 1 },
  ]);
  assert.deepEqual(await variants({ 'Sin color': { S: 3 } }, []), [
    { color: 'Sin color', talle: 'L', cantidad: 0 }, { color: 'Sin color', talle: 'M', cantidad: 0 }, { color: 'Sin color', talle: 'S', cantidad: 3 },
  ]);
  // Existing clients can still send the former flat stock format during deployment.
  assert.equal((await variants({ S: 4 })).filter(row => row.cantidad === 4).length, 2);
  for (const invalid of [{ Verde: { S: -1 } }, { Verde: { S: 1.5 } }, { Verde: { S: null } }, { Verde: { S: 2147483648 } }, { Verde: { XL: 1 } }, { Azul: { S: 1 } }, { Verde: {}, Rojo: 2 }]) {
    const before = await db.query('SELECT count(*) FROM public.productos');
    await assert.rejects(create(invalid));
    assert.deepEqual(await db.query('SELECT count(*) FROM public.productos'), before);
  }
  await db.exec("CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS 'SELECT false'");
  await assert.rejects(create({ Verde: { S: 1 } }), /No autorizado/);
  console.log('Stock SQL: independent colors, defaults, legacy input, validation and authorization passed.');
} finally {
  await db.close();
}
