'use server';

import db from "../../index";
import { actionClient } from "@/lib/safe-action";
import { sucursal } from "@/server/schema/sucursal";
import { rucEmpresa } from "@/server/schema/ruc";
import { newSucursalSchema } from "@/types/new-surcursal-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const newSucursalAction = actionClient
    .inputSchema(newSucursalSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { id, nombre, direccion, telefono, email, ruc, razonSocial, codigo, isActive } = parsedInput;

            // Resolver rucId en la tabla ruc_empresa para respetar la foreign key
            let resolvedRucId: string | null = null;
            const cleanRuc = (ruc || '').trim();

            if (cleanRuc) {
                const existingRuc = await db.query.rucEmpresa.findFirst({
                    where: { numeroRuc: cleanRuc }
                });

                if (existingRuc) {
                    resolvedRucId = existingRuc.id;
                    if (razonSocial && razonSocial.trim() !== (existingRuc.razonSocial || '')) {
                        await db.update(rucEmpresa).set({
                            razonSocial: razonSocial.trim(),
                            nombre: razonSocial.trim(),
                        }).where(eq(rucEmpresa.id, existingRuc.id));
                    }
                } else {
                    const [createdRuc] = await db.insert(rucEmpresa).values({
                        numeroRuc: cleanRuc,
                        nombre: (razonSocial || nombre || `Empresa ${cleanRuc}`).trim(),
                        razonSocial: (razonSocial || nombre || `Empresa ${cleanRuc}`).trim(),
                        activo: true,
                        esPrincipal: false,
                    }).returning();
                    resolvedRucId = createdRuc.id;
                }
            }

            if (id) {
                const [updated] = await db.update(sucursal).set({
                    ...(nombre && { nombre: nombre.toLowerCase() }),
                    ...(direccion && { direccion: direccion.toLowerCase() }),
                    ...(telefono && { telefono }),
                    ...(email && { email: email.toLowerCase() }),
                    rucId: resolvedRucId,
                    ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                    ...(codigo && { codigo: codigo.toLowerCase() }),
                    ...(isActive !== undefined && { activo: isActive }),
                }).where(eq(sucursal.id, id)).returning();

                revalidatePath(`/dashboard/sucursales`);
                revalidatePath(`/dashboard/vendedores`);
                revalidatePath(`/dashboard/usuarios`);
                return { ok: true, msg: "Sucursal actualizada exitosamente", sucursal: updated };
            }

            const [created] = await db.insert(sucursal).values({
                nombre: nombre.toLowerCase(),
                direccion: direccion,
                telefono: telefono as string,
                ...(email && { email: email.toLowerCase() }),
                rucId: resolvedRucId,
                ...(razonSocial && { razonSocial: razonSocial.toLowerCase() }),
                codigo: codigo.toLowerCase(),
                ...(isActive !== undefined && { activo: isActive }),
            }).returning();

            revalidatePath(`/dashboard/sucursales`);
            revalidatePath(`/dashboard/sucursales/new`);
            revalidatePath(`/dashboard/vendedores`);
            revalidatePath(`/dashboard/usuarios`);

            return { ok: true, msg: "Sucursal creada exitosamente", sucursal: created };
        } catch (e) {
            console.error('Error in newSucursalAction:', e);
            return { ok: false, msg: "Error al crear la sucursal" };
        }
    });
