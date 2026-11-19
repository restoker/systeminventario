import db from "@/server";
import { rucEmpresa } from "@/server/schema/ruc";
import { sql } from "drizzle-orm";
import type { SeedOptions } from "./tipo-pago-seed";

export const SEED_RUCS = [
    {
        numeroRuc: '10456789121',
        nombre: 'Las Gardias S.A.C.',
        razonSocial: 'LAS GARDIAS S.A.C.',
        direccionFiscal: 'Av. Los Álamos 123, Urb. San Isidro, Lima, Lima',
        telefono: '(01) 421-9876',
        email: 'contacto@lasgardias.pe',
        descripcion: 'RUC Principal emisor para ventas y facturación general del negocio.',
        activo: true,
        esPrincipal: true,
    },
    {
        numeroRuc: '20601411947',
        nombre: 'Conexus Distribuciones',
        razonSocial: 'CONEXUS DISTRIBUCIONES E.I.R.L.',
        direccionFiscal: 'Av. Los Corales Mza. C Lote 10, Lima, Lima',
        telefono: '987654321',
        email: 'ventas@conexusdistribuciones.com',
        descripcion: 'Distribuidora mayorista y comercio especializado al por menor.',
        activo: true,
        esPrincipal: false,
    },
    {
        numeroRuc: '20552194831',
        nombre: 'Inversiones Comerciales del Perú',
        razonSocial: 'INVERSIONES COMERCIALES DEL PERU S.A.C.',
        direccionFiscal: 'Calle Las Camelias 450, Piso 3, San Isidro, Lima',
        telefono: '(01) 612-4000',
        email: 'facturacion@inversionesdelperu.pe',
        descripcion: 'Emisor fiscal para sucursales express y ventas retail.',
        activo: true,
        esPrincipal: false,
    },
] as const;

export type SeedRucItem = typeof SEED_RUCS[number];

/**
 * Seed para las razones sociales y RUCs emisores de la empresa (Multi-RUC).
 * Si clean=true (por defecto), limpia los RUCs anteriores e inserta el catálogo predeterminado,
 * vinculando automáticamente las sucursales existentes al RUC principal.
 */
export const seedRucs = async (options: SeedOptions = { clean: true }) => {
    try {
        const isClean = options.clean ?? true;

        if (isClean) {
            try {
                // Desvincular temporalmente claves foráneas para evitar conflictos
                await db.execute(sql`UPDATE "sucursal" SET "ruc_id" = NULL WHERE "ruc_id" IS NOT NULL;`);
                await db.execute(sql`UPDATE "comprobante" SET "ruc_id" = NULL WHERE "ruc_id" IS NOT NULL;`);
                await db.execute(sql`UPDATE "venta" SET "ruc_id" = NULL WHERE "ruc_id" IS NOT NULL;`);
                await db.execute(sql`UPDATE "compras" SET "ruc_id" = NULL WHERE "ruc_id" IS NOT NULL;`);
                await db.delete(rucEmpresa);
            } catch {
                await db.execute(sql`TRUNCATE TABLE "ruc_empresa" CASCADE;`);
            }
            console.log("🧹 [Seed] Data anterior de RUCs de la empresa eliminada.");
        } else {
            const existing = await db.query.rucEmpresa.findMany();
            if (existing.length > 0) {
                return {
                    ok: true,
                    entity: 'ruc_empresa',
                    count: 0,
                    msg: `RUCs de empresa ya existentes (${existing.length} registros). No se realizaron cambios.`,
                };
            }
        }

        const values = SEED_RUCS.map((item) => ({
            numeroRuc: item.numeroRuc,
            nombre: item.nombre,
            razonSocial: item.razonSocial,
            direccionFiscal: item.direccionFiscal,
            telefono: item.telefono,
            email: item.email,
            descripcion: item.descripcion,
            activo: item.activo,
            esPrincipal: item.esPrincipal,
        }));

        const insertedRucs = await db.insert(rucEmpresa).values(values).returning();

        // Si existen sucursales registradas sin RUC asociado, vincularlas al RUC principal
        const principalRuc = insertedRucs.find((r) => r.esPrincipal) || insertedRucs[0];
        if (principalRuc) {
            await db.execute(
                sql`UPDATE "sucursal" SET "ruc_id" = ${principalRuc.id} WHERE "ruc_id" IS NULL;`
            );
        }

        return {
            ok: true,
            entity: 'ruc_empresa',
            count: insertedRucs.length,
            msg: `${isClean ? 'Se limpió la data anterior y se' : 'Se'} insertaron exitosamente ${insertedRucs.length} RUCs emisores (${SEED_RUCS.map((r) => r.numeroRuc).join(', ')}).`,
        };
    } catch (error) {
        console.error("Error en seedRucs:", error);
        return {
            ok: false,
            entity: 'ruc_empresa',
            count: 0,
            msg: "Ocurrió un error al sembrar los RUCs de la empresa.",
            error,
        };
    }
};
