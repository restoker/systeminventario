import z from "zod";

export const reabastecerSchema = z.object({
    productoId: z.string().min(1, 'Producto es requerido'),
    sucursalId: z.string().min(1, 'Sucursal es requerida'),
    cantidad: z.coerce.number().int().positive('La cantidad debe ser un número entero mayor a 0'),
    costoUnitario: z.coerce.number().min(0, 'El costo unitario no puede ser negativo').optional(),
    numeroComprobante: z.string().optional(),
    proveedorId: z.string().optional(),
    motivo: z.string().optional(),
});

export type ReabastecerValues = z.infer<typeof reabastecerSchema>;
export type ReabastecerInput = z.input<typeof reabastecerSchema>;
