import { z } from "zod";

export const ajusteStockSchema = z.object({
    sucursalId: z.string().min(1, 'La sucursal es obligatoria'),
    productoId: z.string().min(1, 'El producto es obligatorio'),
    tipoOperacion: z.enum(['INCREMENTO', 'DECREMENTO', 'CONTEO_FISICO']),
    cantidad: z.coerce
        .number({ error: 'Ingresa un valor numérico válido' })
        .int('Debe ser un número entero')
        .min(0, 'No puede ser negativo'),
    motivo: z.enum([
        'AJUSTE_POSITIVO',
        'AJUSTE_NEGATIVO',
        'MERMA',
        'INVENTARIO_INICIAL'
    ]),
    observacion: z.string().trim().optional(),
});

export type AjusteStockValues = z.infer<typeof ajusteStockSchema>;

export const trasladoStockSchema = z
    .object({
        sucursalOrigenId: z.string().min(1, 'La sucursal de origen es obligatoria'),
        sucursalDestinoId: z.string().min(1, 'Selecciona la sucursal de destino'),
        productoId: z.string().min(1, 'El producto es obligatorio'),
        cantidad: z.coerce
            .number({ error: 'Ingresa una cantidad válida' })
            .int('La cantidad debe ser entera')
            .positive('La cantidad a trasladar debe ser mayor a 0'),
        motivo: z.string().trim().min(3, 'Ingresa el motivo del traslado (mínimo 3 caracteres)'),
        observacion: z.string().trim().optional(),
    })
    .refine((data) => data.sucursalOrigenId !== data.sucursalDestinoId, {
        message: 'La sucursal destino debe ser distinta a la sucursal de origen',
        path: ['sucursalDestinoId'],
    });

export type TrasladoStockValues = z.infer<typeof trasladoStockSchema>;

export const updateStockMinimoSchema = z.object({
    sucursalId: z.string().min(1, 'La sucursal es requerida'),
    productoId: z.string().min(1, 'El producto es requerido'),
    stockMinimo: z.coerce
        .number({ error: 'Ingresa un valor válido' })
        .int('El stock mínimo debe ser entero')
        .min(0, 'El stock mínimo no puede ser negativo'),
});

export type UpdateStockMinimoValues = z.infer<typeof updateStockMinimoSchema>;

