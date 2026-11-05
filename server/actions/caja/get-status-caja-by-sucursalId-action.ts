'use server';

import db from "@/server";

export const getCajaStatusBySucursalIdAction = async (id: string) => {
    try {

        const caja = await db.query.caja.findFirst({
            where: {
                AND: [
                    { estado: 'abierto' },
                    { sucursalId: id }
                ]
            },
            with: {
                sucursal: true,
                usuario: true,
                ventas: true,
            }
        });
        if (!caja) return { ok: false, msg: 'No se encontro una caja abierta' };
        return { ok: true, msg: 'Ya existe una caja abierta', caja };
    } catch (error) {
        return { ok: false, msg: 'Error en el servidor' };
    }
}