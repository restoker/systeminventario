import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    lte,
    or,
    sql,
    type SQL,
} from 'drizzle-orm';
import { StoreIcon } from 'lucide-react';

import { api } from '@/lib/auth';
import db from '@/server';
import { compra } from '@/server/schema/compras';
import { productosCompras } from '@/server/schema/producto-compra';
import { products } from '@/server/schema/products';
import { unidades } from '@/server/schema/unidad';
import { proveedor } from '@/server/schema/proveedor';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { sucursal } from '@/server/schema/sucursal';
import { users } from '@/server/schema/auth-schema';
import { caja } from '@/server/schema/caja';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TablaTransaccionesProveedor from './_ui/TablaTransaccionesProveedor';
import {
    CajaAbiertaTransaccionOption,
    CompraProductoDetalle,
    CompraProveedorRow,
    TransaccionesMetrics,
} from '@/types/proveedor-transacciones-schema';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        fechaInicio?: string;
        fechaFin?: string;
        proveedorId?: string;
        sucursalId?: string;
        estado?: string;
        condicion?: string;
        search?: string;
    }>;
}

export default async function TransaccionesProveedoresPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });
    if (!session?.user) return redirect('/login');

    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '15', 10) || 15));
    const offset = (currentPage - 1) * pageSize;

    const search = params.search?.trim() || '';
    const fechaInicio = params.fechaInicio?.trim() || '';
    const fechaFin = params.fechaFin?.trim() || '';
    const proveedorId = params.proveedorId?.trim() || 'all';
    let sucursalId = params.sucursalId?.trim() || 'all';
    const rawEstado = params.estado?.trim() || 'all';
    const estado: 'all' | 'pendiente' | 'pagado' =
        rawEstado === 'pendiente' || rawEstado === 'pagado' ? rawEstado : 'all';
    const rawCondicion = params.condicion?.trim() || 'all';
    const condicion: 'all' | 'credito' | 'contado' =
        rawCondicion === 'credito' || rawCondicion === 'contado' ? rawCondicion : 'all';

    // 1. Si el usuario es vendedor (saler), limitar estrictamente a su sucursal
    if (session.user.role === 'saler') {
        const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
            where: { userId: session.user.id },
            with: { sucursal: true },
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
                            Tu usuario no tiene una sucursal asignada. Solicita a un administrador que te asigne a una tienda para consultar compras a proveedores.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // 2. Construir condiciones SQL compartidas (sin filtro de pestaña estado) y completas
    const baseConditions: SQL[] = [];

    if (session.user.role === 'saler') {
        baseConditions.push(eq(compra.sucursalId, sucursalId));
    } else if (sucursalId && sucursalId !== 'all') {
        baseConditions.push(eq(compra.sucursalId, sucursalId));
    }

    if (proveedorId && proveedorId !== 'all') {
        baseConditions.push(eq(compra.proveedorId, proveedorId));
    }

    if (condicion === 'credito') {
        baseConditions.push(eq(compra.isACredito, true));
    } else if (condicion === 'contado') {
        baseConditions.push(eq(compra.isACredito, false));
    }

    const effectiveDateSql = sql`coalesce(${compra.fechaComprobante}, ${compra.createdAt})`;

    if (fechaInicio) {
        const start = new Date(`${fechaInicio}T00:00:00`);
        if (!isNaN(start.getTime())) {
            baseConditions.push(gte(effectiveDateSql, start));
        }
    }

    if (fechaFin) {
        const end = new Date(`${fechaFin}T23:59:59.999`);
        if (!isNaN(end.getTime())) {
            baseConditions.push(lte(effectiveDateSql, end));
        }
    }

    if (search) {
        baseConditions.push(
            or(
                ilike(compra.numeroComprobante, `%${search}%`),
                ilike(proveedor.nombre, `%${search}%`),
                ilike(proveedor.razonSocial, `%${search}%`),
                ilike(proveedor.numeroDocumento, `%${search}%`),
                ilike(users.name, `%${search}%`)
            )!
        );
    }

    const fullConditions: SQL[] = [...baseConditions];
    if (estado === 'pendiente' || estado === 'pagado') {
        fullConditions.push(eq(compra.estado, estado));
    }

    const baseWhereSql = baseConditions.length > 0 ? and(...baseConditions) : undefined;
    const whereSql = fullConditions.length > 0 ? and(...fullConditions) : undefined;

    const vencidaExpr = sql`case when ${compra.estado} = 'pendiente' and ${compra.isACredito} = true and ${compra.numeroDiasCredito} is not null and (coalesce(${compra.fechaComprobante}, ${compra.createdAt}) + make_interval(days => ${compra.numeroDiasCredito})) < date_trunc('day', now()) then 1 else 0 end`;

    // 3. Consultas concurrentes: selectores, conteos por pestaña, métricas SQL, filas paginadas y cajas abiertas
    const [
        proveedoresList,
        sucursalesList,
        [tabStats],
        [aggregate],
        rawRows,
        cajasAbiertasRaw,
    ] = await Promise.all([
        db
            .select({
                id: proveedor.id,
                nombre: proveedor.nombre,
                razonSocial: proveedor.razonSocial,
                numeroDocumento: proveedor.numeroDocumento,
            })
            .from(proveedor)
            .orderBy(asc(proveedor.nombre)),
        db
            .select({
                id: sucursal.id,
                nombre: sucursal.nombre,
                codigo: sucursal.codigo,
            })
            .from(sucursal)
            .where(eq(sucursal.activo, true))
            .orderBy(asc(sucursal.nombre)),
        db
            .select({
                todas: count(),
                pendientes: sql<number>`coalesce(sum(case when ${compra.estado} = 'pendiente' then 1 else 0 end), 0)::int`,
                pagadas: sql<number>`coalesce(sum(case when ${compra.estado} = 'pagado' then 1 else 0 end), 0)::int`,
            })
            .from(compra)
            .innerJoin(proveedor, eq(compra.proveedorId, proveedor.id))
            .leftJoin(users, eq(compra.userId, users.id))
            .where(baseWhereSql),
        db
            .select({
                totalCount: count(),
                montoTotalComprado: sql<number>`coalesce(sum(${compra.monto}), 0)::float`,
                montoPendientePagar: sql<number>`coalesce(sum(case when ${compra.estado} = 'pendiente' then ${compra.monto} else 0 end), 0)::float`,
                montoTotalPagado: sql<number>`coalesce(sum(case when ${compra.estado} = 'pagado' then ${compra.monto} else 0 end), 0)::float`,
                cantidadPendientes: sql<number>`coalesce(sum(case when ${compra.estado} = 'pendiente' then 1 else 0 end), 0)::int`,
                cantidadPagadas: sql<number>`coalesce(sum(case when ${compra.estado} = 'pagado' then 1 else 0 end), 0)::int`,
                cantidadVencidas: sql<number>`coalesce(sum(${vencidaExpr}), 0)::int`,
                proveedoresConDeuda: sql<number>`count(distinct case when ${compra.estado} = 'pendiente' then ${compra.proveedorId} end)::int`,
            })
            .from(compra)
            .innerJoin(proveedor, eq(compra.proveedorId, proveedor.id))
            .leftJoin(users, eq(compra.userId, users.id))
            .where(whereSql),
        db
            .select({
                id: compra.id,
                numeroComprobante: compra.numeroComprobante,
                monto: compra.monto,
                estado: compra.estado,
                isACredito: compra.isACredito,
                numeroDiasCredito: compra.numeroDiasCredito,
                fechaComprobante: compra.fechaComprobante,
                createdAt: compra.createdAt,
                tipoComprobanteNombre: tipoComprobante.nombre,
                tipoComprobanteSerie: tipoComprobante.serie,
                proveedorId: proveedor.id,
                proveedorNombre: proveedor.nombre,
                proveedorRazonSocial: proveedor.razonSocial,
                proveedorDocumento: proveedor.numeroDocumento,
                proveedorTelefono: proveedor.telefono,
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                sucursalCodigo: sucursal.codigo,
                usuarioNombre: users.name,
            })
            .from(compra)
            .innerJoin(proveedor, eq(compra.proveedorId, proveedor.id))
            .innerJoin(tipoComprobante, eq(compra.tipoComprobanteId, tipoComprobante.id))
            .innerJoin(sucursal, eq(compra.sucursalId, sucursal.id))
            .leftJoin(users, eq(compra.userId, users.id))
            .where(whereSql)
            .orderBy(desc(effectiveDateSql), desc(compra.createdAt))
            .limit(pageSize)
            .offset(offset),
        db
            .select({
                id: caja.id,
                sucursalId: caja.sucursalId,
                fechaApertura: caja.fechaApertura,
                usuarioNombre: users.name,
            })
            .from(caja)
            .leftJoin(users, eq(caja.userId, users.id))
            .where(eq(caja.estado, 'abierto')),
    ]);

    // 4. Cargar detalle de productos SOLO para las compras visibles en esta página
    const currentCompraIds = rawRows.map((r) => r.id);
    const itemsByCompraMap = new Map<string, CompraProductoDetalle[]>();

    if (currentCompraIds.length > 0) {
        const lineItemsRaw = await db
            .select({
                id: productosCompras.id,
                compraId: productosCompras.compraId,
                productoId: productosCompras.productoId,
                cantidad: productosCompras.cantidad,
                precio: productosCompras.precio,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                unidadAbrev: unidades.abreviatura,
                unidadNombre: unidades.nombre,
            })
            .from(productosCompras)
            .innerJoin(products, eq(productosCompras.productoId, products.id))
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .where(inArray(productosCompras.compraId, currentCompraIds));

        lineItemsRaw.forEach((li) => {
            const list = itemsByCompraMap.get(li.compraId) || [];
            const cant = Number(li.cantidad) || 0;
            const precioUnit = Number(li.precio) || 0;
            list.push({
                id: li.id,
                productoId: li.productoId,
                productoNombre: li.productoNombre,
                productoCodigo: li.productoCodigo,
                unidad: li.unidadAbrev || li.unidadNombre || 'UND',
                cantidad: cant,
                precioUnitario: precioUnit,
                subtotal: Number((cant * precioUnit).toFixed(2)),
            });
            itemsByCompraMap.set(li.compraId, list);
        });
    }

    // 5. Formateadores y armado de filas
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

    const nowDate = new Date();
    const todayMidnight = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate()
    );

    const items: CompraProveedorRow[] = rawRows.map((row) => {
        const emissionDate = new Date(row.fechaComprobante || row.createdAt || new Date());
        const isCredit = Boolean(row.isACredito);
        const creditDays = row.numeroDiasCredito ?? null;

        let fechaVencimientoIso: string | null = null;
        let fechaVencimientoFormateada: string | null = null;
        let diasRestantes: number | null = null;

        if (isCredit && creditDays !== null) {
            const dueDate = new Date(emissionDate);
            dueDate.setDate(dueDate.getDate() + creditDays);
            fechaVencimientoIso = dueDate.toISOString();
            fechaVencimientoFormateada = dateFormatter.format(dueDate);

            const dueMidnight = new Date(
                dueDate.getFullYear(),
                dueDate.getMonth(),
                dueDate.getDate()
            );
            const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
            diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }

        const lineItems = itemsByCompraMap.get(row.id) || [];
        const totalUnidades = lineItems.reduce((acc, l) => acc + l.cantidad, 0);

        return {
            id: row.id,
            numeroComprobante: row.numeroComprobante,
            tipoComprobanteNombre: row.tipoComprobanteNombre,
            tipoComprobanteSerie: row.tipoComprobanteSerie,
            monto: Number(row.monto) || 0,
            estado: row.estado === 'pagado' ? 'pagado' : 'pendiente',
            isACredito: isCredit,
            numeroDiasCredito: creditDays,
            fechaEmisionIso: emissionDate.toISOString(),
            fechaEmisionFormateada: dateFormatter.format(emissionDate),
            horaEmisionFormateada: timeFormatter.format(emissionDate),
            fechaVencimientoIso,
            fechaVencimientoFormateada,
            diasRestantes,
            proveedorId: row.proveedorId,
            proveedorNombre: row.proveedorNombre,
            proveedorRazonSocial: row.proveedorRazonSocial,
            proveedorDocumento: row.proveedorDocumento,
            proveedorTelefono: row.proveedorTelefono,
            sucursalId: row.sucursalId,
            sucursalNombre: row.sucursalNombre,
            sucursalCodigo: row.sucursalCodigo,
            usuarioNombre: row.usuarioNombre || 'Sistema',
            itemsCount: lineItems.length,
            totalUnidades,
            items: lineItems,
        };
    });

    const cajasAbiertas: CajaAbiertaTransaccionOption[] = cajasAbiertasRaw.map((c) => {
        const aperturaDate = c.fechaApertura ? new Date(c.fechaApertura) : new Date();
        return {
            id: c.id,
            sucursalId: c.sucursalId,
            usuarioNombre: c.usuarioNombre || 'Cajero',
            fechaAperturaFormateada: `${dateFormatter.format(aperturaDate)} • ${timeFormatter.format(aperturaDate)}`,
        };
    });

    const totalCount = Number(aggregate?.totalCount) || 0;
    const metrics: TransaccionesMetrics = {
        totalTransacciones: totalCount,
        montoTotalComprado: Number(aggregate?.montoTotalComprado) || 0,
        montoPendientePagar: Number(aggregate?.montoPendientePagar) || 0,
        montoTotalPagado: Number(aggregate?.montoTotalPagado) || 0,
        cantidadPendientes: Number(aggregate?.cantidadPendientes) || 0,
        cantidadPagadas: Number(aggregate?.cantidadPagadas) || 0,
        cantidadVencidas: Number(aggregate?.cantidadVencidas) || 0,
        proveedoresConDeuda: Number(aggregate?.proveedoresConDeuda) || 0,
    };

    return (
        <SidebarAux>
            <TablaTransaccionesProveedor
                items={items}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                metrics={metrics}
                tabCounts={{
                    todas: Number(tabStats?.todas) || 0,
                    pendientes: Number(tabStats?.pendientes) || 0,
                    pagadas: Number(tabStats?.pagadas) || 0,
                }}
                proveedores={proveedoresList}
                sucursales={sucursalesList}
                cajasAbiertas={cajasAbiertas}
                isAdmin={session.user.role === 'admin'}
                filters={{
                    fechaInicio,
                    fechaFin,
                    proveedorId,
                    sucursalId,
                    estado,
                    condicion,
                    search,
                }}
            />
        </SidebarAux>
    );
}
