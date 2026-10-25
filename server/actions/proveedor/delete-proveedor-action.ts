'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { proveedor } from "@/server/schema/proveedor";
import { products } from "@/server/schema/products";
import { deleteProveedorSchema } from "@/types/new-proveedor-schema";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteProveedorAction = actionClient
    .inputSchema(deleteProveedorSchema)
    .action(async ({ parsedInput: { id } }) => {
        try {
            const [existing] = await db
                .select()
                .from(proveedor)
                .where(eq(proveedor.id, id))
                .limit(1);

            if (!existing) {
                return { ok: false, msg: "Proveedor no encontrado" };
            }

            // Verificar si tiene productos asociados
            const [{ associatedCount }] = await db
                .select({ associatedCount: count() })
                .from(products)
                .where(eq(products.proveedorId, id));

            if (Number(associatedCount) > 0) {
                return {
                    ok: false,
                    msg: `No se puede eliminar: tiene ${associatedCount} producto(s) asociado(s). Desactívalo en su lugar.`,
                };
            }

            await db.delete(proveedor).where(eq(proveedor.id, id));

            revalidatePath("/dashboard/proveedores");
            revalidatePath("/dashboard/productos/new");

            return {
                ok: true,
                msg: "Proveedor eliminado exitosamente",
            };
        } catch (error) {
            console.error("Error en deleteProveedorAction:", error);
            return { ok: false, msg: "Error al eliminar el proveedor" };
        }
    });
