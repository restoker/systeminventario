'use server';

import { actionClient } from "@/lib/safe-action";
import { loginSchema } from "@/types/login-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const loginAction = actionClient
    .inputSchema(loginSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        try {
            const response = await auth.api.signInEmail({
                body: {
                    email,
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
