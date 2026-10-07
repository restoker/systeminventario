'use server';

import { actionClient } from "@/lib/safe-action";
import { loginSchema } from "@/types/login-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/server";
// import { users } from "@/server/schema/auth-schema";

export const loginAction = actionClient
    .inputSchema(loginSchema)
    .action(async ({ parsedInput: { username, password } }) => {
        // console.log(username, password);
        try {
            // const [user] = await db
            //     .select()
            //     .from(users)
            //     .where(eq(users.username, username))
            //     .limit(1);
            const usuarioExiste = await db.query.users.findFirst({
                where: { username: { eq: username } }
            });

            console.log(usuarioExiste);

            if (!usuarioExiste) return {
                ok: false,
                msg: "Usuario o contraseña incorrectos",
            };

            const response = await auth.api.signInEmail({
                body: {
                    email: usuarioExiste.email,
                    password,
                },
                headers: await headers(),
            });

            return { ok: true, msg: "Inicio de sesión exitoso" };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error al iniciar sesión";
            return {
                ok: false,
                msg: message,
            };
        }
    });
