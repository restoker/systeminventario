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
    CornerDownLeft,
    Boxes,
    Store,
    RotateCcw,
    Search,
    Download,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    ReceiptText,
    Loader2,
    X,
    Plus,
    DollarSign,
    PackageCheck,
    Building2,
    MessageSquareText,
    AlertTriangle,
    Wallet,
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
import {
    CajaAbiertaOption,
    DevolucionFilters,
    DevolucionItemRow,
    DevolucionMetrics,
    ProductoOption,
    SucursalOption,
    VentaOptionForDevolucion,
} from '@/types/devolucion-schema';
import { exportarDevolucionesCSVAction } from '@/server/actions/devoluciones/exportar-devoluciones-action';
import ModalNuevaDevolucion from './ModalNuevaDevolucion';

interface TablaDevolucionesProps {
    items: DevolucionItemRow[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    metrics: DevolucionMetrics;
    sucursales: SucursalOption[];
    productos: ProductoOption[];
    ventasDisponibles: VentaOptionForDevolucion[];
    cajasAbiertas: CajaAbiertaOption[];
    isAdmin: boolean;
    filters: DevolucionFilters;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

export default function TablaDevoluciones({
    items,
    totalCount,
    currentPage,
    pageSize,
    metrics,
    sucursales,
    productos,
    ventasDisponibles,
    cajasAbiertas,
    isAdmin,
    filters,
}: TablaDevolucionesProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isNuevaModalOpen, setIsNuevaModalOpen] = useState(false);

    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Copiado: ${text}`);
        setTimeout(() => setCopiedId(null), 1800);
    };

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

    const handlePageChange = (newPage: number) => {
        startTransition(() => {
            router.push(`/dashboard/devoluciones?${createQueryString({ page: newPage })}`);
        });
    };

    const handlePageSizeChange = (newSize: number) => {
        startTransition(() => {
            router.push(`/dashboard/devoluciones?${createQueryString({ page: 1, pageSize: newSize })}`);
        });
    };

    const handleFilterChange = (key: string, val: string) => {
        startTransition(() => {
            router.push(
                `/dashboard/devoluciones?${createQueryString({
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
            router.push(`/dashboard/devoluciones?${createQueryString(newParams)}`);
        });
    };

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
                `/dashboard/devoluciones?${createQueryString({
                    page: 1,
                    fechaInicio: start || null,
                    fechaFin: end || null,
                })}`
            );
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            router.push(
                `/dashboard/devoluciones?${createQueryString({
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
                `/dashboard/devoluciones?${createQueryString({
                    page: 1,
                    search: null,
                })}`
            );
        });
    };

    const handleClearAllFilters = () => {
        setSearchInput('');
        startTransition(() => {
            router.push('/dashboard/devoluciones');
        });
    };

    const isFiltered = Boolean(
        filters.fechaInicio ||
        filters.fechaFin ||
        filters.search ||
        (isAdmin && filters.sucursalId && filters.sucursalId !== 'all') ||
        (filters.productoId && filters.productoId !== 'all')
    );

    const handleExportCSV = async () => {
        try {
            setIsExporting(true);
            const res = await exportarDevolucionesCSVAction({
                fechaInicio: filters.fechaInicio,
                fechaFin: filters.fechaFin,
                sucursalId: filters.sucursalId,
                productoId: filters.productoId,
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
            link.setAttribute('download', `devoluciones_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Reporte de devoluciones descargado (${res.count} registros).`);
        } catch {
            toast.error('Ocurrió un error al descargar el reporte.');
        } finally {
            setIsExporting(false);
        }
    };

    const columns: ColumnDef<typeof features, DevolucionItemRow>[] = useMemo(
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
                header: 'Producto Devuelto',
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

                            <div className="flex flex-col min-w-0 max-w-52 xl:max-w-xs">
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
                header: 'Tienda / Sede',
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
                header: 'Venta / Cliente',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col text-xs leading-tight max-w-44 truncate">
                            <span className="font-mono font-bold text-foreground">
                                {item.comprobanteRef}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate mt-0.5" title={item.cliente || 'Público General'}>
                                {item.cliente || 'Público General'}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'motivo',
                header: 'Motivo',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="max-w-56 xl:max-w-xs text-xs">
                            <p className="text-foreground line-clamp-2 leading-snug" title={item.motivo}>
                                {item.motivo}
                            </p>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'cantidad',
                header: () => <span className="text-right block w-full">Reingreso</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="text-right">
                            <Badge
                                variant="outline"
                                className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            >
                                +{item.cantidad} {item.productoUnidad}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'montoEstimado',
                header: () => <span className="text-right block w-full">Valor Ref.</span>,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="text-right font-mono text-xs space-y-0.5">
                            <div className="font-bold text-foreground">
                                S/ {item.montoEstimado.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                                S/ {item.precioUnitarioReferencia.toFixed(2)} c/u
                            </div>
                        </div>
                    );
                },
            },
        ],
        [copiedId]
    );

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
                        <span className="text-foreground font-medium">Devoluciones</span>
                    </div>

                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                        <div className="rounded-xl p-2 sm:p-2.5 bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                            <CornerDownLeft className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                                    Control de Devoluciones
                                </h1>
                                {isPending && (
                                    <Loader2 className="size-4 text-primary animate-spin shrink-0" />
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                                Historial de mercadería devuelta por clientes, motivos, reposición en almacén y egreso en caja.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Acciones Superiores: Limpiar, Exportar CSV y Botón Nueva Devolución */}
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
                            <span>Limpiar</span>
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

                    <Button
                        size="sm"
                        onClick={() => setIsNuevaModalOpen(true)}
                        className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                        <Plus className="size-4" />
                        <span>Nueva Devolución</span>
                    </Button>
                </div>
            </div>

            {/* Aviso de Caja Cerrada en la Sucursal Activa */}
            {(() => {
                const scopedSucursalId =
                    filters.sucursalId && filters.sucursalId !== 'all'
                        ? filters.sucursalId
                        : !isAdmin
                          ? sucursales[0]?.id || ''
                          : '';

                if (scopedSucursalId) {
                    const cajaActiva = cajasAbiertas.find(
                        (c) => c.sucursalId === scopedSucursalId
                    );
                    if (cajaActiva) return null;

                    const sucursalNombre =
                        sucursales.find((s) => s.id === scopedSucursalId)?.nombre ||
                        'esta sucursal';

                    return (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="size-4" />
                                </div>
                                <div className="min-w-0 text-xs">
                                    <p className="font-semibold text-foreground">
                                        Caja cerrada en {sucursalNombre}
                                    </p>
                                    <p className="text-muted-foreground mt-0.5">
                                        Para registrar una devolución debe haber una caja abierta en la sucursal donde se realizó la venta.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/dashboard/caja?sucursalId=${scopedSucursalId}`}
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className:
                                        'h-8 px-3 text-xs font-semibold border-amber-500/40 bg-background hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0 gap-1.5',
                                })}
                            >
                                <Wallet className="size-3.5" />
                                <span>Abrir Caja en {sucursalNombre}</span>
                            </Link>
                        </div>
                    );
                }

                if (cajasAbiertas.length === 0) {
                    return (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="size-4" />
                                </div>
                                <div className="min-w-0 text-xs">
                                    <p className="font-semibold text-foreground">
                                        Ninguna sucursal tiene caja abierta
                                    </p>
                                    <p className="text-muted-foreground mt-0.5">
                                        Para registrar una nueva devolución debes abrir la caja de la sucursal donde se vendió el producto.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/caja"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className:
                                        'h-8 px-3 text-xs font-semibold border-amber-500/40 bg-background hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0 gap-1.5',
                                })}
                            >
                                <Wallet className="size-3.5" />
                                <span>Ir a Caja</span>
                            </Link>
                        </div>
                    );
                }

                return null;
            })()}

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Devoluciones</span>
                        <ReceiptText className="size-3.5 sm:size-4 text-primary shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                        {metrics.totalDevoluciones.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Registros en consulta
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Unidades Reingresadas</span>
                        <PackageCheck className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                        +{metrics.totalUnidadesDevueltas.toLocaleString('es-PE')}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Retornadas a inventario
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Egreso en Caja</span>
                        <DollarSign className="size-3.5 sm:size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                        S/ {metrics.montoEstimadoDevuelto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Salida referencial generada
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium truncate">Sedes Involucradas</span>
                        <Building2 className="size-3.5 sm:size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                        {metrics.sucursalesAfectadas}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Tiendas con registros
                    </p>
                </div>
            </div>

            {/* SECCIÓN DE FILTROS */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                {/* Fila 1: Rango de Fechas */}
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
                            />
                            <span className="text-xs text-muted-foreground font-medium">a</span>
                            <input
                                type="date"
                                value={filters.fechaFin || ''}
                                onChange={(e) => handleDateChange('fin', e.target.value)}
                                className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                            />
                        </div>
                    </div>

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

                {/* Fila 2: Sede, Producto y Buscador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
                    {isAdmin && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                Tienda / Sucursal
                            </label>
                            <select
                                value={filters.sucursalId || 'all'}
                                onChange={(e) => handleFilterChange('sucursalId', e.target.value)}
                                className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs truncate"
                            >
                                <option value="all">Todas las tiendas</option>
                                {sucursales.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} {s.codigo ? `(${s.codigo})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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

                    <div className={`space-y-1 ${!isAdmin ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            Búsqueda
                        </label>
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Producto, motivo, cliente, comprobante..."
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

            {/* CONTENIDO DE TABLA / TARJETAS */}
            <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* VISTA MÓVIL (< md) */}
                <div className="block md:hidden space-y-3">
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => {
                            const item = row.original;
                            const isCopied = copiedId === item.id;

                            return (
                                <div
                                    key={row.id}
                                    className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs"
                                >
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
                                            className="font-mono text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        >
                                            +{item.cantidad} {item.productoUnidad}
                                        </Badge>
                                    </div>

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

                                    <div className="rounded-lg bg-muted/25 border border-border/50 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                            <MessageSquareText className="size-3" />
                                            <span>Motivo</span>
                                        </div>
                                        <p className="text-foreground leading-snug">{item.motivo}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2">
                                        <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[55%]">
                                            <Store className="size-3 text-primary shrink-0" />
                                            <span className="truncate">{item.sucursalNombre}</span>
                                        </div>
                                        <div className="font-mono font-bold text-foreground">
                                            S/ {item.montoEstimado.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1 truncate max-w-[55%]">
                                            <User className="size-3 shrink-0" />
                                            <span className="truncate">{item.cliente || 'Público General'}</span>
                                        </div>
                                        <span className="font-mono font-semibold text-foreground">
                                            {item.comprobanteRef}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-muted-foreground space-y-2.5">
                            <CornerDownLeft className="size-8 mx-auto text-muted-foreground/40" />
                            <p className="text-sm font-medium text-foreground">No se encontraron devoluciones</p>
                            <p className="text-xs">
                                {isFiltered
                                    ? 'No hay registros que coincidan con los filtros seleccionados.'
                                    : 'Aún no se han registrado devoluciones de clientes.'}
                            </p>
                            <div className="flex items-center justify-center gap-2 pt-1">
                                {isFiltered && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearAllFilters}
                                        className="h-8 text-xs cursor-pointer"
                                    >
                                        Limpiar Filtros
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={() => setIsNuevaModalOpen(true)}
                                    className="h-8 text-xs gap-1 cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    Nueva Devolución
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* VISTA ESCRITORIO / TABLET (>= md) */}
                <div className="hidden md:block rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <Table className="min-w-225">
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
                                            className="h-48 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CornerDownLeft className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">
                                                    No se encontraron devoluciones registradas
                                                </p>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    {isFiltered
                                                        ? 'Prueba ajustando el rango de fechas o los filtros aplicados.'
                                                        : 'Registra una nueva devolución para reingresar unidades y generar su asiento en Kardex.'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {isFiltered && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleClearAllFilters}
                                                            className="h-8 text-xs cursor-pointer"
                                                        >
                                                            Limpiar Filtros
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setIsNuevaModalOpen(true)}
                                                        className="h-8 text-xs gap-1 cursor-pointer"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Nueva Devolución
                                                    </Button>
                                                </div>
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
                        devoluciones
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

            {/* Modal para Registrar Nueva Devolución */}
            <ModalNuevaDevolucion
                isOpen={isNuevaModalOpen}
                onClose={() => setIsNuevaModalOpen(false)}
                sucursales={sucursales}
                productos={productos}
                ventas={ventasDisponibles}
                cajasAbiertas={cajasAbiertas}
                isAdmin={isAdmin}
                defaultSucursalId={filters.sucursalId}
                onSuccess={() => {
                    startTransition(() => {
                        router.refresh();
                    });
                }}
            />
        </div>
    );
}
