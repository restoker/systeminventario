import z from "zod";

export const abrirCajaSchema = z.object({
    montoInicial: z.coerce.number().min(0, 'El monto inicial debe ser mayor o igual a 0'),
    sucursalId: z.string().min(1, 'La sucursal es requerida'),
});

export type AbrirCajaActionInput = z.infer<typeof abrirCajaSchema>;
