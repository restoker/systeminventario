'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { proveedor } from "@/server/schema/proveedor";
import { toggleProveedorSchema } from "@/types/new-proveedor-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const toggleProveedorAction = actionClient
    .inputSchema(toggleProveedorSchema)
    .action(async ({ parsedInput: { id, activo } }) => {
        try {
            const [existing] = await db
                .select()
                .from(proveedor)
                .where(eq(proveedor.id, id))
                .limit(1);

            if (!existing) {
                return { ok: false, msg: "Proveedor no encontrado" };
            }

            const [updated] = await db
                .update(proveedor)
                .set({ activo })
                .where(eq(proveedor.id, id))
                .returning();

            revalidatePath("/dashboard/proveedores");
            revalidatePath("/dashboard/productos/new");

            return {
                ok: true,
                msg: `Proveedor ${activo ? 'activado' : 'desactivado'} exitosamente`,
                data: updated,
            };
        } catch (error) {
            console.error("Error en toggleProveedorAction:", error);
            return { ok: false, msg: "Error al cambiar el estado del proveedor" };
        }
    });
