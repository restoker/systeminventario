'use server';

import db from "@/server";

export const getUserAction = async (id: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: {
        id: id
      }
    });
    if (!user) return { ok: false, msg: 'Usuario no encontrado', data: null };

    return {
      ok: true,
      msg: 'Usuario obtenido exitosamente',
      data: user
    };
  } catch (e) {
    return {
      ok: false,
      msg: 'Error al obtener el usuario',
      data: null
    };
  }
};
