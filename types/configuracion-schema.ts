import z from "zod";

export const configuracionSchema = z.object({
    recargoTarjeta: z
        .number()
        .min(0, "El recargo debe ser mayor o igual a 0")
        .max(1, "El recargo debe ser un decimal entre 0 y 1 (ej. 0.05 para 5%)"),
    comisionVendedor: z
        .number()
        .min(0, "La comisión debe ser mayor o igual a 0")
        .max(1, "La comisión debe ser un decimal entre 0 y 1 (ej. 0.03 para 3%)"),
});
export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
