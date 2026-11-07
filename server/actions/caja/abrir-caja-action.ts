'use server';

import { api } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { caja } from "@/server/schema/caja";
import { abrirCajaSchema } from "@/types/abrir-caja-action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const abrirCajaAction = actionClient
    .inputSchema(abrirCajaSchema)
    .action(async ({ parsedInput }) => {
        const { montoInicial, sucursalId } = parsedInput;
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session) return { ok: false, msg: 'No tienes permiso para realizar esta acción' }
            const user = session.user;
            if (!user) return { ok: false, msg: 'No tienes permiso para realizar esta acción' }
            const usuarioId = user.id;
            const sucursalExistente = await db.query.sucursal.findFirst({
                where: { id: { eq: sucursalId } },
            })
            if (!sucursalExistente) return { ok: false, msg: 'Sucursal no encontrada' }

            await db.insert(caja).values({
                userId: usuarioId,
                sucursalId: sucursalId,
                montoApertura: montoInicial,
                estado: 'abierto',
                fechaCreada: new Date(),
            })
            revalidatePath(`/dashboard/caja`);
            // revalidatePath(`/dashboard/POS`);
            revalidatePath(`/dashboard/pos`);
            revalidatePath(`/dashboard/inventario/reabastecer`);
            revalidatePath(`/dashboard/inventario`);

            return { ok: true, msg: 'Caja abierta exitosamente' }
        } catch (e) {
            return { ok: false, msg: 'Error en el servidor al abrir la caja' }
        }
    })