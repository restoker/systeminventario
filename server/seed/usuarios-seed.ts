import db from "@/server";
import { users, accounts, sessions } from "@/server/schema/auth-schema";
import { usuarioSucursal } from "@/server/schema/usuario-sucursal";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import type { SeedOptions } from "./tipo-pago-seed";

export const SEED_USUARIOS = [
    {
        name: 'Administrador del Sistema',
        email: 'admin@admin.com',
        username: 'admin',
        phone: '999999999',
        role: 'admin' as const,
        password: 'admin123',
    },
    {
        name: 'Vendedor Cajero',
        email: 'vendedor@vendedor.com',
        username: 'vendedor',
        phone: '988888888',
        role: 'saler' as const,
        password: 'vendedor123',
    },
] as const;

export type SeedUsuarioItem = typeof SEED_USUARIOS[number];

/**
 * Seed para crear usuarios base (Administrador y Vendedor)
 * compatibles con Better Auth y las políticas de acceso del sistema.
 * Si clean=true (por defecto), elimina los usuarios y cuentas anteriores antes de sembrar.
 */
export const seedUsuarios = async (options: SeedOptions = { clean: true }) => {
    try {
        const isClean = options.clean ?? true;

        if (isClean) {
            try {
                await db.delete(usuarioSucursal);
                await db.delete(accounts);
                await db.delete(sessions);
                await db.delete(users);
            } catch {
                await db.execute(sql`TRUNCATE TABLE "usuario_sucursal", "accounts", "sessions", "users" CASCADE;`);
            }
            console.log("🧹 [Seed] Data anterior de usuarios eliminada.");
        }

        let insertedCount = 0;
        const details: string[] = [];

        for (const u of SEED_USUARIOS) {
            if (!isClean) {
                const existingEmail = await db.query.users.findFirst({
                    where: { email: u.email.toLowerCase() },
                });

                const existingUsername = await db.query.users.findFirst({
                    where: { username: u.username.toLowerCase() },
                });

                if (existingEmail || existingUsername) {
                    details.push(`"${u.username}" ya existía.`);
                    continue;
                }
            }

            const userId = crypto.randomUUID();
            const accountId = crypto.randomUUID();
            const hashedPassword = await hashPassword(u.password);

            await db.insert(users).values({
                id: userId,
                name: u.name,
                email: u.email.toLowerCase(),
                emailVerified: true,
                username: u.username.toLowerCase(),
                phone: u.phone,
                role: u.role,
            });

            await db.insert(accounts).values({
                id: accountId,
                accountId: userId,
                providerId: "credential",
                userId: userId,
                password: hashedPassword,
            });

            // Si es vendedor y ya existe una sucursal activa, asignarlo automáticamente
            if (u.role === 'saler') {
                const sucursalActiva = await db.query.sucursal.findFirst({
                    where: { activo: true },
                });
                if (sucursalActiva) {
                    await db.insert(usuarioSucursal).values({
                        userId,
                        sucursalId: sucursalActiva.id,
                    });
                }
            }

            insertedCount++;
            details.push(`"${u.username}" (${u.role})`);
        }

        return {
            ok: true,
            entity: 'usuarios',
            count: insertedCount,
            msg: `${isClean ? 'Se limpió la data anterior y se' : 'Se'} crearon ${insertedCount} usuarios: ${details.join(', ')}.`,
        };
    } catch (error) {
        console.error("Error en seedUsuarios:", error);
        return {
            ok: false,
            entity: 'usuarios',
            count: 0,
            msg: "Ocurrió un error al sembrar los usuarios.",
            error,
        };
    }
};
