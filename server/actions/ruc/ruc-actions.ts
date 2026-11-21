'use server';

import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { eq, not } from "drizzle-orm";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { rucEmpresa } from "@/server/schema/ruc";
import {
    newRucEmpresaSchema,
    updateRucEmpresaSchema,
    toggleRucEmpresaSchema,
    setRucPrincipalSchema,
    deleteRucEmpresaSchema,
} from "@/types/ruc-empresa-schema";

export const newRucEmpresaAction = actionClient
    .inputSchema(newRucEmpresaSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para gestionar RUCs" };

            const cleanRuc = parsedInput.numeroRuc.trim();
            const cleanNombre = parsedInput.nombre.trim();
            const cleanRazonSocial = parsedInput.razonSocial.trim();

            // Verificar si el RUC ya existe
            const existe = await db.query.rucEmpresa.findFirst({
                where: { numeroRuc: cleanRuc }
            });

            if (existe) {
                return {
                    ok: false,
                    msg: `El RUC "${cleanRuc}" ya se encuentra registrado con la razón social "${existe.razonSocial || existe.nombre}"`,
                };
            }

            // Si es marcado como principal, desmarcar los anteriores
            if (parsedInput.esPrincipal) {
                await db.update(rucEmpresa).set({ esPrincipal: false });
            }

            // Si es el primer RUC registrado, marcarlo automáticamente como principal
            const totalRucs = await db.query.rucEmpresa.findMany({ columns: { id: true } });
            const debeSerPrincipal = parsedInput.esPrincipal || totalRucs.length === 0;

            const [created] = await db.insert(rucEmpresa).values({
                numeroRuc: cleanRuc,
                nombre: cleanNombre,
                razonSocial: cleanRazonSocial,
                direccionFiscal: parsedInput.direccionFiscal?.trim() || null,
                telefono: parsedInput.telefono?.trim() || null,
                email: parsedInput.email?.trim() || null,
                descripcion: parsedInput.descripcion?.trim() || null,
                activo: parsedInput.activo ?? true,
                esPrincipal: debeSerPrincipal,
            }).returning();

            revalidatePath("/dashboard/configuracion");
            revalidatePath("/dashboard/sucursales");
            revalidatePath("/dashboard/pos");

            return {
                ok: true,
                msg: `RUC ${cleanRuc} registrado exitosamente`,
                data: created,
            };
        } catch (error) {
            console.error("Error in newRucEmpresaAction:", error);
            return { ok: false, msg: "Error interno al registrar el RUC de la empresa" };
        }
    });

export const updateRucEmpresaAction = actionClient
    .inputSchema(updateRucEmpresaSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para gestionar RUCs" };

            const target = await db.query.rucEmpresa.findFirst({
                where: { id: parsedInput.id }
            });
            if (!target) {
                return { ok: false, msg: "El RUC que intentas editar no existe" };
            }

            const cleanRuc = parsedInput.numeroRuc.trim();
            const cleanNombre = parsedInput.nombre.trim();
            const cleanRazonSocial = parsedInput.razonSocial.trim();

            const duplicate = await db.query.rucEmpresa.findFirst({
                where: { numeroRuc: cleanRuc }
            });

            if (duplicate && duplicate.id !== parsedInput.id) {
                return {
                    ok: false,
                    msg: `El RUC "${cleanRuc}" ya pertenece a "${duplicate.razonSocial || duplicate.nombre}"`,
                };
            }

            if (parsedInput.esPrincipal) {
                await db.update(rucEmpresa).set({ esPrincipal: false });
            }

            const [updated] = await db
                .update(rucEmpresa)
                .set({
                    numeroRuc: cleanRuc,
                    nombre: cleanNombre,
                    razonSocial: cleanRazonSocial,
                    direccionFiscal: parsedInput.direccionFiscal?.trim() || null,
                    telefono: parsedInput.telefono?.trim() || null,
                    email: parsedInput.email?.trim() || null,
                    descripcion: parsedInput.descripcion?.trim() || null,
                    activo: parsedInput.esPrincipal ? true : (parsedInput.activo ?? target.activo),
                    esPrincipal: parsedInput.esPrincipal,
                    updatedAt: new Date(),
                })
                .where(eq(rucEmpresa.id, parsedInput.id))
                .returning();

            revalidatePath("/dashboard/configuracion");
            revalidatePath("/dashboard/sucursales");
            revalidatePath("/dashboard/pos");

            return {
                ok: true,
                msg: `RUC ${cleanRuc} actualizado exitosamente`,
                data: updated,
            };
        } catch (error) {
            console.error("Error in updateRucEmpresaAction:", error);
            return { ok: false, msg: "Error interno al actualizar el RUC de la empresa" };
        }
    });

export const toggleRucEmpresaAction = actionClient
    .inputSchema(toggleRucEmpresaSchema)
    .action(async ({ parsedInput: { id, activo } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para realizar esta acción" };

            const [updated] = await db
                .update(rucEmpresa)
                .set({ activo })
                .where(eq(rucEmpresa.id, id))
                .returning();

            revalidatePath("/dashboard/configuracion");
            revalidatePath("/dashboard/sucursales");
            revalidatePath("/dashboard/pos");

            return {
                ok: true,
                msg: `RUC ${updated.numeroRuc} ${activo ? "habilitado" : "deshabilitado"} para facturación`,
                data: updated,
            };
        } catch (error) {
            console.error("Error in toggleRucEmpresaAction:", error);
            return { ok: false, msg: "Error al cambiar el estado del RUC" };
        }
    });

export const setRucPrincipalAction = actionClient
    .inputSchema(setRucPrincipalSchema)
    .action(async ({ parsedInput: { id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para realizar esta acción" };

            // Desmarcar todos y marcar el seleccionado
            await db.update(rucEmpresa).set({ esPrincipal: false });
            const [updated] = await db
                .update(rucEmpresa)
                .set({ esPrincipal: true, activo: true })
                .where(eq(rucEmpresa.id, id))
                .returning();

            revalidatePath("/dashboard/configuracion");
            revalidatePath("/dashboard/sucursales");
            revalidatePath("/dashboard/pos");

            return {
                ok: true,
                msg: `El RUC ${updated.numeroRuc} se ha establecido como principal`,
                data: updated,
            };
        } catch (error) {
            console.error("Error in setRucPrincipalAction:", error);
            return { ok: false, msg: "Error al establecer el RUC principal" };
        }
    });

export const deleteRucEmpresaAction = actionClient
    .inputSchema(deleteRucEmpresaSchema)
    .action(async ({ parsedInput: { id } }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) return { ok: false, msg: "No tienes permiso para eliminar RUCs" };

            // Verificar si tiene sucursales o ventas asociadas
            const target = await db.query.rucEmpresa.findFirst({
                where: { id },
                with: {
                    sucursales: true,
                    ventas: true,
                    comprobantes: true,
                }
            });

            if (!target) return { ok: false, msg: "RUC no encontrado" };

            if ((target.sucursales && target.sucursales.length > 0) ||
                (target.ventas && target.ventas.length > 0) ||
                (target.comprobantes && target.comprobantes.length > 0)) {
                return {
                    ok: false,
                    msg: "No se puede eliminar este RUC porque tiene sucursales, ventas o comprobantes vinculados. Puedes deshabilitarlo en su lugar.",
                };
            }

            await db.delete(rucEmpresa).where(eq(rucEmpresa.id, id));

            revalidatePath("/dashboard/configuracion");
            revalidatePath("/dashboard/sucursales");
            revalidatePath("/dashboard/pos");

            return {
                ok: true,
                msg: `RUC ${target.numeroRuc} eliminado exitosamente`,
            };
        } catch (error) {
            console.error("Error in deleteRucEmpresaAction:", error);
            return { ok: false, msg: "Error al eliminar el RUC" };
        }
    });

export const getRucsEmpresaAction = actionClient
    .action(async () => {
        try {
            const list = await db.query.rucEmpresa.findMany({
                where: { activo: true },
                orderBy: (fields, { desc, asc }) => [desc(fields.esPrincipal), asc(fields.nombre)],
            });
            return { ok: true, data: list };
        } catch (error) {
            console.error("Error in getRucsEmpresaAction:", error);
            return { ok: false, data: [] };
        }
    });
