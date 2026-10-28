import z from "zod";

export const asignarSucursalesSchema = z.object({
    userId: z.string().min(1, "ID de usuario es requerido"),
    sucursalIds: z
        .array(z.string().min(1))
        .min(1, "Debe asignar al menos una sucursal"),
});
