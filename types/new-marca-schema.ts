import z from "zod";


export const newMarcaSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(2).max(100),
    pais: z.string().optional(),
    description: z.string().optional(),
    imagen: z.string().optional(),
})

export type NewMarcaSchema = z.infer<typeof newMarcaSchema>