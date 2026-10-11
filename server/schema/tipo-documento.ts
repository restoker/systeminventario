import { boolean, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const tipoDocumento = coreTable("tipo_documento", {
    nombre: text('nombre').notNull(),
    estado: boolean('estado').default(true),
});

export type TipoDocumento = typeof tipoDocumento.$inferSelect;
export type NewTipoDocumento = typeof tipoDocumento.$inferInsert;