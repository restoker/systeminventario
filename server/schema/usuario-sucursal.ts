import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { sucursal } from "./sucursal";

/**
 * Tabla intermedia (muchos a muchos) entre usuarios y sucursales.
 * Define en qué sucursales puede vender cada usuario:
 *  - admin: puede tener varias filas (varias sucursales).
 *  - saler: debe tener UNA sola fila (la sucursal asignada).
 *
 * La regla "saler = 1 sucursal" depende del rol (columna de otra tabla), por lo que
 * no se puede expresar con un UNIQUE simple: se valida en la lógica de asignación
 * (server action) antes de insertar.
 */
export const usuarioSucursal = pgTable(
    "usuario_sucursal",
    {
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        sucursalId: text("sucursal_id")
            .notNull()
            .references(() => sucursal.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        // Un usuario no puede estar asignado dos veces a la misma sucursal.
        primaryKey({ columns: [table.userId, table.sucursalId] }),
        // Acelera "¿qué usuarios pueden vender en esta sucursal?".
        index("usuario_sucursal_sucursal_id_idx").on(table.sucursalId),
    ],
);

export type UsuarioSucursal = typeof usuarioSucursal.$inferSelect;
export type NewUsuarioSucursal = typeof usuarioSucursal.$inferInsert;
