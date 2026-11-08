import z from "zod";

export const reabastecerItemSchema = z.object({
    productoId: z.string().min(1, 'Selecciona un producto'),
    cantidad: z.coerce
        .number({ error: 'Ingresa una cantidad válida' })
        .int('La cantidad debe ser un número entero')
        .positive('La cantidad debe ser mayor a 0'),
    costoUnitario: z.coerce
        .number({ error: 'Ingresa un costo válido' })
        .min(0, 'El costo unitario no puede ser negativo'),
});

export const reabastecerSchema = z.object({
    sucursalId: z.string().min(1, 'La sucursal es requerida'),
    proveedorId: z.string().min(1, 'Debes seleccionar un proveedor para registrar la compra'),
    tipoComprobanteId: z.string().min(1, 'Selecciona el tipo de comprobante'),
    numeroComprobante: z.string().trim().min(1, 'Ingresa el número de comprobante (o S/N)'),
    fechaComprobante: z.string().optional(),
    aCredito: z.boolean(),
    numeroDiasCredito: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : val),
        z.coerce
            .number()
            .int('El plazo debe ser un número entero de días')
            .positive('Los días de crédito deben ser mayores a 0')
            .optional()
    ),
    motivo: z.string().optional(),
    items: z
        .array(reabastecerItemSchema)
        .min(1, 'Debes agregar al menos un producto a la compra')
        .refine(
            (items) => new Set(items.map((i) => i.productoId)).size === items.length,
            { message: 'No repitas el mismo producto en más de una fila; suma la cantidad en su fila.' }
        ),
});

export type ReabastecerItemValues = z.infer<typeof reabastecerItemSchema>;
export type ReabastecerValues = z.infer<typeof reabastecerSchema>;
export type ReabastecerInput = z.input<typeof reabastecerSchema>;
