import { coreTable } from "./communityShieldColumns";
import { text, boolean } from "drizzle-orm/pg-core";

export const rucEmpresa = coreTable("ruc_empresa", {
    numeroRuc: text("numero_ruc").notNull().unique(),
    nombre: text("nombre").notNull(), // Nombre comercial
    razonSocial: text("razon_social"), // Razón social oficial SUNAT
    direccionFiscal: text("direccion_fiscal"), // Dirección fiscal oficial
    telefono: text("telefono"),
    email: text("email"),
    descripcion: text("descripcion"),
    activo: boolean("activo").default(true).notNull(),
    esPrincipal: boolean("es_principal").default(false).notNull(),
    // ubigeo: text('ubigeo'),//para emitir notas de credito sunat
    // provincia: text('provincia'),//para emitir notas de credito sunat
    // distrito: text('distrito'),//para emitir notas de credito sunat
    // departamento: text('departamento'),//para emitir notas de credi
    // pathCert: text('pathCert'),
    // logo: text('logo'),
    // usuarioSol: text('usuarioSol'),
    // claveSol: text('claveSol'),
});

export type RucEmpresa = typeof rucEmpresa.$inferSelect;
export type NewRucEmpresa = typeof rucEmpresa.$inferInsert;
