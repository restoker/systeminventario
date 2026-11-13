import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { StoreIcon } from 'lucide-react';

import { api } from '@/lib/auth';
import db from '@/server';
import { devolucion } from '@/server/schema/devolucion';
import { venta } from '@/server/schema/venta';
import { productoVenta } from '@/server/schema/producto-venta';
import { products } from '@/server/schema/products';
import { sucursal } from '@/server/schema/sucursal';
import { unidades } from '@/server/schema/unidad';
import { users } from '@/server/schema/auth-schema';
import { comprobante } from '@/server/schema/comprobante';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { imagenProducto } from '@/server/schema/imagen-producto';
import { caja } from '@/server/schema/caja';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TablaDevoluciones from './_ui/TablaDevoluciones';
import {
    CajaAbiertaOption,
    DevolucionItemRow,
    DevolucionMetrics,
    VentaItemDevolucionOption,
    VentaOptionForDevolucion,
} from '@/types/devolucion-schema';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        fechaInicio?: string;
        fechaFin?: string;
        sucursalId?: string;
        productoId?: string;
        search?: string;
    }>;
}

export default async function DevolucionesPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect('/login');

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '15', 10) || 15));
    const offset = (currentPage - 1) * pageSize;

    const search = params.search?.trim() || '';
    const fechaInicio = params.fechaInicio?.trim() || '';
    const fechaFin = params.fechaFin?.trim() || '';
    let sucursalId = params.sucursalId?.trim() || 'all';
    const productoId = params.productoId?.trim() || 'all';

    // 1. Si el usuario es vendedor (saler), validar sucursal asignada estrictamente
    if (session.user.role === 'saler') {
        const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
            where: { userId: session.user.id },
            with: {
                sucursal: true,
            },
        });

        if (!usuarioSucursal || !usuarioSucursal.sucursal) {
            return (
                <SidebarAux>
                    <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center min-h-[50vh]">
                        <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 mb-3">
                            <StoreIcon className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Sin Sucursal Asignada</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Tu usuario de vendedor no cuenta con una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para gestionar devoluciones.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // 2. Construir condiciones SQL de filtrado para la tabla de devoluciones
    const conditions: SQL[] = [];

    if (session.user.role === 'saler') {
        conditions.push(eq(devolucion.sucursalId, sucursalId));
    } else if (sucursalId && sucursalId !== 'all') {
        conditions.push(eq(devolucion.sucursalId, sucursalId));
    }

    if (productoId && productoId !== 'all') {
        conditions.push(eq(devolucion.productoId, productoId));
    }

    if (fechaInicio) {
        const start = new Date(`${fechaInicio}T00:00:00`);
        if (!isNaN(start.getTime())) {
            conditions.push(gte(devolucion.fecha, start));
        }
    }

    if (fechaFin) {
        const end = new Date(`${fechaFin}T23:59:59.999`);
        if (!isNaN(end.getTime())) {
            conditions.push(lte(devolucion.fecha, end));
        }
    }

    if (search) {
        conditions.push(
            or(
                ilike(products.name, `%${search}%`),
                ilike(products.codigo, `%${search}%`),
                ilike(devolucion.motivo, `%${search}%`),
                ilike(venta.cliente, `%${search}%`),
                ilike(venta.numeroDocumento, `%${search}%`),
                ilike(comprobante.numero, `%${search}%`)
            )!
        );
    }

    const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

    // 3. Consultas concurrentes:
    //    a) Sucursales activas
    //    b) Productos para filtros y respaldo de modal
    //    c) Agregaciones SQL para tarjetas métricas
    //    d) Filas paginadas de devoluciones
    //    e) Ventas recientes para el modal de nueva devolución
    //    f) Cajas abiertas por sucursal (requisito obligatorio para registrar devoluciones)
    const [sucursalesList, productosList, [aggregate], rawRows, recentVentasRaw, cajasAbiertasRaw] = await Promise.all([
        db
            .select({ id: sucursal.id, nombre: sucursal.nombre, codigo: sucursal.codigo })
            .from(sucursal)
            .where(eq(sucursal.activo, true))
            .orderBy(asc(sucursal.nombre)),
        db
            .select({
                id: products.id,
                nombre: products.name,
                codigo: products.codigo,
                unidad: unidades.abreviatura,
                precioVenta: products.precioVenta,
            })
            .from(products)
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .orderBy(asc(products.name)),
        db
            .select({
                totalCount: count(),
                totalUnidades: sql<number>`coalesce(sum(${devolucion.cantidad}), 0)::int`,
                montoEstimado: sql<number>`coalesce(sum(${devolucion.cantidad} * coalesce(${products.precioVenta}, 0)), 0)::float`,
                sucursalesDistintas: sql<number>`count(distinct ${devolucion.sucursalId})::int`,
            })
            .from(devolucion)
            .innerJoin(products, eq(devolucion.productoId, products.id))
            .innerJoin(venta, eq(devolucion.ventaId, venta.id))
            .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
            .where(whereSql),
        db
            .select({
                id: devolucion.id,
                fecha: devolucion.fecha,
                cantidad: devolucion.cantidad,
                motivo: devolucion.motivo,
                productoId: products.id,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                productoPrecioVenta: products.precioVenta,
                productoUnidad: unidades.abreviatura,
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                sucursalCodigo: sucursal.codigo,
                ventaId: venta.id,
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
            .limit(pageSize)
            .offset(offset),
        db
            .select({
                id: venta.id,
                sucursalId: venta.sucursalId,
                sucursalNombre: sucursal.nombre,
                createdAt: venta.createdAt,
                cliente: venta.cliente,
                numeroDocumento: venta.numeroDocumento,
                total: venta.total,
                comprobanteNumero: comprobante.numero,
                tipoComprobanteNombre: tipoComprobante.nombre,
            })
            .from(venta)
            .innerJoin(sucursal, eq(venta.sucursalId, sucursal.id))
            .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
            .leftJoin(tipoComprobante, eq(comprobante.tipoComprobanteId, tipoComprobante.id))
            .where(session.user.role === 'saler' ? eq(venta.sucursalId, sucursalId) : undefined)
            .orderBy(desc(venta.createdAt))
            .limit(100),
        db
            .select({
                id: caja.id,
                sucursalId: caja.sucursalId,
                montoApertura: caja.montoApertura,
                fechaApertura: caja.fechaApertura,
                usuarioNombre: users.name,
            })
            .from(caja)
            .leftJoin(users, eq(caja.userId, users.id))
            .where(eq(caja.estado, 'abierto')),
    ]);

    // 4. Obtener imágenes de los productos visibles en la página actual
    const currentProductIds = Array.from(new Set(rawRows.map((r) => r.productoId)));
    const imageMap = new Map<string, string>();

    if (currentProductIds.length > 0) {
        const images = await db
            .select({
                productoId: imagenProducto.productoId,
                url: imagenProducto.url,
            })
            .from(imagenProducto)
            .where(inArray(imagenProducto.productoId, currentProductIds));

        images.forEach((img) => {
            if (!imageMap.has(img.productoId)) {
                imageMap.set(img.productoId, img.url);
            }
        });
    }

    // 5. Enriquecer ventas recientes con sus ítems vendidos y devoluciones previas
    const recentVentaIds = recentVentasRaw.map((v) => v.id);
    const itemsByVentaMap = new Map<string, VentaItemDevolucionOption[]>();

    if (recentVentaIds.length > 0) {
        const [ventaItemsRaw, prevDevsRaw] = await Promise.all([
            db
                .select({
                    ventaId: productoVenta.ventaId,
                    productoId: productoVenta.productId,
                    cantidad: productoVenta.cantidad,
                    precio: productoVenta.precio,
                    precioTotal: productoVenta.precioTotal,
                    productoNombre: products.name,
                    productoCodigo: products.codigo,
                    unidad: unidades.abreviatura,
                })
                .from(productoVenta)
                .innerJoin(products, eq(productoVenta.productId, products.id))
                .leftJoin(unidades, eq(products.unidadId, unidades.id))
                .where(inArray(productoVenta.ventaId, recentVentaIds)),
            db
                .select({
                    ventaId: devolucion.ventaId,
                    productoId: devolucion.productoId,
                    cantidad: devolucion.cantidad,
                })
                .from(devolucion)
                .where(inArray(devolucion.ventaId, recentVentaIds)),
        ]);

        const returnedMap = new Map<string, number>();
        prevDevsRaw.forEach((d) => {
            const key = `${d.ventaId}::${d.productoId}`;
            returnedMap.set(key, (returnedMap.get(key) || 0) + d.cantidad);
        });

        // Agrupar ítems por ventaId y productoId
        const groupedItemsMap = new Map<string, Map<string, VentaItemDevolucionOption>>();
        const totalsByItemKey = new Map<string, { cantidad: number; totalPagado: number }>();
        ventaItemsRaw.forEach((vi) => {
            if (!groupedItemsMap.has(vi.ventaId)) {
                groupedItemsMap.set(vi.ventaId, new Map());
            }
            const prodMap = groupedItemsMap.get(vi.ventaId)!;
            const existing = prodMap.get(vi.productoId);
            const retKey = `${vi.ventaId}::${vi.productoId}`;
            const yaDevuelta = returnedMap.get(retKey) || 0;

            const prevTotals = totalsByItemKey.get(retKey) || { cantidad: 0, totalPagado: 0 };
            const updatedTotals = {
                cantidad: prevTotals.cantidad + vi.cantidad,
                totalPagado: prevTotals.totalPagado + Number(vi.precioTotal || 0),
            };
            totalsByItemKey.set(retKey, updatedTotals);

            const netUnitPrice =
                updatedTotals.cantidad > 0 && updatedTotals.totalPagado > 0
                    ? updatedTotals.totalPagado / updatedTotals.cantidad
                    : vi.precio;

            if (existing) {
                existing.cantidadVendida += vi.cantidad;
                existing.disponibleDevolver = Math.max(0, existing.cantidadVendida - yaDevuelta);
                existing.precioUnitario = netUnitPrice;
            } else {
                prodMap.set(vi.productoId, {
                    productoId: vi.productoId,
                    productoNombre: vi.productoNombre,
                    productoCodigo: vi.productoCodigo,
                    unidad: vi.unidad || 'UND',
                    cantidadVendida: vi.cantidad,
                    cantidadYaDevuelta: yaDevuelta,
                    disponibleDevolver: Math.max(0, vi.cantidad - yaDevuelta),
                    precioUnitario: netUnitPrice,
                });
            }
        });

        groupedItemsMap.forEach((prodMap, vId) => {
            itemsByVentaMap.set(vId, Array.from(prodMap.values()));
        });
    }

    // 6. Formateadores
    const dateFormatter = new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const items: DevolucionItemRow[] = rawRows.map((row) => {
        const itemDate = new Date(row.fecha);
        const compRef = row.comprobanteNumero
            ? `${row.tipoComprobanteNombre ? `${row.tipoComprobanteNombre}: ` : ''}${row.comprobanteNumero}`
            : `Venta #${row.ventaId.slice(0, 6).toUpperCase()}`;
        const precioRef = Number(row.productoPrecioVenta) || 0;

        return {
            id: row.id,
            fecha: itemDate.toISOString(),
            fechaFormateada: dateFormatter.format(itemDate),
            horaFormateada: timeFormatter.format(itemDate),
            cantidad: row.cantidad,
            motivo: row.motivo,
            productoId: row.productoId,
            productoNombre: row.productoNombre,
            productoCodigo: row.productoCodigo,
            productoUnidad: row.productoUnidad || 'UND',
            productoImagenUrl: imageMap.get(row.productoId) || null,
            sucursalId: row.sucursalId,
            sucursalNombre: row.sucursalNombre,
            sucursalCodigo: row.sucursalCodigo,
            ventaId: row.ventaId,
            cliente: row.cliente,
            numeroDocumento: row.numeroDocumento,
            comprobanteRef: compRef,
            vendedorNombre: row.vendedorNombre || 'Cajero',
            precioUnitarioReferencia: precioRef,
            montoEstimado: row.cantidad * precioRef,
        };
    });

    const ventasDisponibles: VentaOptionForDevolucion[] = recentVentasRaw.map((v) => {
        const vDate = new Date(v.createdAt);
        const compRef = v.comprobanteNumero
            ? `${v.tipoComprobanteNombre ? `${v.tipoComprobanteNombre}: ` : ''}${v.comprobanteNumero}`
            : `Ticket #${v.id.slice(0, 6).toUpperCase()}`;

        return {
            id: v.id,
            sucursalId: v.sucursalId,
            sucursalNombre: v.sucursalNombre,
            fechaFormateada: dateFormatter.format(vDate),
            cliente: v.cliente || 'Público General',
            numeroDocumento: v.numeroDocumento,
            comprobanteRef: compRef,
            total: Number(v.total) || 0,
            items: itemsByVentaMap.get(v.id) || [],
        };
    });

    const productosOptions = productosList.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        unidad: p.unidad || 'UND',
        precioVenta: Number(p.precioVenta) || 0,
    }));

    const cajasAbiertas: CajaAbiertaOption[] = cajasAbiertasRaw.map((c) => {
        const aperturaDate = c.fechaApertura ? new Date(c.fechaApertura) : new Date();
        return {
            id: c.id,
            sucursalId: c.sucursalId,
            montoApertura: Number(c.montoApertura) || 0,
            usuarioNombre: c.usuarioNombre || 'Cajero',
            fechaAperturaFormateada: `${dateFormatter.format(aperturaDate)} • ${timeFormatter.format(aperturaDate)}`,
        };
    });

    const totalCount = Number(aggregate?.totalCount) || 0;
    const metrics: DevolucionMetrics = {
        totalDevoluciones: totalCount,
        totalUnidadesDevueltas: Number(aggregate?.totalUnidades) || 0,
        montoEstimadoDevuelto: Number(aggregate?.montoEstimado) || 0,
        sucursalesAfectadas: Number(aggregate?.sucursalesDistintas) || 0,
    };

    return (
        <SidebarAux>
            <TablaDevoluciones
                items={items}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                metrics={metrics}
                sucursales={sucursalesList}
                productos={productosOptions}
                ventasDisponibles={ventasDisponibles}
                cajasAbiertas={cajasAbiertas}
                isAdmin={session.user.role === 'admin'}
                filters={{
                    fechaInicio,
                    fechaFin,
                    sucursalId,
                    productoId,
                    search,
                }}
            />
        </SidebarAux>
    );
}
