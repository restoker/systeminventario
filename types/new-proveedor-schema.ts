import { z } from "zod";

export const newProveedorSchema = z.object({
    id: z.string().optional(),
    nombre: z
        .string()
        .min(2, 'El nombre o razón comercial debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    numeroDocumento: z.string().optional(),
    telefono: z.string().optional(),
    email: z.email('El correo electrónico no es válido').or(z.literal('')).optional(),
    razonSocial: z.string().optional(),
    direccion: z.string().optional(),
});

export type NewProveedorType = z.infer<typeof newProveedorSchema>;

export const toggleProveedorSchema = z.object({
    id: z.string().min(1, 'ID de proveedor requerido'),
    activo: z.boolean(),
});

export type ToggleProveedorType = z.infer<typeof toggleProveedorSchema>;

export const deleteProveedorSchema = z.object({
    id: z.string().min(1, 'ID de proveedor requerido'),
});

export type DeleteProveedorType = z.infer<typeof deleteProveedorSchema>;