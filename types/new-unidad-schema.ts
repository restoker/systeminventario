import z from "zod";

export const newUnidadSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, "La unidad debe tener al menos 3 caracteres").max(100, "La unidad debe tener menos de 100 caracteres"),
    abreviatura: z.string().min(1, "La abreviatura debe tener al menos 1 caracteres").max(5, "La abreviatura debe tener menos de 5 caracteres"),
})

export type NewUnidadSchema = z.infer<typeof newUnidadSchema>;