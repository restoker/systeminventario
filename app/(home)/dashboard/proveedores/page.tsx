import React from 'react';
import db from '@/server';
import { proveedor } from '@/server/schema/proveedor';
import { products } from '@/server/schema/products';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TableProveedores from './_ui/TableProveedores';
import { count, eq, ilike, or, and, sql, desc } from 'drizzle-orm';
import type { ProveedorWithProductCount } from '@/interfaces';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        search?: string;
        estado?: string;
        page?: string;
        pageSize?: string;
    }>;
}

export default async function ProveedoresPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const search = params.search?.trim() || '';
    const estado = params.estado?.trim() || 'all'; // 'all' | 'activo' | 'inactivo'
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '10', 10) || 10));
    const offset = (currentPage - 1) * pageSize;

    // Métricas globales
    const [{ totalGlobal }] = await db
        .select({ totalGlobal: count() })
        .from(proveedor);

    const [{ totalActivos }] = await db
        .select({ totalActivos: count() })
        .from(proveedor)
        .where(eq(proveedor.activo, true));

    const [{ totalInactivos }] = await db
        .select({ totalInactivos: count() })
        .from(proveedor)
        .where(eq(proveedor.activo, false));

    // Filtros de búsqueda y estado
    const conditions = [];

    if (search) {
        conditions.push(
            or(
                ilike(proveedor.nombre, `%${search}%`),
                ilike(proveedor.razonSocial, `%${search}%`),
                ilike(proveedor.numeroDocumento, `%${search}%`),
                ilike(proveedor.telefono, `%${search}%`),
                ilike(proveedor.email, `%${search}%`),
                ilike(proveedor.direccion, `%${search}%`)
            )
        );
    }

    if (estado === 'activo') {
        conditions.push(eq(proveedor.activo, true));
    } else if (estado === 'inactivo') {
        conditions.push(eq(proveedor.activo, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total de proveedores coincidentes con los filtros actuales
    const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(proveedor)
        .where(whereClause);

    // Consulta paginada con conteo de productos asociados
    const rows = await db
        .select({
            id: proveedor.id,
            nombre: proveedor.nombre,
            razonSocial: proveedor.razonSocial,
            numeroDocumento: proveedor.numeroDocumento,
            telefono: proveedor.telefono,
            email: proveedor.email,
            direccion: proveedor.direccion,
            activo: proveedor.activo,
            createdAt: proveedor.createdAt,
            updatedAt: proveedor.updatedAt,
            totalProductos: count(products.id),
        })
        .from(proveedor)
        .leftJoin(products, eq(proveedor.id, products.proveedorId))
        .where(whereClause)
        .groupBy(
            proveedor.id,
            proveedor.nombre,
            proveedor.razonSocial,
            proveedor.numeroDocumento,
            proveedor.telefono,
            proveedor.email,
            proveedor.direccion,
            proveedor.activo,
            proveedor.createdAt,
            proveedor.updatedAt
        )
        .orderBy(desc(proveedor.createdAt))
        .limit(pageSize)
        .offset(offset);

    // Conteo de proveedores con al menos un producto en catálogo
    const conProductosRows = await db
        .select({ provId: products.proveedorId })
        .from(products)
        .where(sql`${products.proveedorId} IS NOT NULL`)
        .groupBy(products.proveedorId);

    const conProductosTotal = conProductosRows.length;

    const proveedores: ProveedorWithProductCount[] = rows.map((r) => ({
        ...r,
        totalProductos: Number(r.totalProductos) || 0,
    }));

    return (
        <SidebarAux>
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                <TableProveedores
                    proveedores={proveedores}
                    totalCount={Number(totalCount) || 0}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    searchQuery={search}
                    estadoFilter={estado}
                    stats={{
                        total: Number(totalGlobal) || 0,
                        activos: Number(totalActivos) || 0,
                        inactivos: Number(totalInactivos) || 0,
                        conProductos: conProductosTotal,
                    }}
                />
            </div>
        </SidebarAux>
    );
}