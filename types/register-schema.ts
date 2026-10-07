
import z from "zod";

export const registerSchema = z.object({
    id: z.string().optional(),
    email: z.email(),
    password: z.string().min(4, 'Contraseña debe tener al menos 4 caracteres').max(20, 'Contraseña debe tener menos de 20 caracteres'),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50, 'El nombre debe tener menos de 50 caracteres'),
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(20, 'El nombre de usuario debe tener menos de 20 caracteres'),
    phone: z.coerce.string().regex(/^9\d{8}$/, 'El teléfono debe tener 9 dígitos y empezar con 9'),
    confirmPassword: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres').max(20, 'La contraseña debe tener menos de 20 caracteres'),
    role: z.enum(["admin", "saler"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

export type RegisterSchema = z.infer<typeof registerSchema>;