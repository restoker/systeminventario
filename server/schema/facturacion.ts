import { coreTable } from "./communityShieldColumns";
import { text, pgTable, boolean } from "drizzle-orm/pg-core";
import { rucEmpresa } from "./ruc";

export const facturacion = coreTable('facturacion', {
    ubigeo: text('ubigeo'),//para emitir notas de credito sunat
    provincia: text('provincia'),//para emitir notas de credito sunat
    distrito: text('distrito'),//para emitir notas de credito sunat
    departamento: text('departamento'),//para emitir notas de credi
    pathCert: text('pathCert'),
    logo: text('logo'),
    usuarioSol: text('usuarioSol'),
    claveSol: text('claveSol'),
    passwordCertificadoDigital: text('passwordCertificadoDigital'),
    produccion: boolean('produccion').default(false),
    clienteId: text('clienteId'),//para emitir notas de credito sunat
    clienteSecret: text('clienteSecret'),//para emitir notas de credito sunat
    rucEmpresaId: text('rucEmpresaId').notNull().references(() => rucEmpresa.id),
})