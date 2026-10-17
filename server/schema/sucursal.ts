import { coreTable } from "./communityShieldColumns";
import { text, boolean } from "drizzle-orm/pg-core";

export const sucursal = coreTable("sucursal", {
    nombre: text('nombre').notNull(),
    direccion: text('direccion').notNull(),
    telefono: text('telefono').notNull(),
    codigo: text('codigo').unique().notNull(),
    email: text('email'),
    ruc: text('ruc'),
    razonSocial: text('razon_social'),
    activo: boolean('activo').default(true),
});

export type Sucursal = typeof sucursal.$inferSelect;
export type NewSucursal = typeof sucursal.$inferInsert;