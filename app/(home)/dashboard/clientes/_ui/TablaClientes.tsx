'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    Eye,
    Loader2,
    Phone,
    RotateCcw,
    Search,
    Store,
    User,
    Users,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
    ClienteOrdenFiltro,
    ClienteResumenRow,
    ClienteSegmentoFiltro,
    ClientesFilters,
    ClientesMetrics,
    ClienteSucursalOption,
} from '@/interfaces/clientes';
import { exportarClientesCSVAction } from '@/server/actions/clientes/exportar-clientes-action';
import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import SheetClienteDetalle from './SheetClienteDetalle';

interface TablaClientesProps {
    clientes: ClienteResumenRow[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    metrics: ClientesMetrics;
    sucursales: ClienteSucursalOption[];
    isAdmin: boolean;
    filters: ClientesFilters;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

const solesFormatter = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatSoles(value: number): string {
    return `S/ ${solesFormatter.format(value)}`;
}

function getCategoryLabel(categoria: ClienteResumenRow['categoria']): string {
    if (categoria === 'empresa') return 'Empresa';
    if (categoria === 'varios') return 'Público general';
    return 'Persona natural';
}

export default function TablaClientes({
    clientes,
    totalCount,
    currentPage,
    pageSize,
    metrics,
    sucursales,
    isAdmin,
    filters,
}: TablaClientesProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [prevFilterSearch, setPrevFilterSearch] = useState(filters.search || '');
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<ClienteResumenRow | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    if ((filters.search || '') !== prevFilterSearch) {
        setPrevFilterSearch(filters.search || '');
        setSearchInput(filters.search || '');
    }

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, []);

    const navigateWithParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        for (const [key, value] of Object.entries(updates)) {
            if (!value || value === 'all' || (key === 'sortBy' && value === 'ultima_compra')) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }

        const qs = params.toString();
        startTransition(() => {
            router.push(qs ? `/dashboard/clientes?${qs}` : '/dashboard/clientes');
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        searchTimerRef.current = setTimeout(() => {
            navigateWithParams({
                search: value.trim() || null,
                page: '1',
            });
        }, 300);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        navigateWithParams({
            search: searchInput.trim() || null,
            page: '1',
        });
    };

    const handleClearSearch = () => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        setSearchInput('');
        navigateWithParams({
            search: null,
            page: '1',
        });
    };

    const handleClearAllFilters = () => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        setSearchInput('');
        startTransition(() => {
            router.push('/dashboard/clientes');
        });
    };

    const isFiltered = Boolean(
        filters.search ||
            filters.segmento !== 'all' ||
            (isAdmin && filters.sucursalId && filters.sucursalId !== 'all') ||
            filters.sortBy !== 'ultima_compra'
    );

    const handleCopyDoc = (
        e: React.MouseEvent,
        doc: string,
        rowId: string
    ) => {
        e.stopPropagation();
        navigator.clipboard.writeText(doc);
        setCopiedDocId(rowId);
        toast.success(`Documento copiado: ${doc}`);
        setTimeout(() => setCopiedDocId(null), 1800);
    };

    const openDetalle = (cliente: ClienteResumenRow) => {
        setSelectedCliente(cliente);
        setIsDetailOpen(true);
    };

    const handleExportCSV = async () => {
        try {
            setIsExporting(true);
            const res = await exportarClientesCSVAction({
                search: filters.search,
                segmento: filters.segmento,
                sucursalId: filters.sucursalId,
                sortBy: filters.sortBy,
            });

            if (!res.success || !res.csvContent) {
                toast.error(res.error || 'No fue posible exportar la lista de clientes.');
                return;
            }

            const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `clientes_${new Date().toISOString().split('T')[0]}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Listado exportado (${res.count} clientes).`);
        } catch {
            toast.error('Ocurrió un error al descargar el archivo CSV.');
        } finally {
            setIsExporting(false);
        }
    };

    const columns: ColumnDef<typeof features, ClienteResumenRow>[] = useMemo(
        () => [
            {
                accessorKey: 'nombre',
                header: 'Cliente',
                cell: ({ row }) => {
                    const c = row.original;
                    const extraBranches =
                        c.sucursalesNombres.length > 1
                            ? ` (+${c.sucursalesNombres.length - 1})`
                            : '';

                    return (
                        <div className="flex items-start gap-3 py-1 min-w-0">
                            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground mt-0.5">
                                {c.categoria === 'empresa' ? (
                                    <Building2 className="size-4 text-primary" />
                                ) : c.categoria === 'varios' ? (
                                    <Users className="size-4" />
                                ) : (
                                    <User className="size-4" />
                                )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                                <div
                                    className="text-sm font-medium text-foreground truncate"
                                    title={c.nombre}
                                >
                                    {c.nombre}
                                </div>
                                <div className="text-[13px] text-muted-foreground truncate mt-0.5">
                                    {getCategoryLabel(c.categoria)} · {c.sucursalPrincipalNombre}
                                    {extraBranches}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'numeroDocumento',
                header: 'Documento y contacto',
                cell: ({ row }) => {
                    const c = row.original;
                    const isCopied = copiedDocId === c.id;

                    return (
                        <div className="space-y-0.5 py-1">
                            {c.numeroDocumento ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-foreground tabular-nums">
                                        {c.tipoDocumentoNombre
                                            ? `${c.tipoDocumentoNombre} · `
                                            : ''}
                                        {c.numeroDocumento}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) =>
                                            handleCopyDoc(e, c.numeroDocumento!, c.id)
                                        }
                                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color,color] duration-150 cursor-pointer"
                                        aria-label={`Copiar documento de ${c.nombre}`}
                                    >
                                        {isCopied ? (
                                            <Check className="size-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[13px] text-muted-foreground">
                                    Sin documento
                                </span>
                            )}

                            <div className="text-[13px] text-muted-foreground truncate max-w-52 tabular-nums">
                                {c.telefono ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Phone className="size-3 shrink-0" />
                                        {c.telefono}
                                    </span>
                                ) : c.direccion ? (
                                    c.direccion
                                ) : (
                                    'Sin contacto registrado'
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'totalCompras',
                header: () => <div className="text-right">Compras</div>,
                cell: ({ row }) => {
                    const c = row.original;
                    return (
                        <div className="text-right py-1">
                            <div className="text-sm font-medium text-foreground tabular-nums">
                                {c.totalCompras}{' '}
                                {c.totalCompras === 1 ? 'compra' : 'compras'}
                            </div>
                            <div className="text-[13px] text-muted-foreground tabular-nums">
                                {c.totalProductos} uds.
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'totalGastado',
                header: () => <div className="text-right">Total comprado</div>,
                cell: ({ row }) => {
                    const c = row.original;
                    return (
                        <div className="text-right py-1">
                            <div className="text-sm font-semibold text-foreground tabular-nums">
                                {formatSoles(c.totalGastado)}
                            </div>
                            <div className="text-[13px] text-muted-foreground tabular-nums">
                                Prom. {formatSoles(c.ticketPromedio)}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'totalPendiente',
                header: 'Saldo',
                cell: ({ row }) => {
                    const c = row.original;
                    if (c.totalPendiente > 0.009) {
                        return (
                            <div className="py-1">
                                <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-[13px] font-medium text-amber-800 dark:text-amber-300 tabular-nums">
                                    Debe {formatSoles(c.totalPendiente)}
                                </span>
                                <div className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                                    {c.ventasConSaldoCount}{' '}
                                    {c.ventasConSaldoCount === 1
                                        ? 'venta pendiente'
                                        : 'ventas pendientes'}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/12 px-2.5 py-0.5 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                            Al día
                        </span>
                    );
                },
            },
            {
                accessorKey: 'ultimaCompraIso',
                header: 'Última compra',
                cell: ({ row }) => {
                    const c = row.original;
                    return (
                        <div className="py-1">
                            <div className="text-sm text-foreground tabular-nums whitespace-nowrap">
                                {c.ultimaCompraFormateada}
                            </div>
                            <div className="text-[13px] text-muted-foreground tabular-nums">
                                {c.ultimaCompraHora} · {c.metodosPago[0] || 'Efectivo'}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'acciones',
                header: () => <span className="sr-only">Detalle</span>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                openDetalle(row.original);
                            }}
                            className="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                        >
                            <Eye className="size-3.5" />
                            <span>Ver</span>
                        </Button>
                    </div>
                ),
            },
        ],
        [copiedDocId]
    );

    const table = useTable(
        {
            features,
            data: clientes,
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

    const segmentOptions: {
        value: ClienteSegmentoFiltro;
        label: string;
        count: number;
    }[] = [
        { value: 'all', label: 'Todos', count: metrics.totalPerfiles },
        { value: 'empresa', label: 'Empresas', count: metrics.clientesEmpresa },
        { value: 'persona', label: 'Personas', count: metrics.clientesPersona },
        { value: 'con_saldo', label: 'Con saldo', count: metrics.clientesConSaldo },
        { value: 'sin_documento', label: 'Sin documento', count: metrics.clientesSinDocumento },
    ];

    const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Encabezado */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                            Clientes
                        </h1>
                        {isPending && (
                            <Loader2
                                className="size-4 text-primary animate-spin shrink-0"
                                aria-label="Actualizando resultados"
                            />
                        )}
                    </div>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                        {isAdmin
                            ? 'Directorio consolidado de clientes a partir de todas las ventas registradas.'
                            : `Clientes registrados en las ventas de ${sucursales[0]?.nombre || 'tu sucursal'}.`}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllFilters}
                            disabled={isPending}
                            className="h-9 px-3 text-sm gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Limpiar</span>
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={isExporting || totalCount === 0}
                        className="h-9 px-3.5 text-sm font-medium gap-1.5 cursor-pointer"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Exportando...</span>
                            </>
                        ) : (
                            <>
                                <Download className="size-3.5" />
                                <span>Exportar CSV</span>
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* Banda resumen asimétrica sin cajas repetidas */}
            <section
                aria-label="Resumen de clientes"
                className="rounded-xl bg-muted/45 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
                <div className="lg:col-span-5 space-y-1">
                    <div className="text-[13px] font-medium text-muted-foreground">
                        Facturación acumulada en ventas
                    </div>
                    <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                        {formatSoles(metrics.montoTotalVendido)}
                    </div>
                    <p className="text-[13px] text-muted-foreground tabular-nums">
                        {metrics.totalVentasAnalizadas}{' '}
                        {metrics.totalVentasAnalizadas === 1 ? 'venta' : 'ventas'} ·{' '}
                        {metrics.clientesIdentificados} clientes identificados
                        {metrics.ventasPublicoGeneralCount > 0
                            ? ` · ${metrics.ventasPublicoGeneralCount} sin identificar`
                            : ''}
                    </p>
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6">
                    <div className="space-y-0.5">
                        <div className="text-[13px] text-muted-foreground">Recurrentes</div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
                            {metrics.clientesFrecuentes}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            Con 2 o más compras
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <div className="text-[13px] text-muted-foreground">
                            Empresas / Personas
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
                            {metrics.clientesEmpresa} / {metrics.clientesPersona}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            RUC y DNI o nombre
                        </div>
                    </div>

                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <div className="text-[13px] text-muted-foreground">
                            Saldo por cobrar
                        </div>
                        <div
                            className={
                                metrics.montoSaldoPendiente > 0.009
                                    ? 'text-xl sm:text-2xl font-semibold text-amber-700 dark:text-amber-300 tabular-nums'
                                    : 'text-xl sm:text-2xl font-semibold text-foreground tabular-nums'
                            }
                        >
                            {formatSoles(metrics.montoSaldoPendiente)}
                        </div>
                        <div className="text-[13px] text-muted-foreground tabular-nums">
                            {metrics.clientesConSaldo > 0
                                ? `${metrics.clientesConSaldo} ${
                                      metrics.clientesConSaldo === 1 ? 'cliente' : 'clientes'
                                  } con deuda`
                                : 'Sin saldos pendientes'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Controles de filtrado y búsqueda */}
            <section aria-label="Filtros de clientes" className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                        role="tablist"
                        aria-label="Segmentos de clientes"
                        className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted/55 p-1"
                    >
                        {segmentOptions.map((option) => {
                            const active = filters.segmento === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() =>
                                        navigateWithParams({
                                            segmento:
                                                option.value === 'all' ? null : option.value,
                                            page: '1',
                                        })
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-[background-color,color] duration-150 cursor-pointer ${
                                        active
                                            ? 'bg-background text-foreground font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    <span className="tabular-nums opacity-75">
                                        {option.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {!isAdmin && sucursales[0] && (
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-[13px] text-muted-foreground">
                            <Store className="size-3.5" />
                            <span>Sucursal: {sucursales[0].nombre}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Buscar por nombre, DNI, RUC, teléfono o comprobante..."
                            aria-label="Buscar cliente"
                            className="h-10 pl-9 pr-9 text-sm bg-background border-border/80"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {isAdmin && sucursales.length > 0 && (
                            <select
                                aria-label="Filtrar por sucursal"
                                value={filters.sucursalId || 'all'}
                                onChange={(e) =>
                                    navigateWithParams({
                                        sucursalId:
                                            e.target.value === 'all' ? null : e.target.value,
                                        page: '1',
                                    })
                                }
                                className="h-10 rounded-md border border-border/80 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
                            >
                                <option value="all">Todas las sucursales</option>
                                {sucursales.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre}
                                    </option>
                                ))}
                            </select>
                        )}

                        <select
                            aria-label="Ordenar clientes"
                            value={filters.sortBy}
                            onChange={(e) =>
                                navigateWithParams({
                                    sortBy: e.target.value as ClienteOrdenFiltro,
                                    page: '1',
                                })
                            }
                            className="h-10 rounded-md border border-border/80 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
                        >
                            <option value="ultima_compra">Más recientes</option>
                            <option value="mayor_gasto">Mayor total comprado</option>
                            <option value="mas_compras">Más compras</option>
                            <option value="saldo_pendiente">Mayor saldo pendiente</option>
                            <option value="nombre">Nombre (A-Z)</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Vista móvil y tablet (< lg) */}
            <div className="lg:hidden space-y-3">
                {clientes.length > 0 ? (
                    clientes.map((c) => (
                        <div
                            key={c.id}
                            className="rounded-xl bg-muted/40 p-4 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-0.5">
                                    <div className="text-sm font-semibold text-foreground truncate">
                                        {c.nombre}
                                    </div>
                                    <div className="text-[13px] text-muted-foreground tabular-nums">
                                        {getCategoryLabel(c.categoria)}
                                        {c.numeroDocumento
                                            ? ` · ${c.tipoDocumentoNombre || 'Doc.'} ${c.numeroDocumento}`
                                            : ''}
                                    </div>
                                </div>

                                {c.totalPendiente > 0.009 ? (
                                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[13px] font-medium text-amber-800 dark:text-amber-300 tabular-nums shrink-0">
                                        Debe {formatSoles(c.totalPendiente)}
                                    </span>
                                ) : (
                                    <span className="rounded-md bg-emerald-500/12 px-2 py-0.5 text-[13px] font-medium text-emerald-800 dark:text-emerald-300 shrink-0">
                                        Al día
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[13px]">
                                <div>
                                    <div className="text-muted-foreground">Compras</div>
                                    <div className="font-medium text-foreground tabular-nums">
                                        {c.totalCompras} ({c.totalProductos} uds.)
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Gastado</div>
                                    <div className="font-semibold text-foreground tabular-nums">
                                        {formatSoles(c.totalGastado)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Última</div>
                                    <div className="text-foreground tabular-nums">
                                        {c.ultimaCompraFormateada}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-[13px] text-muted-foreground truncate">
                                    {c.telefono || c.sucursalPrincipalNombre}
                                </span>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openDetalle(c)}
                                    className="h-8 px-3 text-[13px] font-medium gap-1.5 cursor-pointer"
                                >
                                    <Eye className="size-3.5" />
                                    <span>Ver historial</span>
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl bg-muted/40 p-8 text-center space-y-2.5">
                        <Users className="size-8 mx-auto text-muted-foreground/60" />
                        <p className="text-[15px] font-medium text-foreground">
                            No hay clientes para mostrar
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {isFiltered
                                ? 'Ningún cliente coincide con los filtros actuales.'
                                : 'Cuando registres ventas con datos de cliente aparecerán aquí automáticamente.'}
                        </p>
                        {isFiltered && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleClearAllFilters}
                                className="h-9 text-sm cursor-pointer"
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Vista escritorio (>= lg) */}
            <div className="hidden lg:block rounded-xl bg-card border border-border/80 overflow-hidden">
                <Table className="min-w-195">
                    <TableHeader className="bg-muted/45">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="h-11 px-4 text-[13px] font-semibold text-foreground"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
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
                                    onClick={() => openDetalle(row.original)}
                                    className="hover:bg-muted/35 transition-[background-color] duration-150 cursor-pointer"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-4 py-3 align-middle">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length}
                                    className="py-12 px-6 text-center"
                                >
                                    <div className="max-w-md mx-auto space-y-2.5">
                                        <Users className="size-8 mx-auto text-muted-foreground/60" />
                                        <p className="text-[15px] font-medium text-foreground">
                                            No hay clientes para mostrar
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isFiltered
                                                ? 'Ningún cliente coincide con los criterios de búsqueda o segmento seleccionados.'
                                                : 'Aún no existen ventas registradas en esta vista para consolidar el listado de clientes.'}
                                        </p>
                                        {isFiltered && (
                                            <div className="pt-1">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleClearAllFilters}
                                                    className="h-9 text-sm cursor-pointer"
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pie de paginación */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <p className="text-[13px] text-muted-foreground tabular-nums">
                        Mostrando {rangeStart}–{rangeEnd} de {totalCount}{' '}
                        {totalCount === 1 ? 'cliente' : 'clientes'}
                    </p>

                    {totalPages > 1 && (
                        <Pagination className="w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage <= 1 || isPending}
                                        onClick={() =>
                                            navigateWithParams({
                                                page: String(currentPage - 1),
                                            })
                                        }
                                        aria-label="Página anterior"
                                        className="h-8 px-2.5 text-[13px] gap-1 cursor-pointer"
                                    >
                                        <ChevronLeft className="size-4" />
                                        <span>Anterior</span>
                                    </Button>
                                </PaginationItem>

                                {showLeftEllipsis && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}

                                {pages.map((pageNumber) => {
                                    const isActive = pageNumber === currentPage;
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <Button
                                                type="button"
                                                variant={isActive ? 'default' : 'ghost'}
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() =>
                                                    navigateWithParams({
                                                        page: String(pageNumber),
                                                    })
                                                }
                                                aria-current={isActive ? 'page' : undefined}
                                                className="h-8 w-8 p-0 text-[13px] tabular-nums cursor-pointer"
                                            >
                                                {pageNumber}
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
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage >= totalPages || isPending}
                                        onClick={() =>
                                            navigateWithParams({
                                                page: String(currentPage + 1),
                                            })
                                        }
                                        aria-label="Página siguiente"
                                        className="h-8 px-2.5 text-[13px] gap-1 cursor-pointer"
                                    >
                                        <span>Siguiente</span>
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            )}

            <SheetClienteDetalle
                cliente={selectedCliente}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}
