'use server';

import { api, auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import db from "@/server";
import { users, accounts } from "@/server/schema/auth-schema";
import { registerSchema } from "@/types/register-schema";
import { APIError } from "better-auth";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const registerAction = actionClient
    .inputSchema(registerSchema)
    .action(async ({ parsedInput: { email, password, id, name, phone, username } }) => {

        try {
            // const session = await auth.api.getSession({ headers: await headers() });
            // if (!session) return { ok: false, msg: 'No tiene permisos para esta operacion' }
            // if (session.user.role !== 'admin') return { ok: false, msg: 'No tiene permiso para realizar esta operacion' };

            if (id) {
                // Verificar si otro usuario ya tiene el correo
                const emailExists = await db.query.users.findFirst({
                    where: { email: { eq: email.toLowerCase() } }
                });
                if (emailExists && emailExists.id !== id) {
                    return { ok: false, msg: 'El correo electrónico ya está en uso por otro usuario' };
                }

                // Verificar si otro usuario ya tiene el username
                const usernameExists = await db.query.users.findFirst({
                    where: { username: { eq: username.trim().toLowerCase() } }
                });
                if (usernameExists && usernameExists.id !== id) {
                    return { ok: false, msg: 'El nombre de usuario ya está en uso por otro usuario' };
                }

                const [updatedUser] = await db.update(users).set({
                    ...(name && { name: name.toLowerCase() }),
                    ...(email && { email: email.toLowerCase() }),
                    ...(username && { username: username.trim().toLowerCase() }),
                    ...(phone && { phone: phone.trim() }),
                }).where(eq(users.id, id)).returning();

                // Si se proporcionó una nueva contraseña, actualizarla en accounts
                if (password && password.trim().length >= 4) {
                    const hashedPassword = await hashPassword(password);
                    await db.update(accounts)
                        .set({ password: hashedPassword })
                        .where(eq(accounts.userId, id));
                }

                revalidatePath('/dashboard/vendedores');
                return { ok: true, msg: 'Vendedor actualizado exitosamente', user: updatedUser };
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
                    callbackURL: '/login',
                    role: "saler",
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