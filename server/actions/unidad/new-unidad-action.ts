'use server';

import { api } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { newUnidadSchema } from "@/types/new-unidad-schema";
import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { unidades } from "@/server/schema/unidad";

export const newUnidadAction = actionClient
    .inputSchema(newUnidadSchema)
    .action(async ({ parsedInput: { nombre, abreviatura, id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para crear unidades" };

            const existeUnidad = await db.query.unidades.findFirst({
                where: { nombre }
            })

            if (existeUnidad && existeUnidad.id !== id) return { ok: false, msg: "La unidad ya existe" }

            if (id) {
                await db.update(unidades).set({
                    nombre,
                    abreviatura,
                }).where(eq(unidades.id, id));

                revalidatePath("/dashboard/productos");
                revalidatePath("/dashboard/productos/new");
                return { ok: true, msg: "Unidad actualizada exitosamente" }
            }

            await db.insert(unidades).values({
                nombre,
                abreviatura,
            })

            revalidatePath("/dashboard/productos");
            revalidatePath("/dashboard/productos/new");
            return { ok: true, msg: "Unidad creada exitosamente" }
        } catch (e) {
            console.error(e)
            return { ok: false, msg: "Error al crear la unidad" }
        }
    })