import { pgEnum, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { coreTable } from "./communityShieldColumns";

export const estadoCajaEnum = pgEnum("estado_caja", ["abierto", "cerrado"]);

export const caja = coreTable("caja", {
    fechaApertura: timestamp('fecha_apertura', { mode: 'date', withTimezone: true }).defaultNow(),
    fechaCierre: timestamp('fecha_cierre', { mode: 'date', withTimezone: true }),
    montoApertura: real('monto_apertura').notNull(),
    montoCierre: real('monto_cierre'),
    estado: estadoCajaEnum('estado').default('cerrado'),
    userId: text('userId').notNull().references(() => users.id),
    fechaCreada: timestamp('fecha_creada', { mode: 'date', withTimezone: true }),
});