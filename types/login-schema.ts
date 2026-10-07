import z from "zod";

export const loginSchema = z.object({
    username: z
        .string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(20, 'El nombre de usuario debe tener menos de 20 caracteres'),
    password: z
        .string()
        .min(4, 'Contraseña debe tener al menos 4 caracteres')
        .max(20, 'Contraseña debe tener menos de 20 caracteres'),
})

export type LoginSchema = z.infer<typeof loginSchema>;