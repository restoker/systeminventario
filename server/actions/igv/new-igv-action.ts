'use server';

import { actionClient } from "@/lib/safe-action";
import db from "../../index";
import { eq } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { newIgvSchema } from "@/types/igv-schema";
import { igv } from "@/server/schema/igv";

export const newIgvAction = actionClient
    .inputSchema(newIgvSchema)
    .action(async ({ parsedInput: { value, isActive, id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para gestionar impuestos" };

            const existeIgv = await db.query.igv.findFirst({
                where: { value },
            });

            if (existeIgv && existeIgv.id !== id) return { ok: false, msg: "La tasa de IGV ya existe" };

            if (id) {
                const [updated] = await db.update(igv).set({
                    ...(value !== undefined && { value }),
                    ...(isActive !== undefined && { isActive }),
                }).where(eq(igv.id, id)).returning();

                revalidatePath(`/dashboard/productos`);
                revalidatePath(`/dashboard/productos/new`);
                return { ok: true, msg: "IGV actualizado exitosamente", igv: updated };
            }

            const [created] = await db.insert(igv).values({
                value,
                ...(isActive !== undefined && { isActive }),
            }).returning();

            revalidatePath(`/dashboard/productos`);
            revalidatePath(`/dashboard/productos/new`);
            return { ok: true, msg: "IGV creado exitosamente", igv: created };
        } catch (e) {
            console.error(e);
            return { ok: false, msg: "Error al crear el IGV" };
        }
    });

