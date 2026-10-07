'use server';

import { api, auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import db from "@/server";
// import { users } from "@/server/schema/auth-schema";
import { registerSchema } from "@/types/register-schema";
import { APIError } from "better-auth";
import { headers } from "next/headers";

export const registerAction = actionClient
    .inputSchema(registerSchema)
    .action(async ({ parsedInput: { email, password, id, name, phone, username } }) => {

        try {
            const session = await auth.api.getSession({ headers: await headers() });
            if (!session) return { ok: false, msg: 'No tiene permisos para esta operacion' }
            if (session.user.role !== 'admin') return { ok: false, msg: 'No tiene permiso para realizar esta operacion' };

            if (id) {
                // editar el usuario
            }

            // validar si el usuarioo ya existe
            const existingUser = await db.query.users.findFirst({
                where: { email: { eq: email.toLowerCase() } }
            })
            if (existingUser) return { ok: false, msg: 'El usuario ya existe' }

            // crear un nuevo usuario
            await api.signUpEmail({
                body: {
                    name: name.toLowerCase(), // required
                    email: email.toLowerCase(), // required
                    password: password, // required
                    username: username.trim().toLowerCase(),
                    phone: phone.trim(),
                    role: 'saler',
                    callbackURL: '/login'
                },
            })
            return { ok: true, msg: 'Registro exitoso' }
        } catch (e) {
            if (e instanceof APIError) {
                if (e.statusCode === 401) {
                    return { ok: false, msg: 'Usuario o contraseña incorrectos' }
                }
                if (e.statusCode === 400) {
                    return { ok: false, msg: 'Correo electronico no verificado' }
                }
            }
            return { ok: false, msg: 'Error al iniciar sesión' }
        }
    })