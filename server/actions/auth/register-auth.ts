'use server';

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import { registerSchema } from "@/types/register-schema";

export const registerAction = actionClient
    .inputSchema(registerSchema)
    .action(async ({ parsedInput: { email, password, id } }) => {

        try {
            const session = await auth.api.getSession();
            if (!session) return { ok: false, msg: 'No tiene permisos para esta operacion' }
            // if (session.user.role !== 'admin') return { ok: false, msg: 'No tiene permiso para realizar esta operacion' };
            if (id) {
                // editar el usuario
            }

            // crear un nuevo usuario
            return { ok: true, msg: 'Registro exitoso' }
        } catch (error) {
            return { ok: false, msg: 'Error al registrar el usuario' }
        }
    })