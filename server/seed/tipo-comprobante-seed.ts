import db from "@/server";
import { tipoComprobante } from "@/server/schema/tipo-comprobante";
import { sql } from "drizzle-orm";
import type { SeedOptions } from "./tipo-pago-seed";

export const SEED_TIPOS_COMPROBANTE = [
    {
        nombre: 'Factura',
        serie: 'F001',
        numero: '00000000',
        nombreSunat: 'FACTURA ELECTRÓNICA',
        correlative: 0,
        estado: true,
    },
    {
        nombre: 'Boleta',
        serie: 'B001',
        numero: '00000000',
        nombreSunat: 'BOLETA DE VENTA ELECTRÓNICA',
        correlative: 0,
        estado: true,
    },
    {
        nombre: 'Ticket',
        serie: 'T001',
        numero: '00000000',
        nombreSunat: 'TICKET DE VENTA',
        correlative: 0,
        estado: true,
    },
    {
        nombre: 'Liquidación de Compra',
        serie: 'E001',
        numero: '00000000',
        nombreSunat: 'LIQUIDACIÓN DE COMPRA ELECTRÓNICA',
        correlative: 0,
        estado: true,
    },
    {
        nombre: 'Sin Comprobante',
        serie: 'S001',
        numero: '00000000',
        nombreSunat: 'SIN COMPROBANTE',
        correlative: 0,
        estado: true,
    },
] as const;

export type SeedTipoComprobanteItem = typeof SEED_TIPOS_COMPROBANTE[number];

/**
 * Seed para los tipos de comprobante de venta e inventario (Factura, Boleta, Ticket, etc.).
 * Si clean=true (por defecto), borra los comprobantes anteriores e inserta el catálogo predeterminado.
 */
export const seedTiposComprobante = async (options: SeedOptions = { clean: true }) => {
    try {
        const isClean = options.clean ?? true;

        if (isClean) {
            try {
                await db.delete(tipoComprobante);
            } catch {
                await db.execute(sql`TRUNCATE TABLE "tipo_comprobante" CASCADE;`);
            }
            console.log("🧹 [Seed] Data anterior de tipos de comprobante eliminada.");
        } else {
            const existing = await db.query.tipoComprobante.findMany();
            if (existing.length > 0) {
                return {
                    ok: true,
                    entity: 'tipo_comprobante',
                    count: 0,
                    msg: `Tipos de comprobante ya existentes (${existing.length} registros). No se realizaron cambios.`,
                };
            }
        }

        const values = SEED_TIPOS_COMPROBANTE.map((item) => ({
            nombre: item.nombre,
            estado: item.estado,
            serie: item.serie,
            numero: item.numero,
            nombreSunat: item.nombreSunat,
            correlative: item.correlative,
        }));

        await db.insert(tipoComprobante).values(values);

        return {
            ok: true,
            entity: 'tipo_comprobante',
            count: values.length,
            msg: `${isClean ? 'Se limpió la data anterior y se' : 'Se'} insertaron exitosamente ${values.length} tipos de comprobante (${values.map((v) => v.nombre).join(', ')}).`,
        };
    } catch (error) {
        console.error("Error en seedTiposComprobante:", error);
        return {
            ok: false,
            entity: 'tipo_comprobante',
            count: 0,
            msg: "Ocurrió un error al sembrar los tipos de comprobante.",
            error,
        };
    }
};
