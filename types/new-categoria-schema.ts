import z from "zod";

export const newCategoriaScham = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, "La categoría debe tener al menos 3 caracteres").max(100, "La categoría debe tener menos de 100 caracteres"),
})

export type NewCategoriaSchema = z.infer<typeof newCategoriaScham>;