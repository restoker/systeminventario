'use server';

import { headers } from 'next/headers';
import { and, eq, gte, ilike, inArray, lte, or, type SQL } from 'drizzle-orm';
import { api } from '@/lib/auth';
import db from '@/server';
import { kardex } from '@/server/schema/kardex';
import { products } from '@/server/schema/products';
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
            const matchingProducts = await db
                .select({ id: products.id })
                .from(products)
                .where(
                    or(
                        ilike(products.name, `%${search}%`),
                        ilike(products.codigo, `%${search}%`)
                    )
                )
                .limit(100);

            const productIds = matchingProducts.map((p) => p.id);
            const searchOrs: SQL[] = [
                ilike(kardex.comprobanteRef, `%${search}%`),
                ilike(kardex.detalleMotivo, `%${search}%`),
            ];

            if (productIds.length > 0) {
                searchOrs.push(inArray(kardex.productoId, productIds));
            }

            conditions.push(or(...searchOrs)!);
        }

        const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

        // Limitar a máximo 5000 registros para evitar sobrecargar memoria y mantener velocidad
        const records = await db.query.kardex.findMany({
            where: whereSql ? { RAW: whereSql } : undefined,
            with: {
                producto: {
                    with: {
                        unidad: true,
                        categoria: true,
                    },
                },
                sucursal: true,
                usuario: true,
            },
            orderBy: (k, { desc }) => [desc(k.fecha), desc(k.secuencia)],
            limit: 5000,
        });

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
                `"${(item.producto?.name || '').replace(/"/g, '""')}"`,
                `"${item.producto?.codigo || ''}"`,
                `"${item.producto?.unidad?.abreviatura || item.producto?.unidad?.nombre || 'UND'}"`,
                `"${(item.sucursal?.nombre || '').replace(/"/g, '""')}"`,
                `"${item.comprobanteRef || '-'}"`,
                item.cantidad,
                item.stockAnterior,
                item.stockActual,
                costoUnit.toFixed(2),
                costoTotal.toFixed(2),
                saldoValorizado.toFixed(2),
                `"${(item.usuario?.name || 'Sistema').replace(/"/g, '""')}"`,
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
