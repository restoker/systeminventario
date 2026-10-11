import { text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const marcas = coreTable("marcas", {
    nombre: text("nombre").notNull(),
    imagen: text("imagen"),
    descripcion: text("descripcion"),
    pais: text("pais"),
});

export type Marca = typeof marcas.$inferSelect;
export type NewMarca = typeof marcas.$inferInsert;