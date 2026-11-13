'use server';

import { headers } from 'next/headers';
import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { api } from '@/lib/auth';
import db from '@/server';
import { productoVenta } from '@/server/schema/producto-venta';
import { venta } from '@/server/schema/venta';
import { products } from '@/server/schema/products';
import { marcas } from '@/server/schema/marca';
import { sucursal } from '@/server/schema/sucursal';
import { users } from '@/server/schema/auth-schema';
import { unidades } from '@/server/schema/unidad';
import { comprobante } from '@/server/schema/comprobante';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { tipoPago } from '@/server/schema/tipo-pago';
import { ConsignacionFilters } from '@/interfaces/consignacion';

export async function exportarConsignacionCSVAction(filters: Partial<ConsignacionFilters>) {
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

        const conditions: SQL[] = [eq(products.enConsignacion, true)];

        // Filtro por Marca
        if (filters.marcaId && filters.marcaId !== 'all') {
            conditions.push(eq(products.marcaId, filters.marcaId));
        }

        // Filtro por Tienda / Sucursal
        if (session.user.role === 'saler') {
            conditions.push(eq(venta.sucursalId, sucursalId!));
        } else if (sucursalId && sucursalId !== 'all') {
            conditions.push(eq(venta.sucursalId, sucursalId));
        }

        // Filtro por Vendedor
        if (filters.vendedorId && filters.vendedorId !== 'all') {
            conditions.push(eq(venta.vendedor, filters.vendedorId));
        }

        // Filtro por Fechas
        if (filters.fechaInicio) {
            const start = new Date(`${filters.fechaInicio}T00:00:00`);
            if (!isNaN(start.getTime())) {
                conditions.push(gte(venta.createdAt, start));
            }
        }
        if (filters.fechaFin) {
            const end = new Date(`${filters.fechaFin}T23:59:59.999`);
            if (!isNaN(end.getTime())) {
                conditions.push(lte(venta.createdAt, end));
            }
        }

        // Búsqueda por texto
        if (filters.search?.trim()) {
            const s = filters.search.trim();
            conditions.push(
                or(
                    ilike(products.name, `%${s}%`),
                    ilike(products.codigo, `%${s}%`),
                    ilike(venta.cliente, `%${s}%`),
                    ilike(venta.numeroDocumento, `%${s}%`),
                    ilike(comprobante.numero, `%${s}%`)
                )!
            );
        }

        const whereSql = and(...conditions);

        const rows = await db
            .select({
                id: productoVenta.id,
                fecha: venta.createdAt,
                cantidad: productoVenta.cantidad,
                precioUnitario: productoVenta.precio,
                descuento: productoVenta.descuento,
                precioTotal: productoVenta.precioTotal,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                productoUnidad: unidades.abreviatura,
                marcaNombre: marcas.nombre,
                sucursalNombre: sucursal.nombre,
                vendedorNombre: users.name,
                cliente: venta.cliente,
                numeroDocumento: venta.numeroDocumento,
                pagado: venta.pagado,
                metodoPagoNombre: tipoPago.nombre,
                comprobanteNumero: comprobante.numero,
                tipoComprobanteNombre: tipoComprobante.nombre,
            })
            .from(productoVenta)
            .innerJoin(venta, eq(productoVenta.ventaId, venta.id))
            .innerJoin(products, eq(productoVenta.productId, products.id))
            .leftJoin(marcas, eq(products.marcaId, marcas.id))
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .leftJoin(sucursal, eq(venta.sucursalId, sucursal.id))
            .leftJoin(users, eq(venta.vendedor, users.id))
            .leftJoin(tipoPago, eq(venta.metodoPagoId, tipoPago.id))
            .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
            .leftJoin(tipoComprobante, eq(comprobante.tipoComprobanteId, tipoComprobante.id))
            .where(whereSql)
            .orderBy(desc(venta.createdAt), desc(productoVenta.createdAt))
            .limit(5000);

        if (rows.length === 0) {
            return { success: false, error: 'No se encontraron ventas de productos en consignación con los filtros aplicados.' };
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
            'Marca',
            'Tienda',
            'Vendedor',
            'Comprobante',
            'Cliente',
            'Doc. Cliente',
            'Estado Pago',
            'Metodo Pago',
            'Cantidad',
            'Precio Unitario (S/)',
            'Descuento (S/)',
            'Total (S/)',
        ];

        const csvRows = rows.map((r) => {
            const fecha = new Date(r.fecha);
            const compRef = r.comprobanteNumero
                ? `${r.tipoComprobanteNombre || 'COMP'}: ${r.comprobanteNumero}`
                : 'Ticket / Nota';

            return [
                `"${dateFormatter.format(fecha)}"`,
                `"${timeFormatter.format(fecha)}"`,
                `"${(r.productoNombre || '').replace(/"/g, '""')}"`,
                `"${r.productoCodigo || ''}"`,
                `"${r.productoUnidad || 'UND'}"`,
                `"${(r.marcaNombre || 'Sin Marca').replace(/"/g, '""')}"`,
                `"${(r.sucursalNombre || 'Sede').replace(/"/g, '""')}"`,
                `"${(r.vendedorNombre || 'Cajero').replace(/"/g, '""')}"`,
                `"${compRef}"`,
                `"${(r.cliente || 'Público General').replace(/"/g, '""')}"`,
                `"${r.numeroDocumento || '-'}"`,
                `"${r.pagado ? 'PAGADO' : 'PENDIENTE'}"`,
                `"${r.metodoPagoNombre || 'Efectivo'}"`,
                r.cantidad,
                r.precioUnitario.toFixed(2),
                (r.descuento || 0).toFixed(2),
                r.precioTotal.toFixed(2),
            ];
        });

        const csvContent = [headersRow.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

        return {
            success: true,
            csvContent,
            count: rows.length,
        };
    } catch (error) {
        console.error('Error al exportar ventas en consignación CSV:', error);
        return { success: false, error: 'Ocurrió un error inesperado al generar el archivo CSV.' };
    }
}
