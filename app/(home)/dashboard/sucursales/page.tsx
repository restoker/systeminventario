import React from 'react';
import { Building2Icon, CheckCircle2Icon, PowerOffIcon } from 'lucide-react';

import db from '@/server';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import TableSucursales from './_ui/TableSucursales';

export const dynamic = 'force-dynamic';

export default async function SucursalesPage() {
    const sucursales = await db.query.sucursal.findMany({
        orderBy: { createdAt: 'desc' },
        with: {
            stocks: true
        }
    });

    const totalSucursales = sucursales.length;
    const totalActivas = sucursales.filter(s => s.activo ?? true).length;
    const totalInactivas = totalSucursales - totalActivas;

    return (
        <SidebarAux>
            <div className='flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'>
                {/* Page Header */}
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                            <span>Dashboard</span>
                            <span>/</span>
                            <span className='text-foreground font-medium'>Sucursales</span>
                        </div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            Sucursales y Almacenes
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1 max-w-2xl'>
                            Control centralizado de sedes físicas, puntos de venta y centros de distribución de inventario.
                        </p>
                    </div>
                </div>

                {/* Operational Stats Overview */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
                    {/* Total Sucursales */}
                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-primary/10 text-primary shrink-0'>
                            <Building2Icon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Total de Sedes</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalSucursales}</span>
                        </div>
                    </div>

                    {/* Sedes Activas */}
                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
                            <CheckCircle2Icon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Sedes Operativas</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalActivas}</span>
                        </div>
                    </div>

                    {/* Sedes Inactivas */}
                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-muted text-muted-foreground shrink-0'>
                            <PowerOffIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Sedes Inactivas</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalInactivas}</span>
                        </div>
                    </div>
                </div>

                {/* Sucursales Datatable */}
                <TableSucursales sucursales={sucursales} />
            </div>
        </SidebarAux>
    );
}