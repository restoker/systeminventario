import z from "zod";

export const loginSchema = z.object({
    email: z.email('Correo electrónico no válido'),
    password: z
        .string()
        .min(4, 'Contraseña debe tener al menos 4 caracteres')
        .max(20, 'Contraseña debe tener menos de 20 caracteres'),
})

export type LoginSchema = z.infer<typeof loginSchema>;