import db from "@/server";
import { igv } from "@/server/schema/igv";
import { sql } from "drizzle-orm";
import type { SeedOptions } from "./tipo-pago-seed";

export const SEED_IGV = [
    {
        label: '18% (Régimen General)',
        value: 0.18,
        isActive: true,
    },
    {
        label: '10% (Régimen MYPE)',
        value: 0.10,
        isActive: true,
    },
    {
        label: '0% (Exonerado / Inafecto)',
        value: 0,
        isActive: true,
    },
] as const;

export type SeedIgvItem = typeof SEED_IGV[number];

/**
 * Seed para las tasas de IGV del sistema (18% Régimen General, 10% MYPE y 0% Exonerado/Inafecto).
 * Si clean=true (por defecto), limpia los registros anteriores e inserta el catálogo predeterminado.
 */
export const seedIgv = async (options: SeedOptions = { clean: true }) => {
    try {
        const isClean = options.clean ?? true;

        if (isClean) {
            try {
                await db.delete(igv);
            } catch {
                await db.execute(sql`TRUNCATE TABLE "igv" CASCADE;`);
            }
            console.log("🧹 [Seed] Data anterior de tasas de IGV eliminada.");
        } else {
            const existing = await db.query.igv.findMany();
            if (existing.length > 0) {
                return {
                    ok: true,
                    entity: 'igv',
                    count: 0,
                    msg: `Tasas de IGV ya existentes (${existing.length} registros). No se realizaron cambios.`,
                };
            }
        }

        const values = SEED_IGV.map((item) => ({
            value: item.value,
            isActive: item.isActive,
        }));

        await db.insert(igv).values(values);

        return {
            ok: true,
            entity: 'igv',
            count: values.length,
            msg: `${isClean ? 'Se limpió la data anterior y se' : 'Se'} insertaron exitosamente ${values.length} tasas de IGV (${SEED_IGV.map((v) => v.label).join(', ')}).`,
        };
    } catch (error) {
        console.error("Error en seedIgv:", error);
        return {
            ok: false,
            entity: 'igv',
            count: 0,
            msg: "Ocurrió un error al sembrar las tasas de IGV.",
            error,
        };
    }
};

