import db from "@/server";
import { tipoPago } from "@/server/schema/tipo-pago";
import { sql } from "drizzle-orm";

export const SEED_TIPOS_PAGO = [
    'Efectivo',
    'Tarjeta',
    'PLIN',
    'YAPE',
    'Deposito',
    'Falta pagar',
] as const;

export type SeedTipoPagoNombre = typeof SEED_TIPOS_PAGO[number];

export interface SeedOptions {
    clean?: boolean; // Si es true (por defecto), borra la data anterior antes de insertar
}

/**
 * Seed para los tipos de pago básicos del sistema POS.
 * Si clean=true (por defecto), borra los tipos de pago anteriores e inserta la lista predeterminada:
 * Efectivo, Tarjeta, PLIN, YAPE, Deposito y Falta pagar.
 */
export const seedTiposPago = async (options: SeedOptions = { clean: true }) => {
    try {
        const isClean = options.clean ?? true;

        if (isClean) {
            try {
                await db.delete(tipoPago);
            } catch {
                await db.execute(sql`TRUNCATE TABLE "tipo_pago" CASCADE;`);
            }
            console.log("🧹 [Seed] Data anterior de tipos de pago eliminada.");
        } else {
            const existing = await db.query.tipoPago.findMany();
            if (existing.length > 0) {
                return {
                    ok: true,
                    entity: 'tipo_pago',
                    count: 0,
                    msg: `Tipos de pago ya existentes (${existing.length} registros). No se realizaron cambios.`,
                };
            }
        }

        const seedValues = SEED_TIPOS_PAGO.map((nombre) => ({
            nombre,
            estado: true,
        }));

        await db.insert(tipoPago).values(seedValues);

        return {
            ok: true,
            entity: 'tipo_pago',
            count: seedValues.length,
            msg: `${isClean ? 'Se limpió la data anterior y se' : 'Se'} insertaron exitosamente ${seedValues.length} tipos de pago.`,
        };
    } catch (error) {
        console.error("Error en seedTiposPago:", error);
        return {
            ok: false,
            entity: 'tipo_pago',
            count: 0,
            msg: "Ocurrió un error al sembrar los tipos de pago.",
            error,
        };
    }
};
