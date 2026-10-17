'use server';

import db from "../../index";
import { actionClient } from "@/lib/safe-action";
import { sucursal } from "@/server/schema/sucursal";
import { newSucursalSchema } from "@/types/new-surcursal-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const newSucursalAction = actionClient
    .inputSchema(newSucursalSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { id, nombre, direccion, telefono, email, ruc, razonSocial, codigo, isActive } = parsedInput;
            if (id) {
                const [updated] = await db.update(sucursal).set({
                    ...(nombre && { nombre: nombre.toLowerCase() }),
                    ...(direccion && { direccion: direccion.toLowerCase() }),
                    ...(telefono && { telefono }),
                    ...(email && { email: email.toLowerCase() }),
                    ...(ruc && { ruc }),
                    ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                    ...(isActive !== undefined && { activo: isActive }),
                }).where(eq(sucursal.id, id)).returning();
                revalidatePath(`/dashboard/sucursales`);
                return { ok: true, msg: "Sucursal actualizada exitosamente", sucursal: updated };
            }
            const [created] = await db.insert(sucursal).values({
                nombre: nombre.toLowerCase(),
                direccion: direccion,
                telefono: telefono as string,
                ...(email && { email: email.toLowerCase() }),
                ...(ruc && { ruc: ruc.toString() }),
                ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                codigo: codigo.toLowerCase(),
                ...(isActive !== undefined && { activo: isActive }),
            }).returning();
            revalidatePath(`/dashboard/sucursales`);
            revalidatePath(`/dashboard/productos/new`);

            return { ok: true, msg: "Sucursal creada exitosamente", sucursal: created };
        } catch (e) {
            console.error(e)
            return { ok: false, msg: "Error al crear la sucursal" }
        }
    })