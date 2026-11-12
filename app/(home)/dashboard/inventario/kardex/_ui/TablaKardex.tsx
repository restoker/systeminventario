'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
    columnVisibilityFeature,
    flexRender,
    rowPaginationFeature,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import {
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Boxes,
    Store,
    RotateCcw,
    Search,
    Download,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Clock,
    User,
    FileText,
    ArrowRightLeft,
    Layers,
    Loader2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
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
import {
    KardexItemRow,
    KardexMetrics,
    MOTIVOS_LABELS,
} from '@/types/kardex-schema';
import { exportarKardexCSVAction } from '@/server/actions/inventario/exportar-kardex-action';

export { MOTIVOS_LABELS };
export type { KardexItemRow };

export interface KardexFilters {
    fechaInicio: string;
    fechaFin: string;
    sucursalId: string;
    productoId: string;
    tipo: string;
    motivo: string;
    search: string;
}

interface SucursalOption {
    id: string;
    nombre: string;
    codigo: string;
}

interface ProductoOption {
    id: string;
    nombre: string;
    codigo: string;
}

interface TablaKardexProps {
    items: KardexItemRow[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    metrics: KardexMetrics;
    sucursales: SucursalOption[];
    productos: ProductoOption[];
    isAdmin: boolean;
    filters: KardexFilters;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

export default function TablaKardex({
    items,
    totalCount,
    currentPage,
    pageSize,
    metrics,
    sucursales,
    productos,
    isAdmin,
    filters,
}: TablaKardexProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Estado local del buscador de texto
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Sincronizar input cuando cambien los filtros desde fuera
    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Copiado: ${text}`);
        setTimeout(() => setCopiedId(null), 1800);
    };

    // Helper para actualizar query parameters conservando los existentes
    const createQueryString = (params: Record<string, string | number | null | undefined>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '' || value === undefined || value === 'all') {
                current.delete(key);
            } else {
                current.set(key, String(value));
            }
        });
        return current.toString();
    };

    // Navegación de paginación
    const handlePageChange = (newPage: number) => {
        startTransition(() => {
            router.push(`/dashboard/inventario/kardex?${createQueryString({ page: newPage })}`);
        });
    };

    const handlePageSizeChange = (newSize: number) => {
        startTransition(() => {
            router.push(`/dashboard/inventario/kardex?${createQueryString({ page: 1, pageSize: newSize })}`);
        });
    };

    // Actualización de filtros
    const handleFilterChange = (key: string, val: string) => {
        startTransition(() => {
            router.push(
                `/dashboard/inventario/kardex?${createQueryString({
                    page: 1,
                    [key]: val === 'all' ? null : val,
                })}`
            );
        });
    };

    const handleDateChange = (type: 'inicio' | 'fin', val: string) => {
        startTransition(() => {
            const newParams = {
                page: 1,
                fechaInicio: type === 'inicio' ? val : filters.fechaInicio,
                fechaFin: type === 'fin' ? val : filters.fechaFin,
            };
            router.push(`/dashboard/inventario/kardex?${createQueryString(newParams)}`);
        });
    };

    // Atajos de rango de fechas
    const setPresetDates = (preset: 'hoy' | '7dias' | '30dias' | 'mes' | 'todo') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        let start = '';
        let end = '';

        if (preset === 'hoy') {
            start = formatDate(today);
            end = formatDate(today);
        } else if (preset === '7dias') {
            const past = new Date();
            past.setDate(today.getDate() - 7);
            start = formatDate(past);
            end = formatDate(today);
        } else if (preset === '30dias') {
            const past = new Date();
            past.setDate(today.getDate() - 30);
            start = formatDate(past);
            end = formatDate(today);
        } else if (preset === 'mes') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            start = formatDate(firstDay);
            end = formatDate(today);
        } else if (preset === 'todo') {
            start = '';
            end = '';
        }

        startTransition(() => {
            router.push(
                `/dashboard/inventario/kardex?${createQueryString({
                    page: 1,
                    fechaInicio: start || null,
                    fechaFin: end || null,
                })}`
            );
        });
    };

    // Envío y limpieza de búsqueda
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            router.push(
                `/dashboard/inventario/kardex?${createQueryString({
                    page: 1,
                    search: searchInput.trim() || null,
                })}`
            );
        });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        startTransition(() => {
            router.push(
                `/dashboard/inventario/kardex?${createQueryString({
                    page: 1,
                    search: null,
                })}`
            );
        });
    };

    // Limpiar todos los filtros
    const handleClearAllFilters = () => {
        setSearchInput('');
        startTransition(() => {
            router.push('/dashboard/inventario/kardex');
        });
    };

    const isFiltered = Boolean(
        filters.fechaInicio ||
        filters.fechaFin ||
        filters.search ||
        (isAdmin && filters.sucursalId && filters.sucursalId !== 'all') ||
        (filters.productoId && filters.productoId !== 'all') ||
        (filters.tipo && filters.tipo !== 'all') ||
        (filters.motivo && filters.motivo !== 'all')
    );

    // Exportación a CSV optimizada desde el servidor
    const handleExportCSV = async () => {
        try {
            setIsExporting(true);
            const res = await exportarKardexCSVAction({
                fechaInicio: filters.fechaInicio,
                fechaFin: filters.fechaFin,
                sucursalId: filters.sucursalId,
                productoId: filters.productoId,
                tipo: filters.tipo,
                motivo: filters.motivo,
                search: filters.search,
            });

            if (!res.success || !res.csvContent) {
                toast.error(res.error || 'No fue posible exportar el reporte.');
                return;
            }

            const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `kardex_reporte_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Reporte de Kardex descargado (${res.count} movimientos).`);
        } catch {
            toast.error('Ocurrió un error al descargar el reporte.');
        } finally {
            setIsExporting(false);
        }
    };

    // Columnas para TanStack Table
    const columns: ColumnDef<typeof features, KardexItemRow>[] = useMemo(
        () => [
            {
                accessorKey: 'fecha',
                header: 'Fecha y Hora',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col text-xs leading-tight">
                            <span className="font-semibold text-foreground whitespace-nowrap">
                                {item.fechaFormateada}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                <Clock className="size-2.5" />
                                {item.horaFormateada}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'productoNombre',
                header: 'Producto',
                cell: ({ row }) => {
                    const item = row.original;
                    const isCopied = copiedId === item.id;

                    return (
                        <div className="flex items-center gap-2.5 py-0.5">
                            <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                                {item.productoImagenUrl ? (
                                    <Image
                                        src={item.productoImagenUrl}
                                        alt={item.productoNombre}
                                        width={36}
                                        height={36}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Boxes className="size-4 text-muted-foreground/60" />
                                )}
                            </div>

                            <div className="flex flex-col min-w-0 max-w-48 xl:max-w-xs">
                                <span className="font-semibold text-xs text-foreground truncate" title={item.productoNombre}>
                                    {item.productoNombre}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-muted-foreground font-medium">
                                        {item.productoCodigo}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.productoCodigo, item.id)}
                                        className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                        title="Copiar código"
                                    >
                                        {isCopied ? (
                                            <Check className="size-2.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="size-2.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'sucursalNombre',
                header: 'Sede',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-1.5 text-xs">
                            <Store className="size-3 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate max-w-28" title={item.sucursalNombre}>
                                {item.sucursalNombre}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'comprobanteRef',
                header: 'Comprobante / Ref.',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col text-xs leading-tight">
                            <span className="font-mono font-bold text-foreground">
                                {item.comprobanteRef || 'S/N'}
                            </span>
                            {item.origenTipo && (
                                <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                                    {item.origenTipo}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'motivo',
                header: 'Operación y Detalle',
                cell: ({ row }) => {
                    const item = row.original;
                    const isEntrada = item.tipoMovimiento === 'ENTRADA';

                    return (
                        <div className="flex flex-col gap-1 max-w-56 xl:max-w-xs text-xs">
                            <div className="flex items-center gap-1.5">
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold gap-1 px-1.5 py-0.5 ${isEntrada
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                            : 'bg-destructive/10 text-destructive border-destructive/20'
                                        }`}
                                >
                                    {isEntrada ? (
                                        <ArrowDownLeft className="size-2.5" />
                                    ) : (
                                        <ArrowUpRight className="size-2.5" />
                                    )}
                                    <span>{item.tipoMovimiento}</span>
                                </Badge>
                                <span className="font-medium text-foreground truncate">
                                    {item.motivoLegible}
                                </span>
                            </div>
                            {item.detalleMotivo && (
                                <p className="text-[11px] text-muted-foreground truncate" title={item.detalleMotivo}>
                                    {item.detalleMotivo}
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'cantidad',
                header: () => <span className="text-right block w-full">Variación</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    const isEntrada = item.tipoMovimiento === 'ENTRADA';

                    return (
                        <div className="text-right font-mono">
                            <span
                                className={`text-xs font-bold ${isEntrada
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-destructive'
                                    }`}
                            >
                                {isEntrada ? '+' : '-'}
                                {item.cantidad} {item.productoUnidad}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'stockActual',
                header: () => <span className="text-right block w-full">Saldo Stock</span>,
                cell: ({ row }) => {
                    const item = row.original;

                    return (
                        <div className="text-right font-mono text-xs">
                            <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                                <span>{item.stockAnterior}</span>
                                <span>→</span>
                                <strong className="text-foreground font-bold text-xs">
                                    {item.stockActual}
                                </strong>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                {item.productoUnidad}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'costoTotal',
                header: () => <span className="text-right block w-full">Valorización</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    const cTotal = Number(item.costoTotal) || 0;
                    const cUnit = Number(item.costoUnitario) || 0;

                    return (
                        <div className="text-right font-mono text-xs space-y-0.5">
                            <div className="font-bold text-foreground">
                                S/ {cTotal.toFixed(2)}
                            </div>
                            {cUnit > 0 && (
                                <div className="text-[10px] text-muted-foreground">
                                    S/ {cUnit.toFixed(2)} c/u
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'usuarioNombre',
                header: 'Responsable',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="size-3 text-muted-foreground/80 shrink-0" />
                            <span className="truncate max-w-24" title={item.usuarioNombre}>
                                {item.usuarioNombre}
                            </span>
                        </div>
                    );
                },
            },
        ],
        [copiedId]
    );

    // Instancia de TanStack Table en modo de paginación manual del servidor
    const table = useTable(
        {
            features,
            data: items,
            columns,
            manualPagination: true,
            rowCount: totalCount,
            state: {
                pagination: {
                    pageIndex: currentPage - 1,
                    pageSize,
                },
            },
        },
        (state) => ({ pagination: state.pagination })
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage,
        totalPages,
        paginationItemsToDisplay: 3,
    });

    return (
        <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full">
            {/* Header del Módulo */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-2 border-b border-border/70">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground mb-1">
                        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/inventario" className="hover:text-foreground">Inventario</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Libro Kardex</span>
                    </div>

                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                        <div className="rounded-xl p-2 sm:p-2.5 bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                            <Layers className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                                    Kardex de Inventario
                                </h1>
                                {isPending && (
                                    <Loader2 className="size-4 text-primary animate-spin shrink-0" />
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                                Registro inmutable de movimientos físicos y valorizados con paginación optimizada.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Acciones Superiores: Exportar y Limpiar */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllFilters}
                            disabled={isPending}
                            className="h-9 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Limpiar Filtros</span>
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={isExporting || totalCount === 0}
                        className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin text-primary" />
                                <span>Exportando...</span>
                            </>
                        ) : (
                            <>
                                <Download className="size-3.5 text-primary" />
                                <span>Exportar CSV</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Métricas del Período Calculadas en Servidor */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* 1. Total Movimientos */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Movimientos</span>
                        <FileText className="size-3.5 sm:size-4 text-primary shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                        {metrics.totalMovimientos.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Operaciones en consulta
                    </p>
                </div>

                {/* 2. Unidades Ingresadas (Entradas) */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Entradas (Unid.)</span>
                        <TrendingUp className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                        +{metrics.totalEntradas.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        S/ {metrics.valorTotalEntradas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} valorizado
                    </p>
                </div>

                {/* 3. Unidades Egresadas (Salidas) */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Salidas (Unid.)</span>
                        <TrendingDown className="size-3.5 sm:size-4 text-destructive shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-destructive tracking-tight">
                        -{metrics.totalSalidas.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        S/ {metrics.valorTotalSalidas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} valorizado
                    </p>
                </div>

                {/* 4. Flujo Neto de Existencias */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Flujo Neto</span>
                        <ArrowRightLeft className="size-3.5 sm:size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    </div>
                    <div
                        className={`text-lg sm:text-2xl font-bold font-mono tracking-tight ${metrics.balanceNetoUnidades >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive'
                            }`}
                    >
                        {metrics.balanceNetoUnidades >= 0 ? '+' : ''}
                        {metrics.balanceNetoUnidades.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Balance neto de unidades
                    </p>
                </div>
            </div>

            {/* SECCIÓN DE FILTROS: Rango de Fechas, Sedes, Productos y Motivos */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                {/* Fila 1: Filtro de Rango de Fechas con accesos rápidos */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                            <Calendar className="size-3.5 text-primary" />
                            Rango de Fechas:
                        </span>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={filters.fechaInicio || ''}
                                onChange={(e) => handleDateChange('inicio', e.target.value)}
                                className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                                placeholder="Desde"
                            />
                            <span className="text-xs text-muted-foreground font-medium">a</span>
                            <input
                                type="date"
                                value={filters.fechaFin || ''}
                                onChange={(e) => handleDateChange('fin', e.target.value)}
                                className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                                placeholder="Hasta"
                            />
                        </div>
                    </div>

                    {/* Botones de Selección Rápida de Fechas */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setPresetDates('hoy')}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetDates('7dias')}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                            Últimos 7 días
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetDates('30dias')}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                            Últimos 30 días
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetDates('mes')}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                            Este mes
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetDates('todo')}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                            Todo
                        </button>
                    </div>
                </div>

                {/* Fila 2: Selectores de Sede, Producto, Tipo, Motivo y Buscador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-border/60">
                    {/* Selector de Sucursal (Para Administradores) */}
                    {isAdmin && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                Sucursal
                            </label>
                            <select
                                value={filters.sucursalId || 'all'}
                                onChange={(e) => handleFilterChange('sucursalId', e.target.value)}
                                className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs truncate"
                            >
                                <option value="all">Todas las sedes</option>
                                {sucursales.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} {s.codigo ? `(${s.codigo})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Selector de Producto */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Producto
                        </label>
                        <select
                            value={filters.productoId || 'all'}
                            onChange={(e) => handleFilterChange('productoId', e.target.value)}
                            className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs truncate"
                        >
                            <option value="all">Todos los productos</option>
                            {productos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} ({p.codigo})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de Tipo (Entrada/Salida) */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Tipo de Flujo
                        </label>
                        <select
                            value={filters.tipo || 'all'}
                            onChange={(e) => handleFilterChange('tipo', e.target.value)}
                            className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                        >
                            <option value="all">Todos los flujos</option>
                            <option value="ENTRADA">Entradas (+)</option>
                            <option value="SALIDA">Salidas (-)</option>
                        </select>
                    </div>

                    {/* Selector de Motivo Operativo */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Motivo
                        </label>
                        <select
                            value={filters.motivo || 'all'}
                            onChange={(e) => handleFilterChange('motivo', e.target.value)}
                            className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                        >
                            <option value="all">Todos los motivos</option>
                            <option value="COMPRA">Compras</option>
                            <option value="VENTA">Ventas</option>
                            <option value="TRASLADO_ENTRADA">Traslado Entrante</option>
                            <option value="TRASLADO_SALIDA">Traslado Saliente</option>
                            <option value="AJUSTE_POSITIVO">Ajuste Sobrante (+)</option>
                            <option value="AJUSTE_NEGATIVO">Ajuste Faltante (-)</option>
                            <option value="MERMA">Mermas / Pérdidas</option>
                            <option value="INVENTARIO_INICIAL">Inventario Inicial</option>
                            <option value="DEVOLUCION_CLIENTE">Devolución Cliente</option>
                            <option value="DEVOLUCION_PROVEEDOR">Devolución Proveedor</option>
                            <option value="ANULACION_ENTRADA">Anulación Entrada</option>
                            <option value="ANULACION_SALIDA">Anulación Salida</option>
                        </select>
                    </div>

                    {/* Buscador de Texto con submit */}
                    <div className={`space-y-1 ${!isAdmin ? 'sm:col-span-2' : ''}`}>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Búsqueda
                        </label>
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Comprobante, producto..."
                                className="w-full h-8.5 rounded-lg border border-input bg-background pl-7 pr-8 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                            <Search className="size-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="Borrar búsqueda"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR CON ESTADO DE CARGA SUAVE DURANTE LA TRANSICIÓN */}
            <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* VISTA MÓVIL (< md): Tarjetas de Kardex */}
                <div className="block md:hidden space-y-3">
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => {
                            const item = row.original;
                            const isEntrada = item.tipoMovimiento === 'ENTRADA';
                            const isCopied = copiedId === item.id;

                            return (
                                <div
                                    key={row.id}
                                    className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs"
                                >
                                    {/* Fila 1: Fecha, Hora y Tipo de Movimiento */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Clock className="size-3 text-muted-foreground" />
                                            <span>{item.fechaFormateada}</span>
                                            <span className="text-muted-foreground font-mono text-[11px]">
                                                {item.horaFormateada}
                                            </span>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-semibold gap-1 px-1.5 py-0.5 ${isEntrada
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : 'bg-destructive/10 text-destructive border-destructive/20'
                                                }`}
                                        >
                                            {isEntrada ? (
                                                <ArrowDownLeft className="size-2.5" />
                                            ) : (
                                                <ArrowUpRight className="size-2.5" />
                                            )}
                                            <span>{item.tipoMovimiento}</span>
                                        </Badge>
                                    </div>

                                    {/* Fila 2: Producto */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                                            {item.productoImagenUrl ? (
                                                <Image
                                                    src={item.productoImagenUrl}
                                                    alt={item.productoNombre}
                                                    width={40}
                                                    height={40}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <Boxes className="size-5 text-muted-foreground/60" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-xs text-foreground leading-tight truncate">
                                                {item.productoNombre}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                                                <span className="font-mono">{item.productoCodigo}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(item.productoCodigo, item.id)}
                                                    className="p-0.5 hover:text-foreground cursor-pointer"
                                                >
                                                    {isCopied ? (
                                                        <Check className="size-2.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="size-2.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fila 3: Motivo y Comprobante */}
                                    <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2">
                                        <div className="space-y-0.5">
                                            <span className="font-medium text-foreground block">
                                                {item.motivoLegible}
                                            </span>
                                            {item.detalleMotivo && (
                                                <span className="text-[11px] text-muted-foreground block truncate max-w-xs">
                                                    {item.detalleMotivo}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-right font-mono text-xs">
                                            <span className="text-[10px] text-muted-foreground block">
                                                {item.origenTipo || 'Doc'}
                                            </span>
                                            <strong className="text-foreground">
                                                {item.comprobanteRef || 'S/N'}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Fila 4: Detalle de Movimiento de Unidades y Valor */}
                                    <div className="grid grid-cols-2 gap-2 bg-muted/20 rounded-lg p-2.5 border border-border/60 text-xs">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                                Movimiento
                                            </span>
                                            <div
                                                className={`font-mono font-bold text-sm mt-0.5 ${isEntrada
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-destructive'
                                                    }`}
                                            >
                                                {isEntrada ? '+' : '-'}
                                                {item.cantidad} {item.productoUnidad}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                Saldo: {item.stockAnterior} → <strong>{item.stockActual}</strong>
                                            </div>
                                        </div>

                                        <div className="text-right font-mono space-y-0.5">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                                Valor Total
                                            </span>
                                            <div className="font-bold text-foreground text-sm">
                                                S/ {item.costoTotal.toFixed(2)}
                                            </div>
                                            {item.costoUnitario > 0 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    S/ {item.costoUnitario.toFixed(2)} c/u
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fila 5: Sede y Responsable */}
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                                        <div className="flex items-center gap-1 truncate">
                                            <Store className="size-3 text-primary shrink-0" />
                                            <span className="truncate">{item.sucursalNombre}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <User className="size-3 shrink-0" />
                                            <span className="truncate">{item.usuarioNombre}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-muted-foreground space-y-2">
                            <Layers className="size-8 mx-auto text-muted-foreground/40" />
                            <p className="text-sm font-medium text-foreground">No se encontraron movimientos</p>
                            <p className="text-xs">Prueba modificando el rango de fechas o los filtros seleccionados.</p>
                            {isFiltered && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAllFilters}
                                    className="mt-2 h-8 text-xs cursor-pointer"
                                >
                                    Limpiar Filtros
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* VISTA ESCRITORIO / TABLET (>= md): Tabla Completa */}
                <div className="hidden md:block rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <Table className="min-w-237.5">
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
                                                <Layers className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">
                                                    No se registraron movimientos en el Kardex
                                                </p>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    No hay registros que coincidan con el rango de fechas o filtros seleccionados.
                                                </p>
                                                {isFiltered && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleClearAllFilters}
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
                    </div>
                </div>
            </div>

            {/* Paginación en Servidor */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="text-xs text-muted-foreground text-center sm:text-left">
                        Mostrando{' '}
                        <strong className="text-foreground font-mono">
                            {(currentPage - 1) * pageSize + 1}
                        </strong>{' '}
                        a{' '}
                        <strong className="text-foreground font-mono">
                            {Math.min(currentPage * pageSize, totalCount)}
                        </strong>{' '}
                        de{' '}
                        <strong className="text-foreground font-mono">
                            {totalCount.toLocaleString('es-PE')}
                        </strong>{' '}
                        movimientos
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                disabled={isPending}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground cursor-pointer disabled:opacity-50"
                            >
                                {[15, 30, 50, 100].map((size) => (
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
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage <= 1 || isPending}
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
                                    const isActive = currentPage === page;
                                    return (
                                        <PaginationItem key={page}>
                                            <Button
                                                variant={isActive ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                                disabled={isPending}
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
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages || isPending}
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
    );
}
