import z from "zod";

export const newIgvSchema = z.object({
    id: z.string().optional(),
    value: z
        .number({ message: "Ingresa una tasa de impuesto válida" })
        .min(0, "La tasa no puede ser menor a 0")
        .max(1, "La tasa debe expresarse en decimal entre 0 y 1 (ej. 0.18 para 18%)"),
    isActive: z.boolean().optional(),
});

export type NewIgvSchema = z.infer<typeof newIgvSchema>;