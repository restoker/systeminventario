'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
    columnVisibilityFeature,
    createPaginatedRowModel,
    flexRender,
    rowPaginationFeature,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import {
    Search,
    Store,
    Boxes,
    PackagePlus,
    ArrowRightLeft,
    SlidersHorizontal,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    DollarSign,
    Layers,
    Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

import { usePagination } from '@/hooks/use-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from '@/components/ui/pagination';

import ModalAjusteStock, { StockProductOption } from './ModalAjusteStock';
import ModalTrasladoStock from './ModalTrasladoStock';
import ModalStockMinimo from './ModalStockMinimo';

export interface StockItemRow {
    id: string;
    productoId: string;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    imagenUrl: string | null;
    categoria: string;
    marca: string;
    unidad: string;
    precioVenta: number;
    precioCompra: number | null;
    cantidad: number;
    stockMinimo: number;
    estadoStock: 'in_stock' | 'low_stock' | 'out_of_stock';
    valorInventario: number;
}

interface SucursalSummary {
    id: string;
    nombre: string;
    codigo: string;
    direccion?: string | null;
    telefono?: string | null;
    activo: boolean | null;
}

interface CategoriaSummary {
    id: string;
    nombre: string;
}

interface TablaStockSucursalProps {
    sucursal: SucursalSummary;
    sucursales: SucursalSummary[];
    items: StockItemRow[];
    categorias: CategoriaSummary[];
    isAdmin: boolean;
    initialProductoId?: string;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
    paginatedRowModel: createPaginatedRowModel(),
});

export default function TablaStockSucursal({
    sucursal,
    sucursales,
    items,
    categorias,
    isAdmin,
    initialProductoId,
}: TablaStockSucursalProps) {
    const router = useRouter();

    // Filtros locales
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Estados para Modales
    const [isAjusteOpen, setIsAjusteOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);
    const [isMinimoOpen, setIsMinimoOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StockProductOption | null>(null);

    // Lista de productos ligera para los selectores de los modales
    const modalProductList: StockProductOption[] = useMemo(() => {
        return items.map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: i.cantidad,
            stockMinimo: i.stockMinimo,
            unidad: i.unidad,
            precioCompra: i.precioCompra,
        }));
    }, [items]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Código ${text} copiado al portapapeles`);
        setTimeout(() => setCopiedId(null), 1800);
    };

    // Resumen de Métricas de la Sede
    const metrics = useMemo(() => {
        const totalProductos = items.length;
        const totalUnidades = items.reduce((acc, curr) => acc + curr.cantidad, 0);
        const valorTotal = items.reduce((acc, curr) => acc + curr.valorInventario, 0);
        const lowStockCount = items.filter((i) => i.estadoStock === 'low_stock').length;
        const outOfStockCount = items.filter((i) => i.estadoStock === 'out_of_stock').length;

        return {
            totalProductos,
            totalUnidades,
            valorTotal,
            lowStockCount,
            outOfStockCount,
        };
    }, [items]);

    // Filtrado de Datos
    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return items.filter((item) => {
            // Filtro por Estado de Stock
            if (statusFilter !== 'all' && item.estadoStock !== statusFilter) {
                return false;
            }

            // Filtro por Categoría
            if (categoriaFilter !== 'all' && item.categoria !== categoriaFilter) {
                return false;
            }

            // Búsqueda por texto (nombre, código, marca, descripción)
            if (query) {
                const matchNombre = item.nombre.toLowerCase().includes(query);
                const matchCodigo = item.codigo.toLowerCase().includes(query);
                const matchMarca = item.marca.toLowerCase().includes(query);
                const matchDesc = item.descripcion?.toLowerCase().includes(query) ?? false;

                if (!matchNombre && !matchCodigo && !matchMarca && !matchDesc) {
                    return false;
                }
            }

            return true;
        });
    }, [items, searchQuery, statusFilter, categoriaFilter]);

    // Manejadores para abrir modales con un producto específico
    const handleOpenAjuste = (item?: StockItemRow) => {
        if (item) {
            setSelectedProduct({
                productoId: item.productoId,
                nombre: item.nombre,
                codigo: item.codigo,
                cantidad: item.cantidad,
                stockMinimo: item.stockMinimo,
                unidad: item.unidad,
                precioCompra: item.precioCompra,
            });
        } else {
            setSelectedProduct(null);
        }
        setIsAjusteOpen(true);
    };

    const handleOpenTraslado = (item?: StockItemRow) => {
        if (item) {
            setSelectedProduct({
                productoId: item.productoId,
                nombre: item.nombre,
                codigo: item.codigo,
                cantidad: item.cantidad,
                stockMinimo: item.stockMinimo,
                unidad: item.unidad,
                precioCompra: item.precioCompra,
            });
        } else {
            setSelectedProduct(null);
        }
        setIsTrasladoOpen(true);
    };

    const handleOpenMinimo = (item: StockItemRow) => {
        setSelectedProduct({
            productoId: item.productoId,
            nombre: item.nombre,
            codigo: item.codigo,
            cantidad: item.cantidad,
            stockMinimo: item.stockMinimo,
            unidad: item.unidad,
            precioCompra: item.precioCompra,
        });
        setIsMinimoOpen(true);
    };

    // Definición de Columnas de la Tabla con tipado exacto para TanStack Table
    const columns: ColumnDef<typeof features, StockItemRow>[] = useMemo(
        () => [
            {
                accessorKey: 'nombre',
                header: 'Producto',
                cell: ({ row }) => {
                    const item = row.original;
                    const isCopied = copiedId === item.id;

                    return (
                        <div className="flex items-center gap-3 py-1">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                                {item.imagenUrl ? (
                                    <Image
                                        src={item.imagenUrl}
                                        alt={item.nombre}
                                        width={40}
                                        height={40}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Boxes className="size-5 text-muted-foreground/60" />
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                                    {item.nombre}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[11px] text-muted-foreground font-medium">
                                        {item.codigo}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.codigo, item.id)}
                                        className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
                                        title="Copiar código"
                                    >
                                        {isCopied ? (
                                            <Check className="size-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                },
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
                },
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
                                    className={`text-base font-bold font-mono tracking-tight ${
                                        isOut
                                            ? 'text-destructive'
                                            : isLow
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-foreground'
                                    }`}
                                >
                                    {item.cantidad}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-semibold">
                                    {item.unidad}
                                </span>
                            </div>
                            <div className="flex justify-end mt-1">
                                <button
                                    type="button"
                                    onClick={() => handleOpenMinimo(item)}
                                    title={`Clic para modificar umbral de stock mínimo (Actual: ${item.stockMinimo} ${item.unidad})`}
                                    className="group inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/50 hover:text-primary px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground transition-all cursor-pointer shadow-2xs"
                                >
                                    <ShieldAlert className="size-3 text-amber-500/90 group-hover:text-amber-500 shrink-0" />
                                    <span>Mín: <strong className="text-foreground group-hover:text-primary">{item.stockMinimo}</strong></span>
                                    <Pencil className="size-2.5 text-muted-foreground/60 group-hover:text-primary shrink-0 transition-transform group-hover:scale-110 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'precioVenta',
                header: () => <span className="text-right block w-full">Precios (Unid.)</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    const pVenta = Number(item.precioVenta) || 0;
                    const pCompra = Number(item.precioCompra) || 0;

                    return (
                        <div className="text-right font-mono text-xs space-y-0.5">
                            <div className="font-semibold text-foreground">
                                S/ {pVenta.toFixed(2)}{' '}
                                <span className="text-[10px] font-normal text-muted-foreground">Venta</span>
                            </div>
                            {pCompra > 0 && (
                                <div className="text-[11px] text-muted-foreground">
                                    S/ {pCompra.toFixed(2)}{' '}
                                    <span className="text-[9px]">Costo</span>
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'valorInventario',
                header: () => <span className="text-right block w-full">Valor Total</span>,
                cell: ({ row }) => {
                    const valor = Number(row.original.valorInventario) || 0;
                    return (
                        <div className="text-right font-mono text-xs font-bold text-foreground">
                            S/ {valor.toFixed(2)}
                        </div>
                    );
                },
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
                                <XCircle className="size-3" />
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
                                <AlertTriangle className="size-3 text-amber-500" />
                                Stock Bajo
                            </Badge>
                        );
                    }
                    return (
                        <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium gap-1"
                        >
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            En Stock
                        </Badge>
                    );
                },
            },
            {
                id: 'acciones',
                header: () => <span className="text-right block w-full">Operaciones</span>,
                cell: ({ row }) => {
                    const item = row.original;

                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Ajustar */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAjuste(item)}
                                className="h-7 px-2 text-xs font-medium gap-1 text-foreground hover:bg-muted cursor-pointer"
                                title="Realizar ajuste físico de stock"
                            >
                                <SlidersHorizontal className="size-3 text-primary" />
                                <span className="hidden sm:inline">Ajustar</span>
                            </Button>

                            {/* Botón Trasladar */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenTraslado(item)}
                                disabled={item.cantidad <= 0}
                                className="h-7 px-2 text-xs font-medium gap-1 text-foreground hover:bg-muted cursor-pointer disabled:opacity-40"
                                title={
                                    item.cantidad <= 0
                                        ? 'Sin existencias para trasladar'
                                        : 'Trasladar unidades a otra sucursal'
                                }
                            >
                                <ArrowRightLeft className="size-3 text-blue-500" />
                                <span className="hidden sm:inline">Trasladar</span>
                            </Button>

                            {/* Botón Stock Mínimo */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenMinimo(item)}
                                className="h-7 px-2 text-xs font-medium gap-1 text-foreground hover:bg-muted hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                                title={`Configurar umbral de stock mínimo de alerta (Actual: ${item.stockMinimo} ${item.unidad})`}
                            >
                                <ShieldAlert className="size-3 text-amber-500 shrink-0" />
                                <span className="hidden xl:inline">Mínimo</span>
                            </Button>

                            {/* Botón Reabastecer */}
                            <Link
                                href={`/dashboard/inventario/reabastecer?sucursalId=${sucursal.id}&productoId=${item.productoId}`}
                                title={`Comprar / Reabastecer ${item.nombre}`}
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className:
                                        'h-7 px-2 text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer',
                                })}
                            >
                                <PackagePlus className="size-3.5" />
                                <span className="hidden sm:inline">Reabastecer</span>
                            </Link>
                        </div>
                    );
                },
            },
        ],
        [copiedId, sucursal.id]
    );

    // TanStack Table Instance
    const table = useTable(
        {
            features,
            data: filteredData,
            columns,
            initialState: {
                pagination: { pageIndex: 0, pageSize: 10 },
            },
        },
        (state) => ({ pagination: state.pagination })
    );

    const { pageIndex, pageSize } = table.state.pagination;
    const pageCount = table.getPageCount();

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage: pageIndex + 1,
        totalPages: pageCount,
        paginationItemsToDisplay: 3,
    });

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header del Módulo con Identificación de Sucursal */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/70">
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/inventario" className="hover:text-foreground">Inventario</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Control de Stock</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl p-2.5 bg-primary/10 text-primary shrink-0">
                            <Store className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Stock en {sucursal.nombre}
                                </h1>
                                {sucursal.codigo && (
                                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                                        {sucursal.codigo}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {sucursal.direccion || 'Sede operativa'}
                                {sucursal.telefono ? ` • Tel: ${sucursal.telefono}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Acciones Superiores & Selector de Sucursal para Administradores */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Selector de Sucursal (Para Administradores) */}
                    {isAdmin && (
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground hidden sm:inline">
                                Cambiar Sede:
                            </label>
                            <select
                                value={sucursal.id}
                                onChange={(e) => {
                                    router.push(`/dashboard/inventario/stock?sucursalId=${e.target.value}`);
                                }}
                                className="h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                            >
                                {sucursales.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} {s.codigo ? `(${s.codigo})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Botón Nuevo Ajuste */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAjuste()}
                        className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <SlidersHorizontal className="size-3.5 text-primary" />
                        <span>Nuevo Ajuste</span>
                    </Button>

                    {/* Botón Nuevo Traslado */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTraslado()}
                        className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <ArrowRightLeft className="size-3.5 text-blue-500" />
                        <span>Nuevo Traslado</span>
                    </Button>

                    {/* Botón Reabastecer Sucursal */}
                    <Link
                        href={`/dashboard/inventario/reabastecer?sucursalId=${sucursal.id}`}
                        className={buttonVariants({
                            size: 'sm',
                            className: 'h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-sm',
                        })}
                    >
                        <PackagePlus className="size-3.5" />
                        <span>Reabastecer Sede</span>
                    </Link>
                </div>
            </div>

            {/* Tarjetas Métricas Clave de la Sucursal */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total de Artículos */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Artículos en Catálogo</span>
                        <Boxes className="size-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                        {metrics.totalProductos}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Productos registrados en el sistema
                    </p>
                </div>

                {/* 2. Unidades Físicas Totales */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Stock Físico Total</span>
                        <Layers className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                        {metrics.totalUnidades}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Unidades físicas en almacén
                    </p>
                </div>

                {/* 3. Valorización del Inventario */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Valor Estimado de Stock</span>
                        <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                        S/ {metrics.valorTotal.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Valorización de existencias de la sede
                    </p>
                </div>

                {/* 4. Alertas de Reposición */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Alertas de Stock</span>
                        <ShieldAlert className="size-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
                            {metrics.lowStockCount + metrics.outOfStockCount}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                            ({metrics.lowStockCount} bajo • {metrics.outOfStockCount} agotado)
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Productos que requieren reposición
                    </p>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Pestañas de Filtro de Estado */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            statusFilter === 'all'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Todos ({items.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('in_stock')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            statusFilter === 'in_stock'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        En Stock ({items.filter((i) => i.estadoStock === 'in_stock').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('low_stock')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            statusFilter === 'low_stock'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Stock Bajo ({metrics.lowStockCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('out_of_stock')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            statusFilter === 'out_of_stock'
                                ? 'bg-destructive text-destructive-foreground shadow-xs'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Agotados ({metrics.outOfStockCount})
                    </button>
                </div>

                {/* Filtro por Categoría y Buscador */}
                <div className="flex items-center gap-2">
                    {/* Selector de Categoría */}
                    <div className="w-40 sm:w-48 shrink-0">
                        <select
                            value={categoriaFilter}
                            onChange={(e) => setCategoriaFilter(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                        >
                            <option value="all">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.nombre}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buscador de Producto */}
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre, código..."
                            className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                        <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Tabla de Existencias */}
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                <Table>
                    <TableHeader className="bg-muted/40 border-b border-border/70">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-xs font-semibold text-foreground py-3"
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
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-muted/30 border-b border-border/50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-44 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Boxes className="size-8 text-muted-foreground/40" />
                                        <p className="text-sm font-medium text-foreground">
                                            No se encontraron productos en esta sucursal
                                        </p>
                                        <p className="text-xs text-muted-foreground max-w-sm">
                                            {searchQuery || statusFilter !== 'all' || categoriaFilter !== 'all'
                                                ? 'Prueba modificando tus filtros o criterio de búsqueda.'
                                                : 'Realiza un reabastecimiento o ajuste inicial para ingresar mercadería a esta sede.'}
                                        </p>
                                        {searchQuery && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setStatusFilter('all');
                                                    setCategoriaFilter('all');
                                                }}
                                                className="mt-1 h-7 text-xs cursor-pointer"
                                            >
                                                Limpiar Filtros
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Footer de Paginación */}
                {filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/70 bg-card">
                        <div className="text-xs text-muted-foreground">
                            Mostrando{' '}
                            <strong className="text-foreground font-mono">
                                {pageIndex * pageSize + 1}
                            </strong>{' '}
                            a{' '}
                            <strong className="text-foreground font-mono">
                                {Math.min((pageIndex + 1) * pageSize, filteredData.length)}
                            </strong>{' '}
                            de{' '}
                            <strong className="text-foreground font-mono">
                                {filteredData.length}
                            </strong>{' '}
                            artículos
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>Mostrar:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground cursor-pointer"
                                >
                                    {[10, 20, 50, 100].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Pagination className="mx-0 w-auto">
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                            className="h-8 px-2 text-xs gap-1 cursor-pointer disabled:opacity-40"
                                        >
                                            <ChevronLeft className="size-3.5" />
                                            <span className="hidden sm:inline">Anterior</span>
                                        </Button>
                                    </PaginationItem>

                                    {showLeftEllipsis && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}

                                    {pages.map((page) => {
                                        const isActive = pageIndex + 1 === page;
                                        return (
                                            <PaginationItem key={page}>
                                                <Button
                                                    variant={isActive ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => table.setPageIndex(page - 1)}
                                                    className="size-8 p-0 text-xs font-mono font-medium cursor-pointer"
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
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                            className="h-8 px-2 text-xs gap-1 cursor-pointer disabled:opacity-40"
                                        >
                                            <span className="hidden sm:inline">Siguiente</span>
                                            <ChevronRight className="size-3.5" />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales de Ajuste, Traslado y Stock Mínimo */}
            <ModalAjusteStock
                isOpen={isAjusteOpen}
                onClose={() => setIsAjusteOpen(false)}
                sucursalId={sucursal.id}
                sucursalNombre={sucursal.nombre}
                productos={modalProductList}
                selectedProduct={selectedProduct}
                onSuccess={() => router.refresh()}
            />

            <ModalTrasladoStock
                isOpen={isTrasladoOpen}
                onClose={() => setIsTrasladoOpen(false)}
                sucursalOrigenId={sucursal.id}
                sucursalOrigenNombre={sucursal.nombre}
                sucursales={sucursales}
                productos={modalProductList}
                selectedProduct={selectedProduct}
                onSuccess={() => router.refresh()}
            />

            <ModalStockMinimo
                isOpen={isMinimoOpen}
                onClose={() => setIsMinimoOpen(false)}
                sucursalId={sucursal.id}
                product={selectedProduct}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
