import z from "zod";

export const newSucursalSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    codigo: z.coerce.string<string>().min(1, "El código es requerido").regex(/^\d+$/, "El código debe contener solo números"),
    direccion: z.string().min(3, "La dirección debe tener al menos 3 caracteres"),
    telefono: z.string().optional(),
    email: z.string().or(z.literal('')).optional(),
    ruc: z.string().optional(),
    razonSocial: z.string().optional(),
    isActive: z.boolean().optional(),
});

export type NewSurcursalSchema = z.infer<typeof newSucursalSchema>;