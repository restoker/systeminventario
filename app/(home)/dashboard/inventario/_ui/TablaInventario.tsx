'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
    columnVisibilityFeature,
    createPaginatedRowModel,
    flexRender,
    rowPaginationFeature,
    tableFeatures,
    useTable
} from '@tanstack/react-table';
import {
    SearchIcon,
    PackageIcon,
    Building2Icon,
    CheckCircle2Icon,
    AlertTriangleIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    CheckIcon,
    StoreIcon,
    BoxesIcon,
    SlidersHorizontalIcon,
    ArrowUpDownIcon,
    ExternalLinkIcon,
    RotateCcwIcon,
    EyeIcon,
    PackagePlusIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { usePagination } from '@/hooks/use-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem
} from '@/components/ui/pagination';

export interface InventarioItem {
    id: string;
    productoId: string;
    nombre: string;
    codigo: string;
    descripcion?: string | null;
    imagenUrl: string | null;
    categoria: string;
    marca: string;
    unidad: string;
    precioVenta: number;
    precioCompra: number | null;
    sucursalId: string;
    sucursalNombre: string;
    sucursalCodigo: string;
    sucursalActiva: boolean;
    cantidad: number;
    stockMinimo: number;
    estadoStock: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface SucursalOption {
    id: string;
    nombre: string;
    codigo: string;
    activo: boolean | null;
}

interface TablaInventarioProps {
    items: InventarioItem[];
    sucursales: SucursalOption[];
    initialSucursalId?: string;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
    paginatedRowModel: createPaginatedRowModel()
});

export default function TablaInventario({
    items,
    sucursales,
    initialSucursalId = 'all'
}: TablaInventarioProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSucursal, setSelectedSucursal] = useState<string>(initialSucursalId);
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Código ${text} copiado`);
        setTimeout(() => setCopiedId(null), 1800);
    };

    // Filter items by branch, search query, and stock status
    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return items.filter((item) => {
            // Branch filter
            if (selectedSucursal !== 'all' && item.sucursalId !== selectedSucursal) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all' && item.estadoStock !== statusFilter) {
                return false;
            }

            // Search query
            if (!query) return true;

            const nameMatch = item.nombre.toLowerCase().includes(query);
            const codeMatch = item.codigo.toLowerCase().includes(query);
            const catMatch = item.categoria.toLowerCase().includes(query);
            const marcaMatch = item.marca.toLowerCase().includes(query);
            const branchMatch = item.sucursalNombre.toLowerCase().includes(query);

            return nameMatch || codeMatch || catMatch || marcaMatch || branchMatch;
        });
    }, [items, selectedSucursal, statusFilter, searchQuery]);

    // Summary statistics calculated on filtered data (or whole branch)
    const stats = useMemo(() => {
        const dataForStats = selectedSucursal === 'all'
            ? items
            : items.filter(i => i.sucursalId === selectedSucursal);

        const totalItems = dataForStats.length;
        const totalUnits = dataForStats.reduce((acc, i) => acc + i.cantidad, 0);
        const lowStockCount = dataForStats.filter(i => i.estadoStock === 'low_stock').length;
        const outOfStockCount = dataForStats.filter(i => i.estadoStock === 'out_of_stock').length;

        return { totalItems, totalUnits, lowStockCount, outOfStockCount };
    }, [items, selectedSucursal]);

    // Table Column Definitions
    const columns: ColumnDef<typeof features, InventarioItem>[] = useMemo(
        () => [
            {
                accessorKey: 'nombre',
                header: 'Producto',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-3 py-1">
                            {/* Product Thumbnail with Placeholder */}
                            <div className="relative size-10 rounded-lg overflow-hidden border border-border/80 bg-muted/40 shrink-0 flex items-center justify-center">
                                {item.imagenUrl ? (
                                    <Image
                                        src={item.imagenUrl}
                                        alt={item.nombre}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <PackageIcon className="size-5 text-muted-foreground/60 stroke-[1.5]" />
                                )}
                            </div>

                            <div className="flex flex-col min-w-0 max-w-64 sm:max-w-80">
                                <span
                                    className="text-sm font-semibold text-foreground truncate"
                                    title={item.nombre}
                                >
                                    {item.nombre}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="font-mono text-[11px]">{item.codigo}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.codigo, item.id)}
                                        className="text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors"
                                        title="Copiar código"
                                        aria-label="Copiar código"
                                    >
                                        {copiedId === item.id ? (
                                            <CheckIcon className="size-3 text-emerald-600" />
                                        ) : (
                                            <CopyIcon className="size-3" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'sucursalNombre',
                header: 'Sucursal',
                cell: ({ row }) => {
                    const item = row.original;
                    const isUnassigned = item.sucursalId === 'unassigned';

                    return (
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`text-xs gap-1.5 font-normal py-0.5 px-2 ${
                                    isUnassigned
                                        ? 'border-dashed text-muted-foreground'
                                        : 'bg-muted/30 text-foreground border-border'
                                }`}
                            >
                                <StoreIcon className="size-3 text-primary shrink-0" />
                                <span className="font-medium truncate max-w-36">{item.sucursalNombre}</span>
                                {item.sucursalCodigo && (
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        ({item.sucursalCodigo})
                                    </span>
                                )}
                            </Badge>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'categoria',
                header: 'Categoría y Marca',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col text-xs leading-snug">
                            <span className="font-medium text-foreground">{item.categoria}</span>
                            <span className="text-muted-foreground text-[11px]">{item.marca}</span>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'cantidad',
                header: () => <span className="text-right block w-full">Stock Físico</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    const isOut = item.cantidad <= 0;
                    const isLow = item.cantidad > 0 && item.cantidad <= item.stockMinimo;

                    return (
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span
                                    className={`text-sm font-bold font-mono ${
                                        isOut
                                            ? 'text-destructive'
                                            : isLow
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-foreground'
                                    }`}
                                >
                                    {item.cantidad}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {item.unidad}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                                Mín: {item.stockMinimo} {item.unidad}
                            </span>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'precioVenta',
                header: () => <span className="text-right block w-full">Precio Venta</span>,
                cell: ({ row }) => {
                    const price = Number(row.original.precioVenta) || 0;
                    return (
                        <div className="text-right font-mono text-sm font-semibold text-foreground">
                            S/ {price.toFixed(2)}
                        </div>
                    );
                }
            },
            {
                accessorKey: 'estadoStock',
                header: 'Estado',
                cell: ({ row }) => {
                    const status = row.original.estadoStock;
                    if (status === 'out_of_stock') {
                        return (
                            <Badge
                                variant="outline"
                                className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-medium gap-1"
                            >
                                <XCircleIcon className="size-3" />
                                Agotado
                            </Badge>
                        );
                    }
                    if (status === 'low_stock') {
                        return (
                            <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-medium gap-1"
                            >
                                <AlertTriangleIcon className="size-3 text-amber-500" />
                                Stock Bajo
                            </Badge>
                        );
                    }
                    return (
                        <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium gap-1"
                        >
                            <CheckCircle2Icon className="size-3 text-emerald-500" />
                            En Stock
                        </Badge>
                    );
                }
            },
            {
                id: 'acciones',
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    const isUnassigned = item.sucursalId === 'unassigned';

                    return (
                        <div className="flex items-center justify-end">
                            <Link
                                href={
                                    isUnassigned
                                        ? `/dashboard/inventario/reabastecer?productoId=${item.productoId}`
                                        : `/dashboard/inventario/reabastecer?sucursalId=${item.sucursalId}&productoId=${item.productoId}`
                                }
                                title={`Reabastecer ${item.nombre} en ${item.sucursalNombre}`}
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-8 px-2.5 text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-2xs"
                                })}
                            >
                                <PackagePlusIcon className="size-3.5" />
                                <span>Reabastecer</span>
                            </Link>
                        </div>
                    );
                },
                enableHiding: false
            }
        ],
        [copiedId]
    );

    // Initialize TanStack Table with pagination feature
    const table = useTable(
        {
            features,
            data: filteredData,
            columns,
            initialState: {
                pagination: { pageIndex: 0, pageSize: 10 }
            }
        },
        (state) => ({ pagination: state.pagination })
    );

    const { pageIndex, pageSize } = table.state.pagination;

    // Custom Pagination Hook matching datatable-transaction
    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage: pageIndex + 1,
        totalPages: table.getPageCount(),
        paginationItemsToDisplay: 2
    });

    const isFiltered = searchQuery !== '' || selectedSucursal !== 'all' || statusFilter !== 'all';

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedSucursal('all');
        setStatusFilter('all');
    };

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Operational Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                        <BoxesIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">
                            {selectedSucursal === 'all' ? 'Total Artículos' : 'Artículos en Sede'}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                            {stats.totalItems}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">
                            Unidades Físicas
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                            {stats.totalUnits}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangleIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">
                            Stock Bajo (Alerta)
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                            {stats.lowStockCount}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-destructive/10 text-destructive shrink-0">
                        <XCircleIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">
                            Artículos Agotados
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                            {stats.outOfStockCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter and Control Toolbar */}
            <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Buscar por producto, código o categoría..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filtro por Sucursal requerido */}
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="select-sucursal-filter" className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <StoreIcon className="size-3.5 text-primary" />
                            Sucursal:
                        </label>
                        <select
                            id="select-sucursal-filter"
                            className="h-10 px-3 rounded-md border bg-background text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer max-w-56"
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                        >
                            <option value="all">Todas las sucursales ({sucursales.length})</option>
                            {sucursales.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} ({s.codigo})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Estado */}
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="select-status-filter" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            Estado:
                        </label>
                        <select
                            id="select-status-filter"
                            className="h-10 px-3 rounded-md border bg-background text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">Todos</option>
                            <option value="in_stock">En stock</option>
                            <option value="low_stock">Stock bajo</option>
                            <option value="out_of_stock">Agotado</option>
                        </select>
                    </div>

                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-10 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                        >
                            <RotateCcwIcon className="size-3.5" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Datatable */}
            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 first:pl-4"
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
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="first:pl-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <PackageIcon className="size-8 text-muted-foreground/40" />
                                        <p className="text-sm font-medium text-foreground">
                                            No se encontraron productos en el inventario
                                        </p>
                                        <p className="text-xs text-muted-foreground max-w-sm">
                                            {isFiltered
                                                ? 'Intenta ajustar los filtros de búsqueda o seleccionar otra sucursal.'
                                                : 'No hay productos registrados con inventario en las sucursales.'}
                                        </p>
                                        {isFiltered && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearFilters}
                                                className="mt-2 text-xs"
                                            >
                                                Restablecer filtros
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Datatable Pagination Footer matching datatable-transaction */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t max-sm:flex-col md:max-lg:flex-col">
                    <p className="text-muted-foreground text-xs whitespace-nowrap" aria-live="polite">
                        Mostrando{' '}
                        <span className="font-semibold text-foreground">
                            {table.getRowCount() === 0 ? 0 : pageIndex * pageSize + 1} a{' '}
                            {Math.min(Math.max(pageIndex * pageSize + pageSize, 0), table.getRowCount())}
                        </span>{' '}
                        de{' '}
                        <span className="font-semibold text-foreground">
                            {table.getRowCount().toString()} registros
                        </span>
                    </p>

                    <div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        className="disabled:pointer-events-none disabled:opacity-50 text-xs h-8"
                                        variant="ghost"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        aria-label="Ir a página anterior"
                                    >
                                        <ChevronLeftIcon aria-hidden="true" className="size-4" />
                                        Anterior
                                    </Button>
                                </PaginationItem>

                                {showLeftEllipsis && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}

                                {pages.map((page) => {
                                    const isActive = page === pageIndex + 1;

                                    return (
                                        <PaginationItem key={page}>
                                            <Button
                                                size="icon"
                                                className={`size-8 text-xs ${
                                                    !isActive
                                                        ? 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'
                                                        : ''
                                                }`}
                                                onClick={() => table.setPageIndex(page - 1)}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                {page}
                                            </Button>
                                        </PaginationItem>
                                    );
                                })}

                                {showRightEllipsis && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}

                                <PaginationItem>
                                    <Button
                                        className="disabled:pointer-events-none disabled:opacity-50 text-xs h-8"
                                        variant="ghost"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        aria-label="Ir a página siguiente"
                                    >
                                        Siguiente
                                        <ChevronRightIcon aria-hidden="true" className="size-4" />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </div>
    );
}
