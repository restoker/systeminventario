'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { proveedor } from "@/server/schema/proveedor";
import { newProveedorSchema } from "@/types/new-proveedor-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const newProveedorAction = actionClient
    .inputSchema(newProveedorSchema)
    .action(async ({ parsedInput: { id, nombre, numeroDocumento, telefono, email, razonSocial, direccion } }) => {
        try {
            const existingSupplier = await db.query.proveedor.findFirst({
                where: { nombre }
            })
            if (existingSupplier) return { ok: false, msg: "El proveedor ya existe" };

            if (id) {
                await db.update(proveedor).set({
                    ...(nombre && { nombre: nombre.toLowerCase() }),
                    ...(numeroDocumento && { numeroDocumento: numeroDocumento.toLowerCase() }),
                    ...(telefono && { telefono: telefono.toLowerCase() }),
                    ...(email && { email: email.toLowerCase() }),
                    ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                    ...(direccion && { direccion: direccion.toLowerCase() }),
                }).where(eq(proveedor.id, id))
            }

            await db.insert(proveedor).values({
                nombre: nombre.toLowerCase(),
                ...(numeroDocumento && { numeroDocumento: numeroDocumento.toLowerCase() }),
                ...(telefono && { telefono: telefono }),
                ...(email && { email }),
                ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                ...(direccion && { direccion: direccion.toLowerCase() }),
            });
            revalidatePath("/proveedores");
            revalidatePath("/dashboard/productos/new");
            return { ok: true, msg: "Proveedor creado exitosamente" };
        } catch (e) {
            console.log(e);
            return { ok: false, msg: "Error al crear el proveedor" }
        }
    })