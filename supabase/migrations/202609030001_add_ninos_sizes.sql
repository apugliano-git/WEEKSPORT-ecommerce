BEGIN;

-- Quita la definición genérica anterior; no modifica variantes ni stock.
DELETE FROM public.talles_por_tipo
WHERE tipo_talle = 'ninos' AND talle = 'Niños';

INSERT INTO public.talles_por_tipo (tipo_talle, talle, orden)
VALUES
    ('ninos', '6', 1),
    ('ninos', '8', 2),
    ('ninos', '10', 3),
    ('ninos', '12', 4),
    ('ninos', '14', 5),
    ('ninos', '16', 6),
    ('ninos', 'XS', 7),
    ('ninos', 'S', 8)
ON CONFLICT (tipo_talle, talle) DO UPDATE
SET orden = EXCLUDED.orden;

COMMIT;
