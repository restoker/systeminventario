'use server';

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import { reemplazarSucursalesUsuario } from "@/server/services/usuario-sucursal";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { asignarSucursalesSchema } from "@/types/asignar-sucursal-schema";

/**
 * Reemplaza las sucursales asignadas a un usuario.
 *
 * Regla de negocio (no se puede expresar en la BD porque depende del rol):
 *  - admin → puede tener una o varias sucursales.
 *  - saler → exactamente UNA sucursal. Si ya tenía otra, se reemplaza.
 *
 * La lógica vive en `reemplazarSucursalesUsuario` para reutilizarla también
 * desde el registro de vendedores.
 */
export const asignarSucursalesAction = actionClient
    .inputSchema(asignarSucursalesSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            if (!session) return { ok: false, msg: "No tiene permisos para esta operación" };
            if (session.user.role !== "admin") {
                return { ok: false, msg: "Solo un administrador puede asignar sucursales" };
            }

            const res = await reemplazarSucursalesUsuario(parsedInput.userId, parsedInput.sucursalIds);
            if (!res.ok) return res;

            revalidatePath("/dashboard/vendedores");

            return { ok: true, msg: "Sucursales asignadas exitosamente" };
        } catch (error) {
            console.error("Error in asignarSucursalesAction:", error);
            return { ok: false, msg: "Error al asignar sucursales" };
        }
    });
