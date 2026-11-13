import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { StoreIcon } from 'lucide-react';

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
import { imagenProducto } from '@/server/schema/imagen-producto';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TablaConsignacion from './_ui/TablaConsignacion';
import {
    ConsignacionMetrics,
    VentaConsignacionItemRow,
} from '@/interfaces/consignacion';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        fechaInicio?: string;
        fechaFin?: string;
        marcaId?: string;
        sucursalId?: string;
        vendedorId?: string;
        search?: string;
    }>;
}

export default async function ConsignacionPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect('/login');

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '15', 10) || 15));
    const offset = (currentPage - 1) * pageSize;

    const search = params.search?.trim() || '';
    const fechaInicio = params.fechaInicio?.trim() || '';
    const fechaFin = params.fechaFin?.trim() || '';
    const marcaId = params.marcaId?.trim() || 'all';
    let sucursalId = params.sucursalId?.trim() || 'all';
    const vendedorId = params.vendedorId?.trim() || 'all';

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
                            Tu usuario de vendedor no cuenta con una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para consultar las ventas en consignación.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // 2. Construir condiciones SQL: SOLO productos marcados con enConsignacion = true
    const conditions: SQL[] = [eq(products.enConsignacion, true)];

    // Filtro por Marca
    if (marcaId && marcaId !== 'all') {
        conditions.push(eq(products.marcaId, marcaId));
    }

    // Filtro por Tienda / Sucursal
    if (session.user.role === 'saler') {
        conditions.push(eq(venta.sucursalId, sucursalId));
    } else if (sucursalId && sucursalId !== 'all') {
        conditions.push(eq(venta.sucursalId, sucursalId));
    }

    // Filtro por Vendedor
    if (vendedorId && vendedorId !== 'all') {
        conditions.push(eq(venta.vendedor, vendedorId));
    }

    // Filtro por Rango de Fechas
    if (fechaInicio) {
        const start = new Date(`${fechaInicio}T00:00:00`);
        if (!isNaN(start.getTime())) {
            conditions.push(gte(venta.createdAt, start));
        }
    }
    if (fechaFin) {
        const end = new Date(`${fechaFin}T23:59:59.999`);
        if (!isNaN(end.getTime())) {
            conditions.push(lte(venta.createdAt, end));
        }
    }

    // Búsqueda libre por texto
    if (search) {
        conditions.push(
            or(
                ilike(products.name, `%${search}%`),
                ilike(products.codigo, `%${search}%`),
                ilike(venta.cliente, `%${search}%`),
                ilike(venta.numeroDocumento, `%${search}%`),
                ilike(comprobante.numero, `%${search}%`)
            )!
        );
    }

    const whereSql = and(...conditions);

    // 3. Consultas concurrentes optimizadas:
    //    a) Catálogo de Marcas
    //    b) Catálogo de Sucursales
    //    c) Vendedores del sistema
    //    d) Conteo y agregación numérica (SQL nativo)
    //    e) Registros paginados con joins relacionales
    const [marcasList, sucursalesList, vendedoresList, [aggregate], rawRows] = await Promise.all([
        db
            .select({ id: marcas.id, nombre: marcas.nombre })
            .from(marcas)
            .orderBy(asc(marcas.nombre)),
        db
            .select({ id: sucursal.id, nombre: sucursal.nombre, codigo: sucursal.codigo })
            .from(sucursal)
            .orderBy(asc(sucursal.nombre)),
        db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .orderBy(asc(users.name)),
        db
            .select({
                totalCount: count(),
                totalUnidades: sql<number>`coalesce(sum(${productoVenta.cantidad}), 0)::int`,
                montoTotal: sql<number>`coalesce(sum(${productoVenta.precioTotal}), 0)::float`,
            })
            .from(productoVenta)
            .innerJoin(venta, eq(productoVenta.ventaId, venta.id))
            .innerJoin(products, eq(productoVenta.productId, products.id))
            .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
            .where(whereSql),
        db
            .select({
                id: productoVenta.id,
                ventaId: venta.id,
                fecha: venta.createdAt,
                cantidad: productoVenta.cantidad,
                precioUnitario: productoVenta.precio,
                descuento: productoVenta.descuento,
                precioTotal: productoVenta.precioTotal,
                // Producto
                productoId: products.id,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                productoUnidad: unidades.abreviatura,
                // Marca
                marcaId: marcas.id,
                marcaNombre: marcas.nombre,
                // Tienda / Sucursal
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                sucursalCodigo: sucursal.codigo,
                // Vendedor
                vendedorId: users.id,
                vendedorNombre: users.name,
                vendedorEmail: users.email,
                // Cliente y comprobante
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
            .limit(pageSize)
            .offset(offset),
    ]);

    // 4. Mapear imágenes de productos de la página actual
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

    // 5. Formateadores de fecha y hora
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

    // 6. Mapear datos a filas estructuradas
    const items: VentaConsignacionItemRow[] = rawRows.map((row) => {
        const itemDate = new Date(row.fecha);
        const comprobanteRef = row.comprobanteNumero
            ? `${row.tipoComprobanteNombre ? `${row.tipoComprobanteNombre}: ` : ''}${row.comprobanteNumero}`
            : 'Ticket / S/N';

        return {
            id: row.id,
            ventaId: row.ventaId,
            fecha: itemDate.toISOString(),
            fechaFormateada: dateFormatter.format(itemDate),
            horaFormateada: timeFormatter.format(itemDate),
            cantidad: row.cantidad,
            precioUnitario: row.precioUnitario,
            descuento: row.descuento || 0,
            precioTotal: row.precioTotal,
            productoId: row.productoId,
            productoNombre: row.productoNombre,
            productoCodigo: row.productoCodigo,
            productoUnidad: row.productoUnidad || 'UND',
            productoImagenUrl: imageMap.get(row.productoId) || null,
            marcaId: row.marcaId,
            marcaNombre: row.marcaNombre || 'Sin Marca',
            sucursalId: row.sucursalId || '',
            sucursalNombre: row.sucursalNombre || 'Sede',
            sucursalCodigo: row.sucursalCodigo || '',
            vendedorId: row.vendedorId || '',
            vendedorNombre: row.vendedorNombre || 'Cajero',
            vendedorEmail: row.vendedorEmail || '',
            cliente: row.cliente,
            numeroDocumento: row.numeroDocumento,
            comprobanteRef,
            tipoComprobante: row.tipoComprobanteNombre,
            metodoPago: row.metodoPagoNombre || 'Efectivo',
            pagado: row.pagado ?? true,
        };
    });

    const totalCount = Number(aggregate?.totalCount) || 0;
    const totalUnidades = Number(aggregate?.totalUnidades) || 0;
    const montoTotalVendido = Number(aggregate?.montoTotal) || 0;
    const ticketPromedio = totalCount > 0 ? montoTotalVendido / totalCount : 0;

    const metrics: ConsignacionMetrics = {
        totalRegistros: totalCount,
        totalUnidades,
        montoTotalVendido,
        ticketPromedio,
    };

    return (
        <SidebarAux>
            <TablaConsignacion
                items={items}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                metrics={metrics}
                marcas={marcasList}
                sucursales={sucursalesList}
                vendedores={vendedoresList}
                isAdmin={session.user.role === 'admin'}
                filters={{
                    fechaInicio,
                    fechaFin,
                    marcaId,
                    sucursalId,
                    vendedorId,
                    search,
                }}
            />
        </SidebarAux>
    );
}
