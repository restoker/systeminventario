import db from "@/server";
import { sucursal } from "@/server/schema/sucursal";
import { usuarioSucursal } from "@/server/schema/usuario-sucursal";
import { and, eq, inArray } from "drizzle-orm";

type Resultado = { ok: true } | { ok: false; msg: string };

/**
 * Reemplaza las sucursales asignadas a un usuario aplicando la regla por rol:
 *  - admin → una o varias sucursales.
 *  - saler → exactamente UNA sucursal (si tenía otra, se reemplaza).
 *
 * Archivo SIN 'use server' a propósito: es lógica interna reutilizada por
 * varias server actions y no debe quedar expuesta como endpoint público.
 */
export async function reemplazarSucursalesUsuario(
    userId: string,
    sucursalIdsInput: string[],
): Promise<Resultado> {
    // Elimina IDs duplicados.
    const sucursalIds = [...new Set(sucursalIdsInput)];
    if (sucursalIds.length === 0) return { ok: false, msg: "Debe asignar al menos una sucursal" };

    const usuario = await db.query.users.findFirst({
        where: { id: { eq: userId } },
        columns: { id: true, role: true },
    });
    if (!usuario) return { ok: false, msg: "El usuario no existe" };

    if (usuario.role === "saler" && sucursalIds.length !== 1) {
        return { ok: false, msg: "Un vendedor solo puede estar asignado a una sucursal" };
    }

    // Todas las sucursales deben existir y estar activas.
    const sucursalesValidas = await db
        .select({ id: sucursal.id })
        .from(sucursal)
        .where(and(inArray(sucursal.id, sucursalIds), eq(sucursal.activo, true)));
    if (sucursalesValidas.length !== sucursalIds.length) {
        return { ok: false, msg: "Alguna de las sucursales no existe o está inactiva" };
    }

    // Borrar + insertar en una transacción: nunca queda un estado intermedio.
    await db.transaction(async (tx) => {
        await tx.delete(usuarioSucursal).where(eq(usuarioSucursal.userId, userId));
        await tx
            .insert(usuarioSucursal)
            .values(sucursalIds.map((sucursalId) => ({ userId, sucursalId })));
    });

    return { ok: true };
}
