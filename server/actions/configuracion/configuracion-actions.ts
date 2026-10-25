'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { eq } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { configuracion } from "@/server/schema/configuracion";
import { configuracionSchema } from "@/types/configuracion-schema";

export const updateConfiguracionAction = actionClient
    .inputSchema(configuracionSchema)
    .action(async ({ parsedInput: { recargoTarjeta, comisionVendedor } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user || session?.user.role !== "admin") {
                return { ok: false, msg: "No tienes permiso para modificar la configuración" };
            }

            const configExistente = await db.query.configuracion.findFirst({
                orderBy: (c, { desc }) => [desc(c.createdAt)],
            });

            if (configExistente) {
                const [updated] = await db
                    .update(configuracion)
                    .set({
                        recargoTarjeta,
                        comisionVendedor,
                    })
                    .where(eq(configuracion.id, configExistente.id))
                    .returning();

                revalidatePath("/dashboard/configuracion");
                return {
                    ok: true,
                    msg: "Configuración actualizada exitosamente",
                    data: updated,
                };
            }

            const [created] = await db
                .insert(configuracion)
                .values({
                    recargoTarjeta,
                    comisionVendedor,
                })
                .returning();

            revalidatePath("/dashboard/configuracion");
            return {
                ok: true,
                msg: "Configuración guardada exitosamente",
                data: created,
            };
        } catch (error) {
            console.error("Error al actualizar la configuración:", error);
            return { ok: false, msg: "Error al actualizar la configuración" };
        }
    });
