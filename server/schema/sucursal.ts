import { coreTable } from "./communityShieldColumns";
import { text, boolean } from "drizzle-orm/pg-core";

export const sucursal = coreTable("sucursal", {
    nombre: text('nombre').notNull(),
    direccion: text('direccion').notNull(),
    telefono: text('telefono').notNull(),
    email: text('email'),
    activo: boolean('activo').default(true),
    numeroDocumento: text('numero_documento').unique(),
    ruc: text('ruc'),
    razonSocial: text('razon_social'),
});

export type Sucursal = typeof sucursal.$inferSelect;
export type NewSucursal = typeof sucursal.$inferInsert;