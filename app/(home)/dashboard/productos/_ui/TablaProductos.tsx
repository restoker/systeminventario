'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import {
    columnVisibilityFeature,
    flexRender,
    rowPaginationFeature,
    tableFeatures,
    useTable
} from '@tanstack/react-table'
import {
    SearchIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    CopyIcon,
    EditIcon,
    XIcon,
    PackageSearchIcon,
    BoxesIcon,
    LayersIcon,
    Building2Icon,
    TagIcon,
    ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from 'cn'
import { usePagination } from '@/hooks/use-pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Productos } from '@/interfaces'

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature
})

interface ProductImageProps {
    src?: string | null
    alt: string
    className?: string
    iconClassName?: string
}

function ProductImage({ src, alt, className, iconClassName }: ProductImageProps) {
    const [imageError, setImageError] = useState(false)

    // Reset error state when src changes
    React.useEffect(() => {
        setImageError(false)
    }, [src])

    const hasValidImage = Boolean(src && src.trim() !== '' && !imageError)

    if (hasValidImage) {
        return (
            <div
                className={cn(
                    'relative overflow-hidden rounded-lg border border-border/70 bg-muted/20 shrink-0 flex items-center justify-center',
                    className
                )}
            >
                <img
                    src={src!}
                    alt={alt}
                    className='size-full object-cover transition-transform duration-200'
                    onError={() => setImageError(true)}
                    loading='lazy'
                />
            </div>
        )
    }

    return (
        <div
            className={cn(
                'relative flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/40 text-muted-foreground/60 shrink-0 select-none shadow-2xs',
                className
            )}
            title={`Sin imagen: ${alt}`}
            aria-label='Sin imagen disponible'
        >
            <ImageIcon
                className={cn('size-4 text-muted-foreground/50 stroke-[1.5]', iconClassName)}
                aria-hidden='true'
            />
        </div>
    )
}

interface TablaProductosProps {
    data: Productos[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery: string
}

export default function TablaProductos({
    data,
    totalCount,
    currentPage,
    pageSize,
    searchQuery
}: TablaProductosProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Search input local state
    const [searchInput, setSearchInput] = useState(searchQuery)
    // Selected product for slide-over drawer details
    const [selectedProduct, setSelectedProduct] = useState<Productos | null>(null)

    const createQueryString = (params: Record<string, string | number | null>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '' || value === undefined) {
                current.delete(key)
            } else {
                current.set(key, String(value))
            }
        })
        return current.toString()
    }

    const handlePageChange = (newPage: number) => {
        startTransition(() => {
            router.push(`/dashboard/productos?${createQueryString({ page: newPage })}`)
        })
    }

    const handlePageSizeChange = (newSize: string | null) => {
        if (!newSize) return
        startTransition(() => {
            router.push(`/dashboard/productos?${createQueryString({ page: 1, pageSize: newSize })}`)
        })
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(() => {
            router.push(`/dashboard/productos?${createQueryString({ page: 1, search: searchInput.trim() })}`)
        })
    }

    const handleClearSearch = () => {
        setSearchInput('')
        startTransition(() => {
            router.push(`/dashboard/productos?${createQueryString({ page: 1, search: null })}`)
        })
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success(`Código copiado al portapapeles: ${code}`)
    }

    const columns: ColumnDef<typeof features, Productos>[] = [
        {
            accessorKey: 'image',
            header: 'Imagen',
            cell: ({ row }) => {
                const item = row.original

                return (
                    <button
                        type='button'
                        onClick={() => setSelectedProduct(item)}
                        className='focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 text-left shrink-0 block'
                        title={`Ver detalles de ${item.name}`}
                    >
                        <ProductImage
                            src={item.image}
                            alt={item.name}
                            className='size-10 shadow-2xs'
                            iconClassName='size-4.5'
                        />
                    </button>
                )
            }
        },
        {
            accessorKey: 'name',
            header: 'Producto',
            cell: ({ row }) => {
                const item = row.original

                return (
                    <div className='flex flex-col min-w-0 py-1'>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={() => setSelectedProduct(item)}
                                className='font-medium text-foreground text-sm truncate max-w-50 sm:max-w-65 text-left hover:underline cursor-pointer'
                                title={item.name}
                            >
                                {item.name}
                            </button>
                            <span className='font-mono text-[11px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border'>
                                {item.codigo}
                            </span>
                        </div>
                        {item.description && (
                            <span className='text-xs text-muted-foreground line-clamp-1 max-w-65 sm:max-w-[320px]' title={item.description}>
                                {item.description}
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: 'categoryId',
            header: 'Categoría',
            cell: ({ row }) => {
                const categoria = row.original.categoria?.nombre
                return categoria ? (
                    <Badge variant='secondary' className='font-normal rounded-sm text-xs'>
                        {categoria}
                    </Badge>
                ) : (
                    <span className='text-muted-foreground text-xs'>—</span>
                )
            }
        },
        {
            accessorKey: 'marcaId',
            header: 'Marca',
            cell: ({ row }) => {
                const marca = row.original.marca?.nombre
                return marca ? (
                    <span className='text-sm text-foreground/90 font-medium'>{marca}</span>
                ) : (
                    <span className='text-muted-foreground text-xs'>—</span>
                )
            }
        },
        {
            accessorKey: 'unidadId',
            header: 'Unidad',
            cell: ({ row }) => {
                const unidad = row.original.unidad
                return (
                    <span className='text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border'>
                        {unidad?.abreviatura || unidad?.nombre || 'UND'}
                    </span>
                )
            }
        },
        {
            accessorKey: 'precioVenta',
            header: 'Precio Venta',
            cell: ({ row }) => {
                const precio = Number(row.original.precioVenta) || 0
                const formatted = new Intl.NumberFormat('es-PE', {
                    style: 'currency',
                    currency: 'PEN'
                }).format(precio)

                return <span className='font-semibold text-foreground text-sm'>{formatted}</span>
            }
        },
        {
            accessorKey: 'precioCompra',
            header: 'Precio Compra',
            cell: ({ row }) => {
                const item = row.original
                if (item.enConsignacion) {
                    return (
                        <Badge variant='outline' className='text-[11px] font-normal border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5'>
                            Consignación
                        </Badge>
                    )
                }
                const precio = item.precioCompra ? Number(item.precioCompra) : 0
                const formatted = new Intl.NumberFormat('es-PE', {
                    style: 'currency',
                    currency: 'PEN'
                }).format(precio)

                return <span className='text-muted-foreground text-sm'>{formatted}</span>
            }
        },
        {
            id: 'stock',
            header: 'Stock',
            cell: ({ row }) => {
                const stocks = row.original.stocks || []
                const totalStock = stocks.reduce((acc, s) => acc + (s.cantidad || 0), 0)

                let badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                let label = `${totalStock}`

                if (totalStock === 0) {
                    badgeStyle = 'bg-destructive/10 text-destructive border-destructive/20'
                    label = 'Sin stock'
                } else if (totalStock <= 5) {
                    badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    label = `${totalStock} (Bajo)`
                }

                return (
                    <Badge variant='outline' className={`text-xs font-medium rounded-sm border ${badgeStyle}`}>
                        {label}
                    </Badge>
                )
            }
        },
        {
            id: 'actions',
            header: () => <span className='sr-only'>Acciones</span>,
            cell: ({ row }) => {
                const item = row.original
                return (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<Button size='icon' variant='ghost' className='size-8' aria-label='Opciones de producto' />}>
                                <EllipsisVerticalIcon className='size-4 text-muted-foreground' aria-hidden='true' />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
                                    Opciones
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedProduct(item)} className='cursor-pointer'>
                                    <EyeIcon className='mr-2 size-4 text-muted-foreground' />
                                    <span>Ver detalles</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyCode(item.codigo)} className='cursor-pointer'>
                                    <CopyIcon className='mr-2 size-4 text-muted-foreground' />
                                    <span>Copiar código</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        onClick={() => router.push(`/dashboard/productos/new?id=${item.id}`)}
                                        className='cursor-pointer'
                                    >
                                        <EditIcon className='mr-2 size-4 text-muted-foreground' />
                                        <span>Editar producto</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            enableHiding: false
        }
    ]

    const table = useTable(
        {
            features,
            data,
            columns,
            manualPagination: true,
            rowCount: totalCount,
            state: {
                pagination: {
                    pageIndex: currentPage - 1,
                    pageSize
                }
            }
        },
        state => ({ pagination: state.pagination })
    )

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage,
        totalPages,
        paginationItemsToDisplay: 3
    })

    return (
        <div className='w-full space-y-4'>
            {/* Control bar: Search and Filter tools */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
                <form onSubmit={handleSearchSubmit} className='relative flex-1 max-w-md'>
                    <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                    <Input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder='Buscar por nombre, código o descripción...'
                        className='pl-9 pr-9 h-9 text-sm'
                    />
                    {searchInput && (
                        <button
                            type='button'
                            onClick={handleClearSearch}
                            className='absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors'
                            title='Limpiar búsqueda'
                        >
                            <XIcon className='size-3.5' />
                        </button>
                    )}
                </form>

                <div className='flex items-center gap-2 self-end sm:self-auto'>
                    <span className='text-xs text-muted-foreground whitespace-nowrap'>Filas por página:</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={handlePageSizeChange}
                        items={[
                            { label: '10', value: '10' },
                            { label: '15', value: '15' },
                            { label: '25', value: '25' },
                            { label: '50', value: '50' }
                        ]}
                    >
                        <SelectTrigger className='w-18 h-9 text-xs'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align='end'>
                            <SelectItem value='10'>10</SelectItem>
                            <SelectItem value='15'>15</SelectItem>
                            <SelectItem value='25'>25</SelectItem>
                            <SelectItem value='50'>50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Table Card */}
            <div className='rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden'>
                <div className='relative overflow-x-auto'>
                    <Table>
                        <TableHeader className='bg-muted/40'>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                                    {headerGroup.headers.map(header => (
                                        <TableHead
                                            key={header.id}
                                            className='text-muted-foreground font-medium text-xs h-11 first:pl-4 last:pr-4'
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow
                                        key={row.id}
                                        className='transition-colors hover:bg-muted/40 data-state-selected:bg-muted'
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className='py-3 first:pl-4 last:pr-4'>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className='h-48 text-center'>
                                        <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                                            <PackageSearchIcon className='size-10 stroke-1' />
                                            <p className='text-sm font-medium text-foreground'>
                                                {searchQuery ? 'No se encontraron productos coincidentes' : 'No hay productos registrados'}
                                            </p>
                                            <p className='text-xs max-w-sm'>
                                                {searchQuery
                                                    ? `No hay resultados para "${searchQuery}". Intenta con otros términos o limpia el filtro.`
                                                    : 'Comienza creando tu primer producto para gestionar tu inventario.'}
                                            </p>
                                            {searchQuery ? (
                                                <Button variant='outline' size='sm' onClick={handleClearSearch} className='mt-2'>
                                                    Limpiar búsqueda
                                                </Button>
                                            ) : (
                                                <Link href='/dashboard/productos/new' className='mt-2'>
                                                    <Button size='sm'>Nuevo Producto</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className='flex items-center justify-between gap-3 border-t px-4 sm:px-6 py-3 max-sm:flex-col'>
                    <p className='text-muted-foreground text-xs whitespace-nowrap' aria-live='polite'>
                        {totalCount === 0 ? (
                            '0 productos'
                        ) : (
                            <>
                                Mostrando{' '}
                                <span className='font-medium text-foreground'>
                                    {(currentPage - 1) * pageSize + 1}
                                </span>{' '}
                                a{' '}
                                <span className='font-medium text-foreground'>
                                    {Math.min(currentPage * pageSize, totalCount)}
                                </span>{' '}
                                de <span className='font-medium text-foreground'>{totalCount}</span> productos
                            </>
                        )}
                        {isPending && <span className='ml-2 text-xs text-primary animate-pulse'>Cargando...</span>}
                    </p>

                    {totalPages > 1 && (
                        <div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='h-8 px-2 text-xs disabled:pointer-events-none disabled:opacity-40'
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage <= 1 || isPending}
                                            aria-label='Página anterior'
                                        >
                                            <ChevronLeftIcon className='size-4 mr-1' aria-hidden='true' />
                                            Anterior
                                        </Button>
                                    </PaginationItem>

                                    {showLeftEllipsis && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}

                                    {pages.map(page => {
                                        const isActive = page === currentPage

                                        return (
                                            <PaginationItem key={page}>
                                                <Button
                                                    size='icon'
                                                    variant={isActive ? 'default' : 'ghost'}
                                                    className={`size-8 text-xs font-medium ${!isActive && 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    onClick={() => handlePageChange(page)}
                                                    disabled={isPending}
                                                    aria-current={isActive ? 'page' : undefined}
                                                >
                                                    {page}
                                                </Button>
                                            </PaginationItem>
                                        )
                                    })}

                                    {showRightEllipsis && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}

                                    <PaginationItem>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='h-8 px-2 text-xs disabled:pointer-events-none disabled:opacity-40'
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages || isPending}
                                            aria-label='Página siguiente'
                                        >
                                            Siguiente
                                            <ChevronRightIcon className='size-4 ml-1' aria-hidden='true' />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-over Sheet for Product Details */}
            <Sheet open={!!selectedProduct} onOpenChange={open => !open && setSelectedProduct(null)}>
                <SheetContent className='w-full sm:max-w-md p-6 overflow-y-auto'>
                    {selectedProduct && (
                        <div className='flex flex-col gap-6'>
                            <SheetHeader>
                                <div className='flex items-center gap-3'>
                                    <ProductImage
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className='size-14'
                                        iconClassName='size-6'
                                    />
                                    <div className='flex flex-col min-w-0'>
                                        <SheetTitle className='text-base font-semibold text-foreground truncate'>
                                            {selectedProduct.name}
                                        </SheetTitle>
                                        <SheetDescription className='font-mono text-xs text-muted-foreground'>
                                            SKU / Código: {selectedProduct.codigo}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* Imagen en detalle si el producto cuenta con una */}
                            {selectedProduct.image && (
                                <div className='relative w-full aspect-video rounded-lg border border-border/70 bg-muted/10 overflow-hidden flex items-center justify-center group'>
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className='size-full object-contain p-2'
                                    />
                                    <a
                                        href={selectedProduct.image}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-xs border text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-xs'
                                        title='Ver imagen completa'
                                    >
                                        <EyeIcon className='size-3.5' />
                                    </a>
                                </div>
                            )}

                            {/* Basic Description */}
                            {selectedProduct.description && (
                                <div className='rounded-md bg-muted/40 p-3 text-xs text-muted-foreground'>
                                    {selectedProduct.description}
                                </div>
                            )}

                            {/* Price Details */}
                            <div className='rounded-lg border p-4 space-y-3'>
                                <h4 className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                                    <TagIcon className='size-3.5 text-primary' /> Información de Precios
                                </h4>
                                <div className='grid grid-cols-2 gap-3 pt-1'>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Precio Venta</span>
                                        <span className='text-base font-bold text-foreground'>
                                            S/ {(Number(selectedProduct.precioVenta) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Precio Compra</span>
                                        <span className='text-sm font-medium text-foreground'>
                                            {selectedProduct.enConsignacion
                                                ? 'En consignación'
                                                : `S/ ${(Number(selectedProduct.precioCompra) || 0).toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>IGV Aplicado</span>
                                        <span className='text-xs font-medium text-foreground'>
                                            {((Number(selectedProduct.igv) || 0.18) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Modalidad</span>
                                        <Badge variant='outline' className='text-[11px] font-normal mt-0.5'>
                                            {selectedProduct.enConsignacion ? 'Consignación' : 'Venta Directa'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Classification details */}
                            <div className='rounded-lg border p-4 space-y-3 text-xs'>
                                <h4 className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                                    <LayersIcon className='size-3.5 text-primary' /> Clasificación
                                </h4>
                                <div className='grid grid-cols-2 gap-y-2.5 pt-1'>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Categoría</span>
                                        <span className='font-medium text-foreground'>
                                            {selectedProduct.categoria?.nombre || '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Marca</span>
                                        <span className='font-medium text-foreground'>
                                            {selectedProduct.marca?.nombre || '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Unidad</span>
                                        <span className='font-medium text-foreground'>
                                            {selectedProduct.unidad?.nombre} ({selectedProduct.unidad?.abreviatura || 'UND'})
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[11px] text-muted-foreground block'>Proveedor</span>
                                        <span className='font-medium text-foreground truncate block'>
                                            {selectedProduct.proveedor?.nombre || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stock breakdown */}
                            <div className='rounded-lg border p-4 space-y-3'>
                                <h4 className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                                    <BoxesIcon className='size-3.5 text-primary' /> Stock por Sucursales
                                </h4>
                                {selectedProduct.stocks && selectedProduct.stocks.length > 0 ? (
                                    <div className='space-y-2 pt-1'>
                                        {selectedProduct.stocks.map((s, idx) => (
                                            <div key={idx} className='flex items-center justify-between text-xs py-1 border-b last:border-0'>
                                                <span className='text-muted-foreground flex items-center gap-1.5'>
                                                    <Building2Icon className='size-3 text-muted-foreground' /> Sucursal {idx + 1}
                                                </span>
                                                <div className='flex items-center gap-2'>
                                                    <span className='font-semibold text-foreground'>{s.cantidad} unidades</span>
                                                    {s.cantidad <= s.stockMinimo && (
                                                        <Badge variant='outline' className='text-[10px] text-amber-600 border-amber-300'>
                                                            Mínimo: {s.stockMinimo}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className='text-xs text-muted-foreground pt-1'>
                                        No hay registros de inventario por sucursal para este producto.
                                    </p>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className='flex items-center gap-2 pt-2'>
                                <Link href={`/dashboard/productos/new?id=${selectedProduct.id}`} className='flex-1'>
                                    <Button className='w-full gap-2'>
                                        <EditIcon className='size-4' />
                                        Editar Producto
                                    </Button>
                                </Link>
                                <Button
                                    variant='outline'
                                    onClick={() => handleCopyCode(selectedProduct.codigo)}
                                    className='gap-2'
                                >
                                    <CopyIcon className='size-4' />
                                    Copiar Código
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}