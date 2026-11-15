'use server';

import { headers } from 'next/headers';
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';

import db from '@/server';
import { api } from '@/lib/auth';
import { compra } from '@/server/schema/compras';
import { proveedor } from '@/server/schema/proveedor';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { sucursal } from '@/server/schema/sucursal';
import { users } from '@/server/schema/auth-schema';

export interface ExportTransaccionesFilterParams {
    fechaInicio?: string;
    fechaFin?: string;
    proveedorId?: string;
    sucursalId?: string;
    estado?: string;
    condicion?: string;
    search?: string;
}

export async function exportarTransaccionesProveedorCSVAction(
    params: ExportTransaccionesFilterParams
) {
    try {
        const session = await api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: 'No autorizado. Por favor inicia sesión.' };
        }

        let sucursalId = params.sucursalId;
        if (session.user.role === 'saler') {
            const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
                where: { userId: session.user.id },
            });
            if (!usuarioSucursal) {
                return { success: false, error: 'Usuario vendedor sin sucursal asignada.' };
            }
            sucursalId = usuarioSucursal.sucursalId;
        }

        const conditions: SQL[] = [];

        if (session.user.role === 'saler') {
            conditions.push(eq(compra.sucursalId, sucursalId!));
        } else if (sucursalId && sucursalId !== 'all') {
            conditions.push(eq(compra.sucursalId, sucursalId));
        }

        if (params.proveedorId && params.proveedorId !== 'all') {
            conditions.push(eq(compra.proveedorId, params.proveedorId));
        }

        if (params.estado === 'pendiente' || params.estado === 'pagado') {
            conditions.push(eq(compra.estado, params.estado));
        }

        if (params.condicion === 'credito') {
            conditions.push(eq(compra.isACredito, true));
        } else if (params.condicion === 'contado') {
            conditions.push(eq(compra.isACredito, false));
        }

        const effectiveDateSql = sql`coalesce(${compra.fechaComprobante}, ${compra.createdAt})`;

        if (params.fechaInicio) {
            const start = new Date(`${params.fechaInicio}T00:00:00`);
            if (!isNaN(start.getTime())) {
                conditions.push(gte(effectiveDateSql, start));
            }
        }

        if (params.fechaFin) {
            const end = new Date(`${params.fechaFin}T23:59:59.999`);
            if (!isNaN(end.getTime())) {
                conditions.push(lte(effectiveDateSql, end));
            }
        }

        if (params.search?.trim()) {
            const search = params.search.trim();
            conditions.push(
                or(
                    ilike(compra.numeroComprobante, `%${search}%`),
                    ilike(proveedor.nombre, `%${search}%`),
                    ilike(proveedor.razonSocial, `%${search}%`),
                    ilike(proveedor.numeroDocumento, `%${search}%`),
                    ilike(users.name, `%${search}%`)
                )!
            );
        }

        const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

        const records = await db
            .select({
                numeroComprobante: compra.numeroComprobante,
                monto: compra.monto,
                estado: compra.estado,
                isACredito: compra.isACredito,
                numeroDiasCredito: compra.numeroDiasCredito,
                fechaComprobante: compra.fechaComprobante,
                createdAt: compra.createdAt,
                tipoComprobanteNombre: tipoComprobante.nombre,
                proveedorNombre: proveedor.nombre,
                proveedorRazonSocial: proveedor.razonSocial,
                proveedorDocumento: proveedor.numeroDocumento,
                sucursalNombre: sucursal.nombre,
                usuarioNombre: users.name,
            })
            .from(compra)
            .innerJoin(proveedor, eq(compra.proveedorId, proveedor.id))
            .innerJoin(tipoComprobante, eq(compra.tipoComprobanteId, tipoComprobante.id))
            .innerJoin(sucursal, eq(compra.sucursalId, sucursal.id))
            .leftJoin(users, eq(compra.userId, users.id))
            .where(whereSql)
            .orderBy(desc(effectiveDateSql), desc(compra.createdAt))
            .limit(5000);

        if (records.length === 0) {
            return {
                success: false,
                error: 'No se encontraron transacciones con los filtros aplicados.',
            };
        }

        const dateFormatter = new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        const headersRow = [
            'Fecha Emision',
            'Tipo Comprobante',
            'Nro Comprobante',
            'Proveedor',
            'Razon Social',
            'Documento / RUC',
            'Sucursal',
            'Condicion',
            'Dias Credito',
            'Fecha Vencimiento',
            'Estado Pago',
            'Monto Total (S/)',
            'Registrado Por',
        ];

        const csvEscape = (val: string | null | undefined) =>
            `"${(val || '').replace(/"/g, '""')}"`;

        const rows = records.map((r) => {
            const fechaBase = new Date(r.fechaComprobante || r.createdAt || new Date());
            let fechaVenc = '-';
            if (r.isACredito && r.numeroDiasCredito && r.numeroDiasCredito > 0) {
                const vencDate = new Date(fechaBase);
                vencDate.setDate(vencDate.getDate() + r.numeroDiasCredito);
                fechaVenc = dateFormatter.format(vencDate);
            }

            return [
                csvEscape(dateFormatter.format(fechaBase)),
                csvEscape(r.tipoComprobanteNombre),
                csvEscape(r.numeroComprobante),
                csvEscape(r.proveedorNombre),
                csvEscape(r.proveedorRazonSocial || r.proveedorNombre),
                csvEscape(r.proveedorDocumento || '-'),
                csvEscape(r.sucursalNombre),
                csvEscape(r.isACredito ? 'Crédito' : 'Al Contado'),
                r.isACredito && r.numeroDiasCredito ? r.numeroDiasCredito : 0,
                csvEscape(fechaVenc),
                csvEscape(r.estado === 'pagado' ? 'Pagado' : 'Pendiente'),
                Number(r.monto || 0).toFixed(2),
                csvEscape(r.usuarioNombre || 'Sistema'),
            ].join(',');
        });

        const csvContent = [headersRow.join(','), ...rows].join('\n');

        return {
            success: true,
            csvContent,
            count: records.length,
        };
    } catch (error) {
        console.error('Error al exportar transacciones a CSV:', error);
        return {
            success: false,
            error: 'Ocurrió un error inesperado al exportar las transacciones.',
        };
    }
}
