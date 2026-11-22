import { z } from 'zod';

export const upsertFacturacionSchema = z.object({
    rucEmpresaId: z.string().min(1, 'El RUC emisor es requerido'),
    ubigeo: z
        .string()
        .trim()
        .refine(
            (val) => val === '' || /^\d{6}$/.test(val),
            'El código de ubigeo debe tener 6 dígitos numéricos'
        )
        .optional()
        .or(z.literal('')),
    departamento: z.string().trim().optional().or(z.literal('')),
    provincia: z.string().trim().optional().or(z.literal('')),
    distrito: z.string().trim().optional().or(z.literal('')),
    pathCert: z.string().trim().optional().or(z.literal('')),
    logo: z.string().trim().optional().or(z.literal('')),
    usuarioSol: z.string().trim().optional().or(z.literal('')),
    claveSol: z.string().trim().optional().or(z.literal('')),
    passwordCertificadoDigital: z.string().trim().optional().or(z.literal('')),
    produccion: z.boolean(),
    clienteId: z.string().trim().optional().or(z.literal('')),
    clienteSecret: z.string().trim().optional().or(z.literal('')),
});

export type UpsertFacturacionInput = z.infer<typeof upsertFacturacionSchema>;
