'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { eq } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { tipoDocumento } from "@/server/schema/tipo-documento";
import { tipoDocumentoSchema, toggleTipoDocumentoSchema } from "@/types/tipo-documento-schema";
import z from "zod";

export const newTipoDocumentoAction = actionClient
    .inputSchema(tipoDocumentoSchema)
    .action(async ({ parsedInput: { nombre, estado } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para gestionar documentos" };

            const nombreTrim = nombre.trim();
            const existe = await db.query.tipoDocumento.findFirst({
                where: { nombre: nombreTrim },
            });

            if (existe) {
                return { ok: false, msg: `El documento "${nombreTrim}" ya se encuentra registrado` };
            }

            const [created] = await db.insert(tipoDocumento).values({
                nombre: nombreTrim,
                estado: estado !== undefined ? estado : true,
            }).returning();

            revalidatePath("/dashboard/configuracion");
            return { ok: true, msg: `Tipo de documento "${nombreTrim}" creado exitosamente`, data: created };
        } catch (error) {
            console.error(error);
            return { ok: false, msg: "Error al crear el tipo de documento" };
        }
    });

export const toggleTipoDocumentoAction = actionClient
    .inputSchema(toggleTipoDocumentoSchema)
    .action(async ({ parsedInput: { id, estado } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para realizar esta acción" };

            const [updated] = await db
                .update(tipoDocumento)
                .set({ estado })
                .where(eq(tipoDocumento.id, id))
                .returning();

            revalidatePath("/dashboard/configuracion");
            return {
                ok: true,
                msg: `Estado del documento actualizado a ${estado ? 'activo' : 'inactivo'}`,
                data: updated,
            };
        } catch (error) {
            console.error(error);
            return { ok: false, msg: "Error al cambiar el estado del documento" };
        }
    });

export const deleteTipoDocumentoAction = actionClient
    .inputSchema(z.object({ id: z.string().min(1) }))
    .action(async ({ parsedInput: { id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para eliminar este documento" };

            await db.delete(tipoDocumento).where(eq(tipoDocumento.id, id));

            revalidatePath("/dashboard/configuracion");
            return { ok: true, msg: "Tipo de documento eliminado exitosamente" };
        } catch (error) {
            console.error(error);
            return { ok: false, msg: "Error al eliminar el tipo de documento" };
        }
    });
