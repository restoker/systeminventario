import { z } from 'zod';

export const newRucEmpresaSchema = z.object({
    numeroRuc: z
        .string()
        .min(11, 'El RUC debe tener 11 dígitos')
        .max(11, 'El RUC debe tener 11 dígitos')
        .regex(/^\d{11}$/, 'El RUC debe contener solo números'),
    nombre: z
        .string()
        .min(2, 'El nombre comercial o alias es requerido'),
    razonSocial: z
        .string()
        .min(2, 'La razón social oficial es requerida'),
    direccionFiscal: z
        .string()
        .optional()
        .or(z.literal('')),
    telefono: z
        .string()
        .optional()
        .or(z.literal('')),
    email: z
        .string()
        .email('Correo electrónico inválido')
        .optional()
        .or(z.literal('')),
    descripcion: z
        .string()
        .optional()
        .or(z.literal('')),
    activo: z.boolean(),
    esPrincipal: z.boolean(),
});

export type NewRucEmpresaInput = z.infer<typeof newRucEmpresaSchema>;

export const toggleRucEmpresaSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    activo: z.boolean(),
});

export const setRucPrincipalSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
});

export const deleteRucEmpresaSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
});
