import React from 'react';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { StoreIcon } from 'lucide-react';

import { api } from '@/lib/auth';
import db from '@/server';
import SidebarAux from '../../../_ui/Sidebar';
import SelectSucursal from '../../caja/_ui/SelectSucursal';
import TablaStockSucursal, { StockItemRow } from './_ui/TablaStockSucursal';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        sucursalId?: string;
        productoId?: string;
    }>;
}

export default async function StockPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect('/login');

    const params = await searchParams;
    let sucursalId = params?.sucursalId;
    const productoId = params?.productoId;

    // Si se pasa un productoId sin sucursalId, intentar localizar la sucursal del producto
    if (!sucursalId && productoId) {
        const stockRecord = await db.query.stockSucursal.findFirst({
            where: {
                productoId: productoId,
            },
            with: {
                sucursal: true,
            },
        });

        if (stockRecord?.sucursalId) {
            sucursalId = stockRecord.sucursalId;
        }
    }

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
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                        <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 mb-3">
                            <StoreIcon className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Sin Sucursal Asignada</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Tu usuario de vendedor no cuenta con una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para consultar el inventario y stock físico.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // 2. Si el usuario es administrador y no tiene sucursal definida aún, mostrar selector de sucursal
    if (session.user.role === 'admin' && !sucursalId) {
        const sucursales = await db.query.sucursal.findMany({
            orderBy: { nombre: 'asc' },
        });

        const targetUrl = productoId
            ? `/dashboard/inventario/stock?productoId=${productoId}`
            : '/dashboard/inventario/stock';

        return (
            <SidebarAux>
                <SelectSucursal
                    sucursales={sucursales}
                    targetUrl={targetUrl}
                    moduleName="Control de Stock"
                    title="Control de Stock - Selección de Sucursal"
                    subtitle="Selecciona la sucursal sobre la que deseas consultar existencias, realizar ajustes de inventario o traslados entre sedes."
                    actionLabel="Ver Stock de Sucursal"
                />
            </SidebarAux>
        );
    }

    // 3. Obtener la sucursal seleccionada y el catálogo de sedes
    const sucursales = await db.query.sucursal.findMany({
        orderBy: { nombre: 'asc' },
    });

    const selectedSucursal = sucursales.find((s) => s.id === sucursalId);

    if (!selectedSucursal) {
        return notFound();
    }

    // 4. Cargar categorías, registros de stock de la sede y catálogo de productos
    const [categorias, stocksSucursal, allProducts] = await Promise.all([
        db.query.categorias.findMany({
            orderBy: { nombre: 'asc' },
        }),
        db.query.stockSucursal.findMany({
            where: { sucursalId: selectedSucursal.id },
        }),
        db.query.products.findMany({
            with: {
                categoria: true,
                marca: true,
                unidad: true,
                imagenes: true,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    // 5. Consolidar el inventario de la sede con el catálogo general de productos
    const stockMap = new Map(stocksSucursal.map((s) => [s.productoId, s]));

    const stockItems: StockItemRow[] = allProducts.map((prod) => {
        const st = stockMap.get(prod.id);
        const cantidad = st?.cantidad ?? 0;
        const stockMinimo = st?.stockMinimo ?? 5;
        const isOutOfStock = cantidad <= 0;
        const isLowStock = cantidad > 0 && cantidad <= stockMinimo;

        const estadoStock: 'in_stock' | 'low_stock' | 'out_of_stock' = isOutOfStock
            ? 'out_of_stock'
            : isLowStock
            ? 'low_stock'
            : 'in_stock';

        const pCompra = prod.precioCompra !== null ? Number(prod.precioCompra) : null;
        const pVenta = Number(prod.precioVenta) || 0;
        const valorUnitario = pCompra !== null && pCompra > 0 ? pCompra : pVenta;
        const valorInventario = cantidad * valorUnitario;

        return {
            id: st?.id || `unstocked-${prod.id}`,
            productoId: prod.id,
            nombre: prod.name,
            codigo: prod.codigo,
            descripcion: prod.description,
            imagenUrl: prod.imagenes?.[0]?.url || null,
            categoria: prod.categoria?.nombre || 'General',
            marca: prod.marca?.nombre || 'Sin marca',
            unidad: prod.unidad?.abreviatura || prod.unidad?.nombre || 'UND',
            precioVenta: pVenta,
            precioCompra: pCompra,
            cantidad,
            stockMinimo,
            estadoStock,
            valorInventario,
        };
    });

    return (
        <SidebarAux>
            <TablaStockSucursal
                sucursal={selectedSucursal}
                sucursales={sucursales}
                items={stockItems}
                categorias={categorias}
                isAdmin={session.user.role === 'admin'}
                initialProductoId={productoId}
            />
        </SidebarAux>
    );
}
