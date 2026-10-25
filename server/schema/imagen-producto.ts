import { coreTable } from "./communityShieldColumns";
import { text } from "drizzle-orm/pg-core";
import { products } from "./products";

export const imagenProducto = coreTable("imagen_producto", {
    url: text("url").notNull(),
    productoId: text("producto_id").notNull().references(() => products.id, { onDelete: "cascade" }),
});

export type ImagenProducto = typeof imagenProducto.$inferSelect;
export type NewImagenProducto = typeof imagenProducto.$inferInsert;

