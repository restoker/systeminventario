import { integer, real, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { venta } from "./venta";
import { products } from "./products";


export const productoVenta = coreTable("productos_venta", {
    cantidad: integer("cantidad").notNull(),
    precio: real("precio").notNull(),
    descuento: real("descuento").default(0),
    productId: text("product_id").references(() => products.id).notNull(),
    precioTotal: real("precio_total").notNull(),
    ventaId: text("venta_id").references(() => venta.id).notNull(),
});

export type ProductoVenta = typeof productoVenta.$inferSelect;
export type NewProductoVenta = typeof productoVenta.$inferInsert;