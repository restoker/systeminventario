import { coreTable } from "./communityShieldColumns";
import { text, boolean } from "drizzle-orm/pg-core";
import { rucEmpresa } from "./ruc";

export const sucursal = coreTable("sucursal", {
    nombre: text('nombre').notNull(),
    direccion: text('direccion').notNull(),
    telefono: text('telefono').notNull(),
    codigo: text('codigo').unique().notNull(),
    email: text('email'),
    razonSocial: text('razon_social'),
    activo: boolean('activo').default(true),
    rucId: text('ruc_id').references(() => rucEmpresa.id),
});

export type Sucursal = typeof sucursal.$inferSelect;
export type NewSucursal = typeof sucursal.$inferInsert;