'use server';

import { actionClient } from "@/lib/safe-action";
import { newMarcaSchema } from "@/types/new-marca-schema";
import db from "../../index";
import { marcas } from "../../schema/marca";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const newMarcaAction = actionClient
    .inputSchema(newMarcaSchema)
    .action(async ({ parsedInput: { nombre, description, id, imagen, pais } }) => {
        try {
            const existingMarca = await db.query.marcas.findFirst({
                where: { nombre: nombre.toLowerCase() }
            });
            if (existingMarca) return { ok: false, msg: "La marca ya existe" };
            if (id) {
                await db.update(marcas).set({
                    ...(nombre && { nombre }),
                    ...(pais && { pais }),
                    ...(description && { descripcion: description }),
                    ...(imagen && { imagen: imagen }),
                }).where(eq(marcas.id, id));
                revalidatePath("/dashboard/productos");
                return { ok: true, msg: "Marca actualizada exitosamente" };
            }
            await db.insert(marcas).values({
                nombre: nombre,
                pais: pais,
                descripcion: description,
                imagen: imagen,
            });
            revalidatePath("/dashboard/productos");
            return { ok: true, msg: "Marca creada exitosamente" };
        } catch (error) {
            // console.log(error);
            return { ok: false, msg: "Error al crear la marca" };
        }
    });