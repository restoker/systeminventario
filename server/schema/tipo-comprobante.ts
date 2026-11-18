import { coreTable } from "./communityShieldColumns";
import { text, boolean, integer } from "drizzle-orm/pg-core";
import { rucEmpresa } from "./ruc";

export const tipoComprobante = coreTable("tipo_comprobante", {
    nombre: text('nombre').notNull(),
    estado: boolean('estado').default(true),
    serie: text('series').notNull(), //si es ticker la serie es: T001, si es boleta B001, si es factura F001, liquidacion de compra es E001.
    numero: text('numero').notNull(),
    nombreSunat: text('nombre_sunat'),
    correlative: integer('correlative').notNull(),
    rucId: text('ruc_id').references(() => rucEmpresa.id),
});

export type TipoComprobante = typeof tipoComprobante.$inferSelect;
export type NewTipoComprobante = typeof tipoComprobante.$inferInsert;
