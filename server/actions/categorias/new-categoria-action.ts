'use server'

import { actionClient } from "@/lib/safe-action";
import db from "../../index";
import { categorias } from "../../schema/categorias";
import { eq } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { newCategoriaSchema } from "@/types/new-categoria-schema";

export const newCategoriaAction = actionClient
    .inputSchema(newCategoriaSchema)
    .action(async ({ parsedInput: { nombre, id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para crear categorías" };

            const existeCategoria = await db.query.categorias.findFirst({
                where: { nombre }
            })

            if (existeCategoria && existeCategoria.id !== id) return { ok: false, msg: "La categoría ya existe" }

            if (id) {
                await db.update(categorias).set({
                    nombre,
                }).where(eq(categorias.id, id));

                revalidatePath(`/dashboard/productos`);
                return { ok: true, msg: "Categoría actualizada exitosamente" };
            }

            await db.insert(categorias).values({
                nombre,
            });

            revalidatePath(`/dashboard/productos`);
            revalidatePath(`/dashboard/productos/new`);
            return { ok: true, msg: "Categoría creada exitosamente" }
        } catch (e) {
            console.error(e)
            return { ok: false, msg: "Error al crear la categoría" }
        }
    })
