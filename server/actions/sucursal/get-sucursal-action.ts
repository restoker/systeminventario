'use server';

import db from "@/server";

export const getSucursalAction = async (id: string) => {
  try {
    const sucursal = await db.query.sucursal.findFirst({
      where: {
        id: id
      }
    });
    if (!sucursal) return { ok: false, msg: 'Sucursal no encontrada', data: null };

    return {
      ok: true,
      msg: 'Sucursal obtenida exitosamente',
      data: sucursal
    };
  } catch (e) {
    return {
      ok: false,
      msg: 'Error al obtener la sucursal',
      data: null
    };
  }
};