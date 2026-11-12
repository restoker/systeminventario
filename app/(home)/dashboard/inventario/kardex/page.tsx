import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, asc, count, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { StoreIcon } from 'lucide-react';

import { api } from '@/lib/auth';
import db from '@/server';
import { kardex } from '@/server/schema/kardex';
import { products } from '@/server/schema/products';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TablaKardex from './_ui/TablaKardex';
import { KardexItemRow, KardexMetrics, MOTIVOS_LABELS } from '@/types/kardex-schema';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        fechaInicio?: string;
        fechaFin?: string;
        sucursalId?: string;
        productoId?: string;
        tipo?: string;
        motivo?: string;
        search?: string;
    }>;
}

export default async function KardexPage({ searchParams }: PageProps) {
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
    const tipo = params.tipo?.trim() || 'all';
    const motivo = params.motivo?.trim() || 'all';

    // 1. Si el usuario es vendedor (saler), validar su sucursal asignada estrictamente
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
                            Tu usuario de vendedor no cuenta con una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para consultar el libro de movimientos (Kardex).
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // 2. Construir condiciones SQL según filtros activos
    const conditions: SQL[] = [];

    // Filtro por Sede
    if (session.user.role === 'saler') {
        conditions.push(eq(kardex.sucursalId, sucursalId));
    } else if (sucursalId && sucursalId !== 'all') {
        conditions.push(eq(kardex.sucursalId, sucursalId));
    }

    // Filtro por Producto
    if (productoId && productoId !== 'all') {
        conditions.push(eq(kardex.productoId, productoId));
    }

    // Filtro por Tipo de Flujo (ENTRADA / SALIDA)
    if (tipo && tipo !== 'all' && (tipo === 'ENTRADA' || tipo === 'SALIDA')) {
        conditions.push(eq(kardex.tipoMovimiento, tipo as any));
    }

    // Filtro por Motivo
    if (motivo && motivo !== 'all') {
        conditions.push(eq(kardex.motivo, motivo as any));
    }

    // Filtro por Rango de Fechas
    if (fechaInicio) {
        const start = new Date(`${fechaInicio}T00:00:00`);
        if (!isNaN(start.getTime())) {
            conditions.push(gte(kardex.fecha, start));
        }
    }
    if (fechaFin) {
        const end = new Date(`${fechaFin}T23:59:59.999`);
        if (!isNaN(end.getTime())) {
            conditions.push(lte(kardex.fecha, end));
        }
    }

    // Búsqueda por texto (comprobante, detalle, nombre de producto o código)
    if (search) {
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

    // 3. Consultas en paralelo optimizadas:
    //    a) Sedes activas
    //    b) Catálogo de productos para selector
    //    c) Conteo y agregaciones numéricas en SQL (sin cargar filas a memoria)
    //    d) Paginación exacta en el servidor (limit & offset)
    const [sucursales, allProducts, [aggregate], kardexRecords] = await Promise.all([
        db.query.sucursal.findMany({
            orderBy: (s, { asc }) => [asc(s.nombre)],
        }),
        db
            .select({
                id: products.id,
                nombre: products.name,
                codigo: products.codigo,
            })
            .from(products)
            .orderBy(asc(products.name)),
        db
            .select({
                totalCount: count(),
                totalEntradas: sql<number>`coalesce(sum(case when ${kardex.tipoMovimiento} = 'ENTRADA' then ${kardex.cantidad} else 0 end), 0)::int`,
                totalSalidas: sql<number>`coalesce(sum(case when ${kardex.tipoMovimiento} = 'SALIDA' then ${kardex.cantidad} else 0 end), 0)::int`,
                valorTotalEntradas: sql<number>`coalesce(sum(case when ${kardex.tipoMovimiento} = 'ENTRADA' then ${kardex.costoTotal} else 0 end), 0)::float`,
                valorTotalSalidas: sql<number>`coalesce(sum(case when ${kardex.tipoMovimiento} = 'SALIDA' then ${kardex.costoTotal} else 0 end), 0)::float`,
            })
            .from(kardex)
            .where(whereSql),
        db.query.kardex.findMany({
            where: whereSql ? { RAW: whereSql } : undefined,
            with: {
                producto: {
                    with: {
                        categoria: true,
                        marca: true,
                        unidad: true,
                        imagenes: true,
                    },
                },
                sucursal: true,
                usuario: true,
            },
            orderBy: (k, { desc }) => [desc(k.fecha), desc(k.secuencia)],
            limit: pageSize,
            offset,
        }),
    ]);

    const totalCount = Number(aggregate?.totalCount) || 0;
    const totalEntradas = Number(aggregate?.totalEntradas) || 0;
    const totalSalidas = Number(aggregate?.totalSalidas) || 0;
    const valorTotalEntradas = Number(aggregate?.valorTotalEntradas) || 0;
    const valorTotalSalidas = Number(aggregate?.valorTotalSalidas) || 0;
    const balanceNetoUnidades = totalEntradas - totalSalidas;

    const metrics: KardexMetrics = {
        totalMovimientos: totalCount,
        totalEntradas,
        totalSalidas,
        balanceNetoUnidades,
        valorTotalEntradas,
        valorTotalSalidas,
    };

    // 4. Formateadores de fecha y hora
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

    // 5. Mapear datos a la estructura del cliente (solo las filas de la página solicitada)
    const kardexItems: KardexItemRow[] = kardexRecords.map((item) => {
        const itemFecha = new Date(item.fecha);
        const costoUnit = Number(item.costoUnitario) || 0;
        const costoTotal = Number(item.costoTotal) || item.cantidad * costoUnit;
        const costoPromedio = Number(item.costoPromedio) || costoUnit;
        const saldoValorizado = Number(item.saldoValorizado) || item.stockActual * costoPromedio;

        return {
            id: item.id,
            secuencia: item.secuencia,
            fecha: item.fecha.toISOString(),
            fechaFormateada: dateFormatter.format(itemFecha),
            horaFormateada: timeFormatter.format(itemFecha),
            tipoMovimiento: item.tipoMovimiento,
            motivo: item.motivo,
            motivoLegible: MOTIVOS_LABELS[item.motivo] || item.motivo,
            detalleMotivo: item.detalleMotivo,
            origenTipo: item.origenTipo,
            comprobanteRef: item.comprobanteRef,
            cantidad: item.cantidad,
            stockAnterior: item.stockAnterior,
            stockActual: item.stockActual,
            costoUnitario: costoUnit,
            costoTotal: costoTotal,
            costoPromedio: costoPromedio,
            saldoValorizado: saldoValorizado,
            productoId: item.productoId,
            productoNombre: item.producto?.name || 'Producto Desconocido',
            productoCodigo: item.producto?.codigo || '',
            productoImagenUrl: item.producto?.imagenes?.[0]?.url || null,
            productoUnidad: item.producto?.unidad?.abreviatura || item.producto?.unidad?.nombre || 'UND',
            categoria: item.producto?.categoria?.nombre || 'General',
            sucursalId: item.sucursalId,
            sucursalNombre: item.sucursal?.nombre || 'Sede',
            sucursalCodigo: item.sucursal?.codigo || '',
            usuarioId: item.usuarioId,
            usuarioNombre: item.usuario?.name || 'Sistema',
        };
    });

    const sucursalOptions = sucursales.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        codigo: s.codigo,
    }));

    return (
        <SidebarAux>
            <TablaKardex
                items={kardexItems}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                metrics={metrics}
                sucursales={sucursalOptions}
                productos={allProducts}
                isAdmin={session.user.role === 'admin'}
                filters={{
                    fechaInicio,
                    fechaFin,
                    sucursalId,
                    productoId,
                    tipo,
                    motivo,
                    search,
                }}
            />
        </SidebarAux>
    );
}
