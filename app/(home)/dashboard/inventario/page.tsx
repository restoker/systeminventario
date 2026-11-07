import React from 'react';
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BoxesIcon } from "lucide-react";

import { api } from "@/lib/auth";
import db from "@/server";
import SidebarAux from "../../_ui/Sidebar";
import TablaInventario, { InventarioItem } from './_ui/TablaInventario';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        sucursalId?: string;
    }>;
}

export default async function InventarioPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });
    if (!session?.user) return redirect("/login");

    const params = await searchParams;
    const initialSucursalId = params?.sucursalId || 'all';

    const [productos, sucursales] = await Promise.all([
        db.query.products.findMany({
            with: {
                categoria: true,
                marca: true,
                unidad: true,
                proveedor: true,
                imagenes: true,
                stocks: {
                    with: {
                        sucursal: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        }),
        db.query.sucursal.findMany({
            orderBy: { nombre: 'asc' }
        })
    ]);

    // Flatten products and their stock per sucursal into inventory items
    const inventarioItems: InventarioItem[] = [];

    for (const prod of productos) {
        if (prod.stocks && prod.stocks.length > 0) {
            for (const st of prod.stocks) {
                const isOutOfStock = st.cantidad <= 0;
                const isLowStock = st.cantidad > 0 && st.cantidad <= st.stockMinimo;
                const status: 'in_stock' | 'low_stock' | 'out_of_stock' = isOutOfStock
                    ? 'out_of_stock'
                    : isLowStock
                        ? 'low_stock'
                        : 'in_stock';

                inventarioItems.push({
                    id: st.id,
                    productoId: prod.id,
                    nombre: prod.name,
                    codigo: prod.codigo,
                    descripcion: prod.description,
                    imagenUrl: prod.imagenes?.[0]?.url || null,
                    categoria: prod.categoria?.nombre || 'General',
                    marca: prod.marca?.nombre || 'Sin marca',
                    unidad: prod.unidad?.abreviatura || prod.unidad?.nombre || 'UND',
                    precioVenta: prod.precioVenta,
                    precioCompra: prod.precioCompra ?? null,
                    sucursalId: st.sucursalId,
                    sucursalNombre: st.sucursal?.nombre || 'Sucursal',
                    sucursalCodigo: st.sucursal?.codigo || '',
                    sucursalActiva: st.sucursal?.activo ?? true,
                    cantidad: st.cantidad,
                    stockMinimo: st.stockMinimo,
                    estadoStock: status,
                });
            }
        } else {
            // Producto sin stock asignado a ninguna sede
            inventarioItems.push({
                id: `unassigned-${prod.id}`,
                productoId: prod.id,
                nombre: prod.name,
                codigo: prod.codigo,
                descripcion: prod.description,
                imagenUrl: prod.imagenes?.[0]?.url || null,
                categoria: prod.categoria?.nombre || 'General',
                marca: prod.marca?.nombre || 'Sin marca',
                unidad: prod.unidad?.abreviatura || prod.unidad?.nombre || 'UND',
                precioVenta: prod.precioVenta,
                precioCompra: prod.precioCompra ?? null,
                sucursalId: 'unassigned',
                sucursalNombre: 'Sin sede asignada',
                sucursalCodigo: 'N/A',
                sucursalActiva: false,
                cantidad: 0,
                stockMinimo: 0,
                estadoStock: 'out_of_stock',
            });
        }
    }

    const sucursalOptions = sucursales.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        codigo: s.codigo,
        activo: s.activo,
    }));

    return (
        <SidebarAux>
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span>Dashboard</span>
                            <span>/</span>
                            <span className="text-foreground font-medium">Inventario</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="rounded-lg p-2 bg-primary/10 text-primary">
                                <BoxesIcon className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Control de Inventario y Stock
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Supervisión de mercadería, existencias físicas y niveles de reposición por sucursal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventario Datatable with Branch Filter */}
                <TablaInventario
                    items={inventarioItems}
                    sucursales={sucursalOptions}
                    initialSucursalId={initialSucursalId}
                />
            </div>
        </SidebarAux>
    );
}
