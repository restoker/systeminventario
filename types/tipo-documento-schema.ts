import z from "zod";

export const tipoDocumentoSchema = z.object({
    id: z.string().optional(),
    nombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(60, "El nombre no puede superar los 60 caracteres"),
    estado: z.boolean().default(true).optional(),
});

export type TipoDocumentoInput = z.infer<typeof tipoDocumentoSchema>;

export const toggleTipoDocumentoSchema = z.object({
    id: z.string().min(1, "El ID es requerido"),
    estado: z.boolean(),
});

export type ToggleTipoDocumentoInput = z.infer<typeof toggleTipoDocumentoSchema>;
