'use server';

import { headers } from 'next/headers';
import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';

import { api } from '@/lib/auth';
import db from '@/server';
import { devolucion } from '@/server/schema/devolucion';
import { venta } from '@/server/schema/venta';
import { products } from '@/server/schema/products';
import { sucursal } from '@/server/schema/sucursal';
import { unidades } from '@/server/schema/unidad';
import { users } from '@/server/schema/auth-schema';
import { comprobante } from '@/server/schema/comprobante';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { DevolucionFilters } from '@/types/devolucion-schema';

export async function exportarDevolucionesCSVAction(filters: Partial<DevolucionFilters>) {
    try {
        const session = await api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: 'No autorizado. Por favor inicia sesión.' };
        }

        let sucursalId = filters.sucursalId;
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
            conditions.push(eq(devolucion.sucursalId, sucursalId!));
        } else if (sucursalId && sucursalId !== 'all') {
            conditions.push(eq(devolucion.sucursalId, sucursalId));
        }

        if (filters.productoId && filters.productoId !== 'all') {
            conditions.push(eq(devolucion.productoId, filters.productoId));
        }

        if (filters.fechaInicio) {
            const start = new Date(`${filters.fechaInicio}T00:00:00`);
            if (!isNaN(start.getTime())) {
                conditions.push(gte(devolucion.fecha, start));
            }
        }
        if (filters.fechaFin) {
            const end = new Date(`${filters.fechaFin}T23:59:59.999`);
            if (!isNaN(end.getTime())) {
                conditions.push(lte(devolucion.fecha, end));
            }
        }

        if (filters.search?.trim()) {
            const s = filters.search.trim();
            conditions.push(
                or(
                    ilike(products.name, `%${s}%`),
                    ilike(products.codigo, `%${s}%`),
                    ilike(devolucion.motivo, `%${s}%`),
                    ilike(venta.cliente, `%${s}%`),
                    ilike(venta.numeroDocumento, `%${s}%`),
                    ilike(comprobante.numero, `%${s}%`)
                )!
            );
        }

        const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db
            .select({
                id: devolucion.id,
                fecha: devolucion.fecha,
                cantidad: devolucion.cantidad,
                motivo: devolucion.motivo,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                productoPrecioVenta: products.precioVenta,
                productoUnidad: unidades.abreviatura,
                sucursalNombre: sucursal.nombre,
                cliente: venta.cliente,
                numeroDocumento: venta.numeroDocumento,
                vendedorNombre: users.name,
                comprobanteNumero: comprobante.numero,
                tipoComprobanteNombre: tipoComprobante.nombre,
            })
            .from(devolucion)
            .innerJoin(products, eq(devolucion.productoId, products.id))
            .innerJoin(sucursal, eq(devolucion.sucursalId, sucursal.id))
            .innerJoin(venta, eq(devolucion.ventaId, venta.id))
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .leftJoin(users, eq(venta.vendedor, users.id))
            .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
            .leftJoin(tipoComprobante, eq(comprobante.tipoComprobanteId, tipoComprobante.id))
            .where(whereSql)
            .orderBy(desc(devolucion.fecha), desc(devolucion.createdAt))
            .limit(5000);

        if (rows.length === 0) {
            return { success: false, error: 'No se encontraron devoluciones con los filtros aplicados.' };
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
            'Producto',
            'Codigo',
            'Unidad',
            'Tienda / Sucursal',
            'Comprobante Venta',
            'Cliente',
            'Doc. Cliente',
            'Vendedor Venta',
            'Cantidad Devuelta',
            'Valor Unit. Ref (S/)',
            'Monto Estimado (S/)',
            'Motivo',
        ];

        const csvRows = rows.map((r) => {
            const fecha = new Date(r.fecha);
            const compRef = r.comprobanteNumero
                ? `${r.tipoComprobanteNombre ? `${r.tipoComprobanteNombre}: ` : ''}${r.comprobanteNumero}`
                : 'Ticket / S/N';
            const precioRef = Number(r.productoPrecioVenta) || 0;
            const montoEst = r.cantidad * precioRef;

            return [
                `"${dateFormatter.format(fecha)}"`,
                `"${timeFormatter.format(fecha)}"`,
                `"${(r.productoNombre || '').replace(/"/g, '""')}"`,
                `"${r.productoCodigo || ''}"`,
                `"${r.productoUnidad || 'UND'}"`,
                `"${(r.sucursalNombre || '').replace(/"/g, '""')}"`,
                `"${compRef}"`,
                `"${(r.cliente || 'Público General').replace(/"/g, '""')}"`,
                `"${r.numeroDocumento || '-'}"`,
                `"${(r.vendedorNombre || 'Cajero').replace(/"/g, '""')}"`,
                r.cantidad,
                precioRef.toFixed(2),
                montoEst.toFixed(2),
                `"${(r.motivo || '').replace(/"/g, '""')}"`,
            ];
        });

        const csvContent = [headersRow.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

        return {
            success: true,
            csvContent,
            count: rows.length,
        };
    } catch (error) {
        console.error('Error al exportar devoluciones CSV:', error);
        return { success: false, error: 'Error inesperado al generar el archivo CSV.' };
    }
}

