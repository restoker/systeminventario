'use server';

import { headers } from 'next/headers';
import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { api } from '@/lib/auth';
import db from '@/server';
import { kardex } from '@/server/schema/kardex';
import { products } from '@/server/schema/products';
import { sucursal } from '@/server/schema/sucursal';
import { unidades } from '@/server/schema/unidad';
import { users } from '@/server/schema/auth-schema';
import { MOTIVOS_LABELS } from '@/types/kardex-schema';

export interface ExportKardexFilterParams {
    fechaInicio?: string;
    fechaFin?: string;
    sucursalId?: string;
    productoId?: string;
    tipo?: string;
    motivo?: string;
    search?: string;
}

export async function exportarKardexCSVAction(params: ExportKardexFilterParams) {
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

        // 1. Sucursal
        if (session.user.role === 'saler') {
            conditions.push(eq(kardex.sucursalId, sucursalId!));
        } else if (sucursalId && sucursalId !== 'all') {
            conditions.push(eq(kardex.sucursalId, sucursalId));
        }

        // 2. Producto
        if (params.productoId && params.productoId !== 'all') {
            conditions.push(eq(kardex.productoId, params.productoId));
        }

        // 3. Tipo (ENTRADA / SALIDA)
        if (params.tipo && params.tipo !== 'all' && (params.tipo === 'ENTRADA' || params.tipo === 'SALIDA')) {
            conditions.push(eq(kardex.tipoMovimiento, params.tipo as any));
        }

        // 4. Motivo
        if (params.motivo && params.motivo !== 'all') {
            conditions.push(eq(kardex.motivo, params.motivo as any));
        }

        // 5. Rango de fechas
        if (params.fechaInicio) {
            const start = new Date(`${params.fechaInicio}T00:00:00`);
            if (!isNaN(start.getTime())) {
                conditions.push(gte(kardex.fecha, start));
            }
        }

        if (params.fechaFin) {
            const end = new Date(`${params.fechaFin}T23:59:59.999`);
            if (!isNaN(end.getTime())) {
                conditions.push(lte(kardex.fecha, end));
            }
        }

        // 6. Búsqueda por texto
        if (params.search?.trim()) {
            const search = params.search.trim();
            conditions.push(
                or(
                    ilike(kardex.comprobanteRef, `%${search}%`),
                    ilike(kardex.detalleMotivo, `%${search}%`),
                    ilike(products.name, `%${search}%`),
                    ilike(products.codigo, `%${search}%`)
                )!
            );
        }

        const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

        // Limitar a máximo 5000 registros para evitar sobrecargar memoria y mantener velocidad
        const records = await db
            .select({
                secuencia: kardex.secuencia,
                fecha: kardex.fecha,
                tipoMovimiento: kardex.tipoMovimiento,
                motivo: kardex.motivo,
                detalleMotivo: kardex.detalleMotivo,
                comprobanteRef: kardex.comprobanteRef,
                cantidad: kardex.cantidad,
                stockAnterior: kardex.stockAnterior,
                stockActual: kardex.stockActual,
                costoUnitario: kardex.costoUnitario,
                costoTotal: kardex.costoTotal,
                saldoValorizado: kardex.saldoValorizado,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                unidadAbrev: unidades.abreviatura,
                unidadNombre: unidades.nombre,
                sucursalNombre: sucursal.nombre,
                usuarioNombre: users.name,
            })
            .from(kardex)
            .innerJoin(products, eq(kardex.productoId, products.id))
            .innerJoin(sucursal, eq(kardex.sucursalId, sucursal.id))
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .leftJoin(users, eq(kardex.usuarioId, users.id))
            .where(whereSql)
            .orderBy(desc(kardex.fecha), desc(kardex.secuencia))
            .limit(5000);

        if (records.length === 0) {
            return { success: false, error: 'No se encontraron registros de Kardex con los filtros aplicados.' };
        }

        const dateFormatter = new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        const timeFormatter = new Intl.DateTimeFormat('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const headersRow = [
            'Fecha',
            'Hora',
            'Secuencia',
            'Tipo',
            'Motivo',
            'Producto',
            'Codigo',
            'Unidad',
            'Sucursal',
            'Comprobante',
            'Cantidad',
            'Stock Anterior',
            'Stock Actual',
            'Costo Unitario (S/)',
            'Costo Total (S/)',
            'Saldo Valorizado (S/)',
            'Usuario Responsable',
            'Detalle / Observacion',
        ];

        const rows = records.map((item) => {
            const itemFecha = new Date(item.fecha);
            const costoUnit = Number(item.costoUnitario) || 0;
            const costoTotal = Number(item.costoTotal) || item.cantidad * costoUnit;
            const saldoValorizado = Number(item.saldoValorizado) || 0;
            const motivoLabel = MOTIVOS_LABELS[item.motivo] || item.motivo;

            return [
                `"${dateFormatter.format(itemFecha)}"`,
                `"${timeFormatter.format(itemFecha)}"`,
                item.secuencia,
                `"${item.tipoMovimiento}"`,
                `"${motivoLabel}"`,
                `"${(item.productoNombre || '').replace(/"/g, '""')}"`,
                `"${item.productoCodigo || ''}"`,
                `"${item.unidadAbrev || item.unidadNombre || 'UND'}"`,
                `"${(item.sucursalNombre || '').replace(/"/g, '""')}"`,
                `"${item.comprobanteRef || '-'}"`,
                item.cantidad,
                item.stockAnterior,
                item.stockActual,
                costoUnit.toFixed(2),
                costoTotal.toFixed(2),
                saldoValorizado.toFixed(2),
                `"${(item.usuarioNombre || 'Sistema').replace(/"/g, '""')}"`,
                `"${(item.detalleMotivo || '').replace(/"/g, '""')}"`,
            ];
        });

        const csvContent = [headersRow.join(','), ...rows.map((r) => r.join(','))].join('\n');

        return {
            success: true,
            csvContent,
            count: records.length,
        };
    } catch (error) {
        console.error('Error al exportar Kardex CSV:', error);
        return { success: false, error: 'Ocurrió un error inesperado al generar el archivo de Kardex.' };
    }
}
