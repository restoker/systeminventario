'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { proveedor } from "@/server/schema/proveedor";
import { newProveedorSchema } from "@/types/new-proveedor-schema";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const newProveedorAction = actionClient
    .inputSchema(newProveedorSchema)
    .action(async ({ parsedInput: { id, nombre, numeroDocumento, telefono, email, razonSocial, direccion } }) => {
        try {
            const cleanNombre = nombre.trim();
            const cleanDoc = numeroDocumento?.trim() || null;
            const cleanTel = telefono?.trim() || null;
            const cleanEmail = email?.trim() || null;
            const cleanRazon = razonSocial?.trim() || null;
            const cleanDir = direccion?.trim() || null;

            if (id) {
                // Verificar si existe otro proveedor con el mismo nombre
                const [existingSupplier] = await db
                    .select()
                    .from(proveedor)
                    .where(and(eq(proveedor.nombre, cleanNombre.toLowerCase()), ne(proveedor.id, id)))
                    .limit(1);

                if (existingSupplier) {
                    return { ok: false, msg: "Ya existe otro proveedor registrado con este nombre" };
                }

                // Si se proporcionó RUC/documento, verificar que no esté duplicado en otro proveedor
                if (cleanDoc) {
                    const [existingDoc] = await db
                        .select()
                        .from(proveedor)
                        .where(and(eq(proveedor.numeroDocumento, cleanDoc.toLowerCase()), ne(proveedor.id, id)))
                        .limit(1);

                    if (existingDoc) {
                        return { ok: false, msg: `Ya existe otro proveedor con el documento ${cleanDoc}` };
                    }
                }

                const [updated] = await db.update(proveedor).set({
                    nombre: cleanNombre.toLowerCase(),
                    numeroDocumento: cleanDoc ? cleanDoc.toLowerCase() : null,
                    telefono: cleanTel,
                    email: cleanEmail ? cleanEmail.toLowerCase() : null,
                    razonSocial: cleanRazon ? cleanRazon.toLowerCase() : null,
                    direccion: cleanDir ? cleanDir.toLowerCase() : null,
                }).where(eq(proveedor.id, id)).returning();

                revalidatePath("/dashboard/proveedores");
                revalidatePath("/dashboard/productos/new");
                return { ok: true, msg: "Proveedor actualizado exitosamente", data: updated };
            }

            // Validar nombre único en creación
            const [existingSupplier] = await db
                .select()
                .from(proveedor)
                .where(eq(proveedor.nombre, cleanNombre.toLowerCase()))
                .limit(1);

            if (existingSupplier) {
                return { ok: false, msg: "El proveedor ya existe con este nombre" };
            }

            // Validar documento único en creación si se proporciona
            if (cleanDoc) {
                const [existingDoc] = await db
                    .select()
                    .from(proveedor)
                    .where(eq(proveedor.numeroDocumento, cleanDoc.toLowerCase()))
                    .limit(1);

                if (existingDoc) {
                    return { ok: false, msg: `Ya existe un proveedor con el documento ${cleanDoc}` };
                }
            }

            const [created] = await db.insert(proveedor).values({
                nombre: cleanNombre.toLowerCase(),
                numeroDocumento: cleanDoc ? cleanDoc.toLowerCase() : null,
                telefono: cleanTel,
                email: cleanEmail ? cleanEmail.toLowerCase() : null,
                razonSocial: cleanRazon ? cleanRazon.toLowerCase() : null,
                direccion: cleanDir ? cleanDir.toLowerCase() : null,
                activo: true,
            }).returning();

            revalidatePath("/dashboard/proveedores");
            revalidatePath("/dashboard/productos/new");
            return { ok: true, msg: "Proveedor creado exitosamente", data: created };
        } catch (e) {
            console.error("Error en newProveedorAction:", e);
            return { ok: false, msg: "Error al procesar el proveedor" };
        }
    });