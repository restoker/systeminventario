import React from 'react'
import Link from 'next/link'
import { count, ilike, or } from 'drizzle-orm'
import { PlusIcon, PackageIcon, LayersIcon, BoxesIcon } from 'lucide-react'

import db from '@/server'
import { products } from '@/server/schema/products'
import SidebarAux from '@/app/(home)/_ui/Sidebar'
import { Button } from '@/components/ui/button'
import TablaProductos from './_ui/TablaProductos'

interface PageProps {
    searchParams: Promise<{
        page?: string
        pageSize?: string
        search?: string
    }>
}

export default async function ProductosPage({ searchParams }: PageProps) {
    const params = await searchParams
    const search = params.search?.trim() || ''
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '8', 10) || 8))
    const offset = (currentPage - 1) * pageSize

    // Search filter condition for standard SQL select count
    const whereSql = search
        ? or(
            ilike(products.name, `%${search}%`),
            ilike(products.codigo, `%${search}%`),
            ilike(products.description, `%${search}%`)
        )
        : undefined

    // Total matching products count
    const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(products)
        .where(whereSql)

    // Overall catalog count for the summary banner
    const [{ globalTotal }] = await db
        .select({ globalTotal: count() })
        .from(products)

    // Fetch paginated products with relationships using Drizzle relational query builder
    const productosData = await db.query.products.findMany({
        where: search
            ? {
                OR: [
                    { name: { ilike: `%${search}%` } },
                    { codigo: { ilike: `%${search}%` } },
                    { description: { ilike: `%${search}%` } }
                ]
            }
            : undefined,
        with: {
            categoria: true,
            marca: true,
            unidad: true,
            proveedor: true,
            stocks: true
        },
        orderBy: { createdAt: 'desc' },
        limit: pageSize,
        offset
    })

    return (
        <SidebarAux>
            <div className='flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'>
                {/* Header with Title and Action */}
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                            <span>Dashboard</span>
                            <span>/</span>
                            <span className='text-foreground font-medium'>Productos</span>
                        </div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            Catálogo de Productos
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Consulta, filtra y gestiona el inventario, existencias y precios de tus productos.
                        </p>
                    </div>

                    <div className='flex items-center gap-2.5 shrink-0'>
                        <Link href='/dashboard/productos/new'>
                            <Button className='gap-2 shadow-xs cursor-pointer'>
                                <PlusIcon className='size-4' />
                                <span>Nuevo Producto</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Overview Stats Bar */}
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4'>
                    <div className='rounded-lg border bg-card p-3.5 sm:p-4 shadow-xs flex items-center gap-3'>
                        <div className='rounded-md p-2 bg-primary/10 text-primary shrink-0'>
                            <PackageIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Total en Catálogo</span>
                            <span className='text-lg sm:text-xl font-bold text-foreground'>{globalTotal}</span>
                        </div>
                    </div>

                    <div className='rounded-lg border bg-card p-3.5 sm:p-4 shadow-xs flex items-center gap-3'>
                        <div className='rounded-md p-2 bg-secondary text-secondary-foreground shrink-0'>
                            <BoxesIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>
                                {search ? 'Coincidentes' : 'En esta vista'}
                            </span>
                            <span className='text-lg sm:text-xl font-bold text-foreground'>{totalCount}</span>
                        </div>
                    </div>

                    <div className='col-span-2 sm:col-span-1 rounded-lg border bg-card p-3.5 sm:p-4 shadow-xs flex items-center gap-3'>
                        <div className='rounded-md p-2 bg-muted text-muted-foreground shrink-0'>
                            <LayersIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Página actual</span>
                            <span className='text-lg sm:text-xl font-bold text-foreground'>
                                {currentPage}{' '}
                                <span className='text-xs font-normal text-muted-foreground'>
                                    de {Math.max(1, Math.ceil(totalCount / pageSize))}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <TablaProductos
                    data={productosData}
                    totalCount={Number(totalCount) || 0}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    searchQuery={search}
                />
            </div>
        </SidebarAux>
    )
}