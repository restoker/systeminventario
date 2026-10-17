import { boolean, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const proveedor = coreTable("proveedor", {
    nombre: text("nombre").notNull(),
    telefono: text("telefono"),
    direccion: text("direccion"),
    email: text("email"),
    numeroDocumento: text("numero_documento").unique(),
    activo: boolean("activo").default(true),
    razonSocial: text("razon_social"),
});

export type Proveedor = typeof proveedor.$inferSelect;
