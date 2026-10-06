
import z from "zod";

export const registerSchema = z.object({
    id: z.string().optional(),
    email: z.email(),
    password: z.string().min(4, 'Contraseña debe tener al menos 4 caracteres').max(20, 'Contraseña debe tener menos de 20 caracteres'),
})

export type RegisterSchema = z.infer<typeof registerSchema>;