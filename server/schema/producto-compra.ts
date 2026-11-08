import { real, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { products } from "./products";
import { compra } from "./compras";


export const productosCompras = coreTable('productosCompras', {
    precio: real('precio').notNull(),
    cantidad: real('cantidad').notNull(),
    compraId: text('compraId').notNull().references(() => compra.id),
    productoId: text('productoId').notNull().references(() => products.id),
})