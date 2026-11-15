'use client';

import React, { useMemo, useState, useTransition } from 'react';
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
    Store,
    Building2,
    RotateCcw,
    Search,
    Download,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Loader2,
    X,
    Plus,
    Eye,
    Wallet,
    AlertTriangle,
    CreditCard,
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
    CajaAbiertaTransaccionOption,
    CompraProveedorRow,
    ProveedorFilterOption,
    SucursalFilterOption,
    TransaccionesFilters,
    TransaccionesMetrics,
} from '@/types/proveedor-transacciones-schema';
import { exportarTransaccionesProveedorCSVAction } from '@/server/actions/proveedor/exportar-transacciones-action';
import ModalDetalleCompra from './ModalDetalleCompra';
import ModalPagarCompra from './ModalPagarCompra';

interface TabCounts {
    todas: number;
    pendientes: number;
    pagadas: number;
}

interface TablaTransaccionesProveedorProps {
    items: CompraProveedorRow[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    metrics: TransaccionesMetrics;
    tabCounts: TabCounts;
    proveedores: ProveedorFilterOption[];
    sucursales: SucursalFilterOption[];
    cajasAbiertas: CajaAbiertaTransaccionOption[];
    isAdmin: boolean;
    filters: TransaccionesFilters;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

function formatCurrency(amount: number): string {
    return `S/ ${amount.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export default function TablaTransaccionesProveedor({
    items,
    totalCount,
    currentPage,
    pageSize,
    metrics,
    tabCounts,
    proveedores,
    sucursales,
    cajasAbiertas,
    isAdmin,
    filters,
}: TablaTransaccionesProveedorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [syncedSearch, setSyncedSearch] = useState(filters.search || '');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const [compraDetalle, setCompraDetalle] = useState<CompraProveedorRow | null>(null);
    const [compraToPay, setCompraToPay] = useState<CompraProveedorRow | null>(null);

    if (syncedSearch !== (filters.search || '')) {
        const nextVal = filters.search || '';
        setSyncedSearch(nextVal);
        setSearchInput(nextVal);
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Copiado: ${text}`);
        setTimeout(() => setCopiedId(null), 1600);
    };

    const createQueryString = (
        params: Record<string, string | number | null | undefined>
    ) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(params).forEach(([key, value]) => {
            if (
                value === null ||
                value === '' ||
                value === undefined ||
                value === 'all'
            ) {
                current.delete(key);
            } else {
                current.set(key, String(value));
            }
        });
        return current.toString();
    };

    const navigateWithQuery = (
        params: Record<string, string | number | null | undefined>
    ) => {
        const qs = createQueryString(params);
        startTransition(() => {
            router.push(
                qs
                    ? `/dashboard/proveedores/transacciones?${qs}`
                    : '/dashboard/proveedores/transacciones'
            );
        });
    };

    const handlePageChange = (newPage: number) => {
        navigateWithQuery({ page: newPage });
    };

    const handlePageSizeChange = (newSize: number) => {
        navigateWithQuery({ page: 1, pageSize: newSize });
    };

    const handleDateChange = (type: 'inicio' | 'fin', value: string) => {
        navigateWithQuery({
            page: 1,
            [type === 'inicio' ? 'fechaInicio' : 'fechaFin']: value || null,
        });
    };

    const applyDatePreset = (preset: 'today' | 'week' | 'month') => {
        const formatLocal = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const now = new Date();
        let start = new Date();
        if (preset === 'today') {
            start = new Date(now);
        } else if (preset === 'week') {
            start.setDate(now.getDate() - 6);
        } else if (preset === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        navigateWithQuery({
            page: 1,
            fechaInicio: formatLocal(start),
            fechaFin: formatLocal(now),
        });
    };

    const handleFilterChange = (
        key: 'proveedorId' | 'sucursalId' | 'estado' | 'condicion',
        value: string
    ) => {
        navigateWithQuery({ page: 1, [key]: value });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigateWithQuery({ page: 1, search: searchInput.trim() || null });
    };

    const handleResetFilters = () => {
        setSearchInput('');
        startTransition(() => {
            router.push('/dashboard/proveedores/transacciones');
        });
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const res = await exportarTransaccionesProveedorCSVAction({
                fechaInicio: filters.fechaInicio,
                fechaFin: filters.fechaFin,
                proveedorId: filters.proveedorId,
                sucursalId: filters.sucursalId,
                estado: filters.estado,
                condicion: filters.condicion,
                search: filters.search,
            });

            if (!res.success || !res.csvContent) {
                toast.error(res.error || 'No se pudo generar el archivo CSV.');
                return;
            }

            const blob = new Blob([`\uFEFF${res.csvContent}`], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compras_proveedores_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Se exportaron ${res.count} transacciones a CSV.`);
        } catch {
            toast.error('Ocurrió un error al exportar las transacciones.');
        } finally {
            setIsExporting(false);
        }
    };

    const isFiltered = Boolean(
        filters.fechaInicio ||
        filters.fechaFin ||
        filters.proveedorId !== 'all' ||
        (isAdmin && filters.sucursalId !== 'all') ||
        filters.estado !== 'all' ||
        filters.condicion !== 'all' ||
        filters.search
    );

    const columns = useMemo<ColumnDef<typeof features, CompraProveedorRow>[]>(
        () => [
            {
                accessorKey: 'numeroComprobante',
                header: 'Comprobante / Emisión',
                cell: ({ row }) => {
                    const item = row.original;
                    const isCopied = copiedId === item.id;

                    return (
                        <div className="flex flex-col leading-tight py-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {item.tipoComprobanteNombre}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono font-bold text-xs text-foreground">
                                    {item.numeroComprobante}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        copyToClipboard(item.numeroComprobante, item.id)
                                    }
                                    className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="Copiar número de comprobante"
                                >
                                    {isCopied ? (
                                        <Check className="size-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="size-3" />
                                    )}
                                </button>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                                <Clock className="size-2.5" />
                                {item.fechaEmisionFormateada} • {item.horaEmisionFormateada}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'proveedorNombre',
                header: 'Proveedor y Sede',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col leading-tight max-w-60">
                            <span
                                className="font-semibold text-xs text-foreground truncate"
                                title={item.proveedorNombre}
                            >
                                {item.proveedorNombre}
                            </span>
                            {item.proveedorRazonSocial &&
                                item.proveedorRazonSocial !== item.proveedorNombre && (
                                    <span
                                        className="text-[11px] text-muted-foreground truncate mt-0.5"
                                        title={item.proveedorRazonSocial}
                                    >
                                        {item.proveedorRazonSocial}
                                    </span>
                                )}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                {item.proveedorDocumento && (
                                    <span className="font-mono">
                                        {item.proveedorDocumento}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 truncate">
                                    <Store className="size-2.5 text-primary shrink-0" />
                                    {item.sucursalNombre}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'condicion',
                header: 'Condición / Vencimiento',
                cell: ({ row }) => {
                    const item = row.original;
                    if (!item.isACredito) {
                        return (
                            <div className="text-xs leading-tight">
                                <span className="font-medium text-foreground">Al Contado</span>
                                <span className="block text-[11px] text-muted-foreground mt-0.5">
                                    Pago inmediato en caja
                                </span>
                            </div>
                        );
                    }

                    const isPendiente = item.estado === 'pendiente';
                    const isVencida =
                        isPendiente && item.diasRestantes !== null && item.diasRestantes < 0;
                    const vencePronto =
                        isPendiente &&
                        item.diasRestantes !== null &&
                        item.diasRestantes >= 0 &&
                        item.diasRestantes <= 3;

                    return (
                        <div className="text-xs leading-tight space-y-0.5">
                            <div className="flex items-center gap-1.5">
                                <CreditCard className="size-3 text-muted-foreground shrink-0" />
                                <span className="font-medium text-foreground">
                                    Crédito ({item.numeroDiasCredito || 0}d)
                                </span>
                            </div>
                            {isPendiente ? (
                                isVencida ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                        <AlertTriangle className="size-3 shrink-0" />
                                        Vencida hace {Math.abs(item.diasRestantes!)}d (
                                        {item.fechaVencimientoFormateada})
                                    </span>
                                ) : item.diasRestantes === 0 ? (
                                    <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        Vence hoy ({item.fechaVencimientoFormateada})
                                    </span>
                                ) : vencePronto ? (
                                    <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        Vence en {item.diasRestantes}d (
                                        {item.fechaVencimientoFormateada})
                                    </span>
                                ) : item.fechaVencimientoFormateada ? (
                                    <span className="block text-[11px] text-muted-foreground">
                                        Vence: {item.fechaVencimientoFormateada} (en{' '}
                                        {item.diasRestantes}d)
                                    </span>
                                ) : (
                                    <span className="block text-[11px] text-muted-foreground">
                                        Sin plazo definido
                                    </span>
                                )
                            ) : (
                                <span className="block text-[11px] text-muted-foreground">
                                    Crédito liquidado
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'productos',
                header: 'Detalle Ítems',
                cell: ({ row }) => {
                    const item = row.original;
                    const first = item.items[0];
                    return (
                        <button
                            type="button"
                            onClick={() => setCompraDetalle(item)}
                            className="text-left group cursor-pointer max-w-52"
                        >
                            <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                {first ? first.productoNombre : 'Sin detalle'}
                                {item.itemsCount > 1 && (
                                    <span className="text-muted-foreground font-normal">
                                        {' '}
                                        +{item.itemsCount - 1} más
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {item.itemsCount} {item.itemsCount === 1 ? 'ítem' : 'ítems'} •{' '}
                                {item.totalUnidades} unid.
                            </div>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'monto',
                header: () => <div className="text-right">Importe Total</div>,
                cell: ({ row }) => {
                    const item = row.original;
                    const isPendiente = item.estado === 'pendiente';
                    return (
                        <div className="text-right font-mono font-bold text-xs sm:text-sm tabular-nums whitespace-nowrap">
                            <span
                                className={
                                    isPendiente
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-foreground'
                                }
                            >
                                {formatCurrency(item.monto)}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'estado',
                header: 'Estado',
                cell: ({ row }) => {
                    const item = row.original;
                    const isPendiente = item.estado === 'pendiente';
                    const isVencida =
                        isPendiente && item.diasRestantes !== null && item.diasRestantes < 0;

                    if (isVencida) {
                        return (
                            <Badge className="bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/35 text-[11px] font-semibold">
                                Vencida
                            </Badge>
                        );
                    }
                    if (isPendiente) {
                        return (
                            <Badge className="bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/35 text-[11px] font-semibold">
                                Pendiente
                            </Badge>
                        );
                    }
                    return (
                        <Badge className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold">
                            Pagado
                        </Badge>
                    );
                },
            },
            {
                id: 'acciones',
                header: () => <div className="text-right">Acciones</div>,
                cell: ({ row }) => {
                    const item = row.original;
                    const isPendiente = item.estado === 'pendiente';

                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCompraDetalle(item)}
                                className="h-7.5 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                                title="Ver productos y detalle completo"
                            >
                                <Eye className="size-3.5" />
                                <span className="hidden xl:inline">Detalle</span>
                            </Button>

                            {isPendiente && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setCompraToPay(item)}
                                    className="h-7.5 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                                    title="Registrar pago y generar egreso en caja"
                                >
                                    <Wallet className="size-3.5" />
                                    <span>Pagar</span>
                                </Button>
                            )}
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
        <div className="flex flex-col gap-5 sm:gap-6 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3.5 pb-4 border-b border-border/70">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/dashboard/proveedores" className="hover:text-foreground">
                            Proveedores
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Transacciones</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                            Compras y Pagos a Proveedores
                        </h1>
                        {isPending && (
                            <Loader2 className="size-4 text-primary animate-spin shrink-0" />
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Control de facturas de abastecimiento, obligaciones a crédito pendientes y liquidación desde caja.
                    </p>
                </div>

                {/* Acciones de Cabecera */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            disabled={isPending}
                            className="h-9 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Limpiar</span>
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={isExporting || totalCount === 0}
                        className="h-9 px-3 text-xs gap-1.5 cursor-pointer"
                    >
                        {isExporting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Download className="size-3.5" />
                        )}
                        <span>Exportar CSV</span>
                    </Button>

                    <Link
                        href="/dashboard/inventario/reabastecer"
                        className={buttonVariants({
                            size: 'sm',
                            className: 'h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs',
                        })}
                    >
                        <Plus className="size-4" />
                        <span>Nueva Compra</span>
                    </Link>
                </div>
            </div>

            {/* Franja Consolidada de Posición Financiera */}
            <div className="rounded-xl border border-border/80 bg-card grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/70 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 space-y-1 bg-amber-500/3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Por Pagar (Pendiente)
                    </span>
                    <div
                        className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${metrics.montoPendientePagar > 0
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-foreground'
                            }`}
                    >
                        {formatCurrency(metrics.montoPendientePagar)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {metrics.cantidadPendientes} {metrics.cantidadPendientes === 1 ? 'orden pendiente' : 'órdenes pendientes'}
                        {metrics.cantidadVencidas > 0 && (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {' '}
                                • {metrics.cantidadVencidas} vencidas
                            </span>
                        )}
                    </p>
                </div>

                <div className="p-4 sm:p-5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Total Comprado
                    </span>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">
                        {formatCurrency(metrics.montoTotalComprado)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {metrics.totalTransacciones.toLocaleString('es-PE')} comprobantes en consulta
                    </p>
                </div>

                <div className="p-4 sm:p-5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Total Pagado
                    </span>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(metrics.montoTotalPagado)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {metrics.cantidadPagadas} {metrics.cantidadPagadas === 1 ? 'compra liquidada' : 'compras liquidadas'}
                    </p>
                </div>

                <div className="p-4 sm:p-5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Proveedores con Deuda
                    </span>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">
                        {metrics.proveedoresConDeuda}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Empresas con saldo por liquidar
                    </p>
                </div>
            </div>

            {/* Pestañas de Estado + Filtros Operativos */}
            <div className="space-y-3">
                {/* Segmented Tabs por Estado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-1 self-start overflow-x-auto max-w-full">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('estado', 'all')}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filters.estado === 'all'
                                ? 'bg-background text-foreground shadow-2xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <span>Todas las compras</span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                {tabCounts.todas}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('estado', 'pendiente')}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filters.estado === 'pendiente'
                                ? 'bg-background text-foreground shadow-2xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <span>Pagos pendientes</span>
                            <span
                                className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${tabCounts.pendientes > 0
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                                    : 'text-muted-foreground'
                                    }`}
                            >
                                {tabCounts.pendientes}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('estado', 'pagado')}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filters.estado === 'pagado'
                                ? 'bg-background text-foreground shadow-2xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <span>Pagadas</span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                {tabCounts.pagadas}
                            </span>
                        </button>
                    </div>

                    {/* Atajos rápidos de Fecha */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">
                            Período:
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyDatePreset('today')}
                            className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                            Hoy
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyDatePreset('week')}
                            className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                            Últimos 7 días
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyDatePreset('month')}
                            className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                            Este mes
                        </Button>
                    </div>
                </div>

                {/* Panel Compacto de Filtros */}
                <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 space-y-3 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                        {/* Rango de fechas */}
                        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Calendar className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filters.fechaInicio || ''}
                                    onChange={(e) => handleDateChange('inicio', e.target.value)}
                                    aria-label="Fecha inicial"
                                    className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">a</span>
                            <div className="relative flex-1">
                                <Calendar className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filters.fechaFin || ''}
                                    onChange={(e) => handleDateChange('fin', e.target.value)}
                                    aria-label="Fecha final"
                                    className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Proveedor */}
                        <div className="lg:col-span-3 relative">
                            <Building2 className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                value={filters.proveedorId}
                                onChange={(e) => handleFilterChange('proveedorId', e.target.value)}
                                aria-label="Filtrar por proveedor"
                                className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <option value="all">Todos los proveedores</option>
                                {proveedores.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.numeroDocumento ? `(${p.numeroDocumento})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sucursal */}
                        <div className="lg:col-span-2 relative">
                            <Store className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            {isAdmin ? (
                                <select
                                    value={filters.sucursalId}
                                    onChange={(e) => handleFilterChange('sucursalId', e.target.value)}
                                    aria-label="Filtrar por sucursal"
                                    className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    <option value="all">Todas las sedes</option>
                                    {sucursales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="h-9 rounded-lg border border-border/70 bg-muted/30 pl-8 pr-2.5 flex items-center text-xs font-medium text-foreground truncate">
                                    {sucursales.find((s) => s.id === filters.sucursalId)?.nombre ||
                                        'Sede asignada'}
                                </div>
                            )}
                        </div>

                        {/* Condición Crédito / Contado */}
                        <div className="lg:col-span-3">
                            <select
                                value={filters.condicion}
                                onChange={(e) => handleFilterChange('condicion', e.target.value)}
                                aria-label="Filtrar por condición de pago"
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <option value="all">Condición: Contado y Crédito</option>
                                <option value="credito">Solo compras a Crédito</option>
                                <option value="contado">Solo compras al Contado</option>
                            </select>
                        </div>
                    </div>

                    {/* Barra de Búsqueda */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Buscar por N° comprobante, proveedor, razón social, RUC o usuario..."
                                className="w-full h-9 rounded-lg border border-input bg-background pl-8.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput('');
                                        if (filters.search) {
                                            navigateWithQuery({ page: 1, search: null });
                                        }
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            disabled={isPending}
                            className="h-9 px-4 text-xs font-medium cursor-pointer shrink-0"
                        >
                            Buscar
                        </Button>
                    </form>
                </div>
            </div>

            {/* Contenedor de Tabla y Tarjetas Móviles con Feedback de Transición */}
            <div
                className={`transition-opacity duration-200 ${isPending ? 'opacity-55 pointer-events-none' : 'opacity-100'
                    }`}
            >
                {/* Tabla Escritorio */}
                <div className="hidden md:block rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className="bg-muted/35 hover:bg-muted/35 border-b border-border/70"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
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
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-56 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <p className="text-sm font-semibold text-foreground">
                                                Sin transacciones registradas
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isFiltered
                                                    ? 'Ninguna compra o pago pendiente coincide con los filtros actuales.'
                                                    : 'Aún no existen compras registradas a proveedores en el sistema.'}
                                            </p>
                                            {isFiltered ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleResetFilters}
                                                    className="mt-1 h-8 text-xs gap-1.5 cursor-pointer"
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                    <span>Limpiar filtros</span>
                                                </Button>
                                            ) : (
                                                <Link
                                                    href="/dashboard/inventario/reabastecer"
                                                    className={buttonVariants({
                                                        size: 'sm',
                                                        className: 'mt-1 h-8 text-xs gap-1.5',
                                                    })}
                                                >
                                                    <Plus className="size-3.5" />
                                                    <span>Registrar primera compra</span>
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => {
                                    const orig = row.original;
                                    const isPendiente = orig.estado === 'pendiente';
                                    const isVencida =
                                        isPendiente &&
                                        orig.diasRestantes !== null &&
                                        orig.diasRestantes < 0;

                                    return (
                                        <TableRow
                                            key={row.id}
                                            className={`border-b border-border/50 last:border-0 transition-colors ${isVencida
                                                ? 'bg-rose-500/2.5 hover:bg-rose-500/5'
                                                : isPendiente
                                                    ? 'bg-amber-500/2 hover:bg-amber-500/4.5'
                                                    : 'hover:bg-muted/25'
                                                }`}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className="py-3 px-4 align-middle"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Vista Tarjetas Móvil (<md) */}
                <div className="md:hidden space-y-2.5">
                    {items.length === 0 ? (
                        <div className="rounded-xl border border-border/80 bg-card p-6 text-center space-y-2.5">
                            <p className="text-sm font-semibold text-foreground">
                                Sin transacciones registradas
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'Ninguna compra o pago pendiente coincide con los filtros actuales.'
                                    : 'No hay compras registradas aún.'}
                            </p>
                            {isFiltered ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-8 text-xs gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Limpiar filtros</span>
                                </Button>
                            ) : (
                                <Link
                                    href="/dashboard/inventario/reabastecer"
                                    className={buttonVariants({
                                        size: 'sm',
                                        className: 'h-8 text-xs gap-1.5',
                                    })}
                                >
                                    <Plus className="size-3.5" />
                                    <span>Registrar compra</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        items.map((item) => {
                            const isPendiente = item.estado === 'pendiente';
                            const isVencida =
                                isPendiente &&
                                item.diasRestantes !== null &&
                                item.diasRestantes < 0;

                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-xl border bg-card p-3.5 space-y-2.5 shadow-2xs ${isVencida
                                        ? 'border-rose-500/40'
                                        : isPendiente
                                            ? 'border-amber-500/40'
                                            : 'border-border/80'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                {item.tipoComprobanteNombre}
                                            </span>
                                            <div className="font-mono font-bold text-sm text-foreground">
                                                {item.numeroComprobante}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {item.fechaEmisionFormateada} • {item.sucursalNombre}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 space-y-1">
                                            <div className="font-mono font-bold text-sm tabular-nums text-foreground">
                                                {formatCurrency(item.monto)}
                                            </div>
                                            <Badge
                                                className={
                                                    isVencida
                                                        ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/35 text-[10px]'
                                                        : isPendiente
                                                            ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/35 text-[10px]'
                                                            : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]'
                                                }
                                            >
                                                {isVencida
                                                    ? 'Vencida'
                                                    : isPendiente
                                                        ? 'Pendiente'
                                                        : 'Pagado'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="text-xs border-t border-border/50 pt-2 space-y-1">
                                        <div className="font-semibold text-foreground truncate">
                                            {item.proveedorNombre}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                            <span>
                                                {item.isACredito
                                                    ? `Crédito ${item.numeroDiasCredito || 0}d${item.fechaVencimientoFormateada ? ` • Vence ${item.fechaVencimientoFormateada}` : ''}`
                                                    : 'Al Contado'}
                                            </span>
                                            <span className="font-mono">
                                                {item.itemsCount} ítems ({item.totalUnidades} unid.)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCompraDetalle(item)}
                                            className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Detalle</span>
                                        </Button>
                                        {isPendiente && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setCompraToPay(item)}
                                                className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                                            >
                                                <Wallet className="size-3.5" />
                                                <span>Pagar</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Paginación en Servidor */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                            Mostrando{' '}
                            <strong className="font-mono text-foreground">
                                {(currentPage - 1) * pageSize + 1}
                            </strong>
                            –
                            <strong className="font-mono text-foreground">
                                {Math.min(currentPage * pageSize, totalCount)}
                            </strong>{' '}
                            de{' '}
                            <strong className="font-mono text-foreground">
                                {totalCount.toLocaleString('es-PE')}
                            </strong>{' '}
                            registros
                        </span>

                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            aria-label="Filas por página"
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                        >
                            {[10, 15, 30, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size} / pág
                                </option>
                            ))}
                        </select>
                    </div>

                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    type="button"
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

                            {pages.map((p) => (
                                <PaginationItem key={p}>
                                    <Button
                                        type="button"
                                        variant={p === currentPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(p)}
                                        disabled={isPending}
                                        className="h-8 w-8 p-0 text-xs font-mono cursor-pointer"
                                    >
                                        {p}
                                    </Button>
                                </PaginationItem>
                            ))}

                            {showRightEllipsis && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}

                            <PaginationItem>
                                <Button
                                    type="button"
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
            )}

            {/* Modal Detalle de Productos de Compra */}
            <ModalDetalleCompra
                compra={compraDetalle}
                onClose={() => setCompraDetalle(null)}
                onRequestPay={(c) => setCompraToPay(c)}
            />

            {/* Modal Pago de Compra Pendiente */}
            <ModalPagarCompra
                key={compraToPay?.id || 'closed'}
                compra={compraToPay}
                cajasAbiertas={cajasAbiertas}
                onClose={() => setCompraToPay(null)}
                onSuccess={() => {
                    startTransition(() => {
                        router.refresh();
                    });
                }}
            />
        </div>
    );
}
