import { boolean, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const tipoPago = coreTable("tipo_pago", {
    nombre: text('nombre').notNull(),
    estado: boolean('estado').default(true),
});

export type TipoPago = typeof tipoPago.$inferSelect;
export type NewTipoPago = typeof tipoPago.$inferInsert;

