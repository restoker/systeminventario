import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { asc, count, desc, isNotNull } from 'drizzle-orm';

import { api } from '@/lib/auth';
import db from '@/server';
import { rucEmpresa } from '@/server/schema/ruc';
import { sucursal } from '@/server/schema/sucursal';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { venta } from '@/server/schema/venta';
import { comprobante } from '@/server/schema/comprobante';
import { compra } from '@/server/schema/compras';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import type {
    RucEmpresaRow,
    RucSerieResumen,
    RucSucursalResumen,
} from '@/interfaces/rucs';
import TablaRucs from './_ui/TablaRucs';

export const dynamic = 'force-dynamic';

export default async function RucsPage() {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) {
        return redirect('/login');
    }

    const isAdmin = session.user.role === 'admin';
    const role = isAdmin ? 'admin' : 'saler';

    const [
        rucsList,
        sucursalesList,
        seriesList,
        ventasCounts,
        comprobantesCounts,
        comprasCounts,
    ] = await Promise.all([
        db
            .select()
            .from(rucEmpresa)
            .orderBy(
                desc(rucEmpresa.esPrincipal),
                desc(rucEmpresa.activo),
                asc(rucEmpresa.nombre)
            ),
        db
            .select({
                id: sucursal.id,
                nombre: sucursal.nombre,
                codigo: sucursal.codigo,
                activo: sucursal.activo,
                rucId: sucursal.rucId,
            })
            .from(sucursal)
            .where(isNotNull(sucursal.rucId))
            .orderBy(asc(sucursal.nombre)),
        db
            .select({
                id: tipoComprobante.id,
                nombre: tipoComprobante.nombre,
                serie: tipoComprobante.serie,
                estado: tipoComprobante.estado,
                rucId: tipoComprobante.rucId,
            })
            .from(tipoComprobante)
            .where(isNotNull(tipoComprobante.rucId))
            .orderBy(asc(tipoComprobante.serie)),
        db
            .select({
                rucId: venta.rucId,
                total: count(),
            })
            .from(venta)
            .where(isNotNull(venta.rucId))
            .groupBy(venta.rucId),
        db
            .select({
                rucId: comprobante.rucId,
                total: count(),
            })
            .from(comprobante)
            .where(isNotNull(comprobante.rucId))
            .groupBy(comprobante.rucId),
        db
            .select({
                rucId: compra.rucId,
                total: count(),
            })
            .from(compra)
            .where(isNotNull(compra.rucId))
            .groupBy(compra.rucId),
    ]);

    const sucursalesByRuc = new Map<string, RucSucursalResumen[]>();
    for (const s of sucursalesList) {
        if (!s.rucId) continue;
        const current = sucursalesByRuc.get(s.rucId) ?? [];
        current.push({
            id: s.id,
            nombre: s.nombre,
            codigo: s.codigo,
            activo: s.activo ?? true,
        });
        sucursalesByRuc.set(s.rucId, current);
    }

    const seriesByRuc = new Map<string, RucSerieResumen[]>();
    for (const tc of seriesList) {
        if (!tc.rucId) continue;
        const current = seriesByRuc.get(tc.rucId) ?? [];
        current.push({
            id: tc.id,
            nombre: tc.nombre,
            serie: tc.serie,
            estado: tc.estado ?? true,
        });
        seriesByRuc.set(tc.rucId, current);
    }

    const ventasMap = new Map<string, number>();
    for (const row of ventasCounts) {
        if (row.rucId) ventasMap.set(row.rucId, Number(row.total) || 0);
    }

    const comprobantesMap = new Map<string, number>();
    for (const row of comprobantesCounts) {
        if (row.rucId) comprobantesMap.set(row.rucId, Number(row.total) || 0);
    }

    const comprasMap = new Map<string, number>();
    for (const row of comprasCounts) {
        if (row.rucId) comprasMap.set(row.rucId, Number(row.total) || 0);
    }

    const rows: RucEmpresaRow[] = rucsList.map((item) => ({
        id: item.id,
        numeroRuc: item.numeroRuc,
        nombre: item.nombre,
        razonSocial: item.razonSocial,
        direccionFiscal: item.direccionFiscal,
        telefono: item.telefono,
        email: item.email,
        descripcion: item.descripcion,
        activo: item.activo,
        esPrincipal: item.esPrincipal,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        sucursales: sucursalesByRuc.get(item.id) ?? [],
        series: seriesByRuc.get(item.id) ?? [],
        totalVentas: ventasMap.get(item.id) ?? 0,
        totalComprobantes: comprobantesMap.get(item.id) ?? 0,
        totalCompras: comprasMap.get(item.id) ?? 0,
    }));

    return (
        <SidebarAux role={role}>
            <TablaRucs initialRucs={rows} isAdmin={isAdmin} />
        </SidebarAux>
    );
}
