'use server'

import { actionClient } from "@/lib/safe-action";
import { newCategoriaScham } from "@/types/new-categoria-schema";
import db from "../../index";
import { categorias } from "../../schema/categorias";
import { eq } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export const newCategoriaAction = actionClient
    .inputSchema(newCategoriaScham)
    .action(async ({ parsedInput: { nombre } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para crear categorías" };

            const existeCategoria = await db.query.categorias.findFirst({
                where: { nombre }
            })

            if (existeCategoria) return { ok: false, msg: "La categoría ya existe" }

            const result = await db.insert(categorias).values({
                nombre,
            })
            revalidatePath("/dashboard/categorias");
            return { ok: true, msg: "Categoría creada exitosamente" }
        } catch (e) {
            console.error(e)
            return { ok: false, msg: "Error al crear la categoría" }
        }
    })
