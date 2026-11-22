'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Eye,
    FileKey2,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';

import type {
    RucEmpresaRow,
    RucEstadoFiltro,
    RucFacturacionResumen,
    RucOrdenFiltro,
} from '@/interfaces/rucs';
import type { RucEmpresa } from '@/server/schema/ruc';
import {
    deleteRucEmpresaAction,
    setRucPrincipalAction,
    toggleRucEmpresaAction,
} from '@/server/actions/ruc/ruc-actions';
import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import ModalNewRucEmpresa from '../../configuracion/_ui/ModalNewRucEmpresa';
import SheetRucDetalle from './SheetRucDetalle';
import SheetFacturacionForm from './SheetFacturacionForm';

interface TablaRucsProps {
    initialRucs: RucEmpresaRow[];
    isAdmin: boolean;
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

const PAGE_SIZE = 10;

function toRucEmpresaEntity(row: RucEmpresaRow): RucEmpresa {
    return {
        id: row.id,
        numeroRuc: row.numeroRuc,
        nombre: row.nombre,
        razonSocial: row.razonSocial,
        direccionFiscal: row.direccionFiscal,
        telefono: row.telefono,
        email: row.email,
        descripcion: row.descripcion,
        activo: row.activo,
        esPrincipal: row.esPrincipal,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function formatSucursalesPreview(sucursales: RucEmpresaRow['sucursales']): string {
    if (sucursales.length === 0) return 'Sin sucursal asignada';
    if (sucursales.length === 1) return sucursales[0].nombre;
    return `${sucursales[0].nombre} (+${sucursales.length - 1})`;
}

export default function TablaRucs({ initialRucs, isAdmin }: TablaRucsProps) {
    const router = useRouter();

    const [rucs, setRucs] = useState<RucEmpresaRow[]>(initialRucs);
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<RucEstadoFiltro>('all');
    const [sortBy, setSortBy] = useState<RucOrdenFiltro>('principal');
    const [currentPage, setCurrentPage] = useState(1);

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedRucId, setSelectedRucId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [facturacionRucId, setFacturacionRucId] = useState<string | null>(null);
    const [isFacturacionOpen, setIsFacturacionOpen] = useState(false);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRuc, setEditingRuc] = useState<RucEmpresa | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RucEmpresaRow | null>(null);

    // Sincronizar si cambian props del servidor tras router.refresh()
    const [prevInitialRucs, setPrevInitialRucs] = useState(initialRucs);
    if (initialRucs !== prevInitialRucs) {
        setPrevInitialRucs(initialRucs);
        setRucs(initialRucs);
    }

    const selectedRuc = useMemo(
        () => rucs.find((r) => r.id === selectedRucId) ?? null,
        [rucs, selectedRucId]
    );

    const facturacionTargetRuc = useMemo(
        () => rucs.find((r) => r.id === facturacionRucId) ?? null,
        [rucs, facturacionRucId]
    );

    const { execute: executeToggle, status: toggleStatus } = useAction(
        toggleRucEmpresaAction,
        {
            onSuccess: ({ data, input }) => {
                if (data?.ok) {
                    toast.success(data.msg);
                    router.refresh();
                } else {
                    setRucs((prev) =>
                        prev.map((r) =>
                            r.id === input.id ? { ...r, activo: !input.activo } : r
                        )
                    );
                    if (data?.msg) toast.error(data.msg);
                }
            },
            onError: ({ input }) => {
                setRucs((prev) =>
                    prev.map((r) =>
                        r.id === input.id ? { ...r, activo: !input.activo } : r
                    )
                );
                toast.error('No se pudo actualizar el estado del RUC');
            },
        }
    );

    const { execute: executeSetPrincipal, status: principalStatus } = useAction(
        setRucPrincipalAction,
        {
            onSuccess: ({ data }) => {
                if (data?.ok) {
                    toast.success(data.msg);
                    router.refresh();
                } else if (data?.msg) {
                    toast.error(data.msg);
                    router.refresh();
                }
            },
            onError: () => {
                toast.error('No se pudo cambiar el RUC principal');
                router.refresh();
            },
        }
    );

    const { execute: executeDelete, status: deleteStatus } = useAction(
        deleteRucEmpresaAction,
        {
            onSuccess: ({ data, input }) => {
                if (data?.ok) {
                    toast.success(data.msg);
                    setRucs((prev) => prev.filter((r) => r.id !== input.id));
                    if (selectedRucId === input.id) {
                        setIsDetailOpen(false);
                        setSelectedRucId(null);
                    }
                    router.refresh();
                } else if (data?.msg) {
                    toast.error(data.msg);
                }
                setDeleteTarget(null);
            },
            onError: () => {
                toast.error('No se pudo eliminar el RUC');
                setDeleteTarget(null);
            },
        }
    );

    const isMutating =
        toggleStatus === 'executing' ||
        principalStatus === 'executing' ||
        deleteStatus === 'executing';

    const metrics = useMemo(() => {
        const principal = rucs.find((r) => r.esPrincipal) ?? null;
        const activos = rucs.filter((r) => r.activo).length;
        const inactivos = rucs.length - activos;
        const conFacturacion = rucs.filter((r) => Boolean(r.facturacion)).length;
        const sucursalesVinculadas = rucs.reduce(
            (acc, r) => acc + r.sucursales.length,
            0
        );
        const totalComprobantes = rucs.reduce(
            (acc, r) => acc + r.totalComprobantes,
            0
        );
        const totalVentas = rucs.reduce((acc, r) => acc + r.totalVentas, 0);

        return {
            principal,
            total: rucs.length,
            activos,
            inactivos,
            conFacturacion,
            sucursalesVinculadas,
            totalComprobantes,
            totalVentas,
        };
    }, [rucs]);

    const filteredRucs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const filtered = rucs.filter((r) => {
            if (estadoFilter === 'activos' && !r.activo) return false;
            if (estadoFilter === 'inactivos' && r.activo) return false;

            if (!q) return true;

            const matchText = [
                r.numeroRuc,
                r.nombre,
                r.razonSocial ?? '',
                r.direccionFiscal ?? '',
                r.telefono ?? '',
                r.email ?? '',
                r.facturacion?.ubigeo ?? '',
                r.facturacion?.distrito ?? '',
                ...r.sucursales.map((s) => s.nombre),
            ]
                .join(' ')
                .toLowerCase();

            return matchText.includes(q);
        });

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (sortBy === 'nombre') {
                return a.nombre.localeCompare(b.nombre, 'es');
            }
            if (sortBy === 'comprobantes') {
                if (b.totalComprobantes !== a.totalComprobantes) {
                    return b.totalComprobantes - a.totalComprobantes;
                }
                return b.totalVentas - a.totalVentas;
            }
            if (sortBy === 'recientes') {
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            }
            if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
            if (a.activo !== b.activo) return a.activo ? -1 : 1;
            return a.nombre.localeCompare(b.nombre, 'es');
        });

        return sorted;
    }, [rucs, searchQuery, estadoFilter, sortBy]);

    const totalCount = filteredRucs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedRucs = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredRucs.slice(start, start + PAGE_SIZE);
    }, [filteredRucs, safePage]);

    const isFiltered = Boolean(
        searchQuery.trim() || estadoFilter !== 'all' || sortBy !== 'principal'
    );

    const handleCopyRuc = useCallback(
        (e: React.MouseEvent, numeroRuc: string, key: string) => {
            e.stopPropagation();
            navigator.clipboard.writeText(numeroRuc);
            setCopiedId(key);
            toast.success(`RUC ${numeroRuc} copiado`);
            setTimeout(() => setCopiedId(null), 1800);
        },
        []
    );

    const handleOpenDetail = useCallback((row: RucEmpresaRow) => {
        setSelectedRucId(row.id);
        setIsDetailOpen(true);
    }, []);

    const handleOpenCreate = () => {
        setEditingRuc(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = useCallback((row: RucEmpresaRow) => {
        setIsDetailOpen(false);
        setEditingRuc(toRucEmpresaEntity(row));
        setIsFormModalOpen(true);
    }, []);

    const handleOpenFacturacion = useCallback((row: RucEmpresaRow) => {
        setIsDetailOpen(false);
        setFacturacionRucId(row.id);
        setIsFacturacionOpen(true);
    }, []);

    const handleFacturacionSuccess = useCallback(
        (saved: RucFacturacionResumen) => {
            setRucs((prev) =>
                prev.map((r) =>
                    r.id === saved.rucEmpresaId
                        ? { ...r, facturacion: saved }
                        : r
                )
            );
            router.refresh();
        },
        [router]
    );

    const handleToggleActivo = useCallback(
        (row: RucEmpresaRow) => {
            const nextActivo = !row.activo;
            setRucs((prev) =>
                prev.map((r) =>
                    r.id === row.id ? { ...r, activo: nextActivo } : r
                )
            );
            executeToggle({ id: row.id, activo: nextActivo });
        },
        [executeToggle]
    );

    const handleSetPrincipal = useCallback(
        (row: RucEmpresaRow) => {
            if (row.esPrincipal) return;
            setRucs((prev) =>
                prev.map((r) => ({
                    ...r,
                    esPrincipal: r.id === row.id,
                    activo: r.id === row.id ? true : r.activo,
                }))
            );
            executeSetPrincipal({ id: row.id });
        },
        [executeSetPrincipal]
    );

    const handleFormSuccess = (saved: RucEmpresa) => {
        setRucs((prev) => {
            const exists = prev.some((r) => r.id === saved.id);
            const normalized = prev.map((r) =>
                saved.esPrincipal && r.id !== saved.id
                    ? { ...r, esPrincipal: false }
                    : r
            );

            if (exists) {
                return normalized.map((r) =>
                    r.id === saved.id
                        ? {
                              ...r,
                              numeroRuc: saved.numeroRuc,
                              nombre: saved.nombre,
                              razonSocial: saved.razonSocial,
                              direccionFiscal: saved.direccionFiscal,
                              telefono: saved.telefono,
                              email: saved.email,
                              descripcion: saved.descripcion,
                              activo: saved.activo,
                              esPrincipal: saved.esPrincipal,
                              updatedAt: new Date(saved.updatedAt).toISOString(),
                          }
                        : r
                );
            }

            const newRow: RucEmpresaRow = {
                id: saved.id,
                numeroRuc: saved.numeroRuc,
                nombre: saved.nombre,
                razonSocial: saved.razonSocial,
                direccionFiscal: saved.direccionFiscal,
                telefono: saved.telefono,
                email: saved.email,
                descripcion: saved.descripcion,
                activo: saved.activo,
                esPrincipal: saved.esPrincipal,
                createdAt: new Date(saved.createdAt).toISOString(),
                updatedAt: new Date(saved.updatedAt).toISOString(),
                sucursales: [],
                series: [],
                facturacion: null,
                totalVentas: 0,
                totalComprobantes: 0,
                totalCompras: 0,
            };

            return [newRow, ...normalized];
        });
        router.refresh();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setEstadoFilter('all');
        setSortBy('principal');
        setCurrentPage(1);
    };

    const renderRowMenu = useCallback(
        (row: RucEmpresaRow) => (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Acciones para RUC ${row.numeroRuc}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                        />
                    }
                >
                    <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-56"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenuItem
                        onClick={() => handleOpenDetail(row)}
                        className="cursor-pointer"
                    >
                        <Eye className="size-4" />
                        <span>Ver detalle</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={(e) => handleCopyRuc(e, row.numeroRuc, row.id)}
                        className="cursor-pointer"
                    >
                        <Copy className="size-4" />
                        <span>Copiar número de RUC</span>
                    </DropdownMenuItem>

                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleOpenFacturacion(row)}
                                className="cursor-pointer"
                            >
                                <FileKey2 className="size-4" />
                                <span>
                                    {row.facturacion
                                        ? 'Editar datos de facturación'
                                        : 'Agregar datos de facturación'}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleOpenEdit(row)}
                                className="cursor-pointer"
                            >
                                <Pencil className="size-4" />
                                <span>Editar datos del RUC</span>
                            </DropdownMenuItem>

                            {!row.esPrincipal && (
                                <DropdownMenuItem
                                    disabled={isMutating}
                                    onClick={() => handleSetPrincipal(row)}
                                    className="cursor-pointer"
                                >
                                    <Star className="size-4" />
                                    <span>Establecer como principal</span>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                                disabled={isMutating}
                                onClick={() => handleToggleActivo(row)}
                                className="cursor-pointer"
                            >
                                <Power className="size-4" />
                                <span>
                                    {row.activo
                                        ? 'Deshabilitar RUC'
                                        : 'Habilitar RUC'}
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={isMutating}
                                onClick={() => setDeleteTarget(row)}
                                className="cursor-pointer"
                            >
                                <Trash2 className="size-4" />
                                <span>Eliminar RUC</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [
            handleCopyRuc,
            handleOpenDetail,
            handleOpenEdit,
            handleOpenFacturacion,
            handleSetPrincipal,
            handleToggleActivo,
            isAdmin,
            isMutating,
        ]
    );

    const columns: ColumnDef<typeof features, RucEmpresaRow>[] = useMemo(
        () => [
            {
                accessorKey: 'numeroRuc',
                header: 'RUC y razón social',
                cell: ({ row }) => {
                    const r = row.original;
                    const isCopied = copiedId === r.id;
                    const primaryTitle = r.razonSocial || r.nombre;
                    const showAlias =
                        Boolean(r.razonSocial) &&
                        r.razonSocial!.trim().toLowerCase() !==
                            r.nombre.trim().toLowerCase();

                    return (
                        <div className="py-1 min-w-0 max-w-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-foreground tabular-nums">
                                    {r.numeroRuc}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) =>
                                        handleCopyRuc(e, r.numeroRuc, r.id)
                                    }
                                    aria-label={`Copiar RUC ${r.numeroRuc}`}
                                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                    {isCopied ? (
                                        <Check className="size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                </button>
                                {r.esPrincipal && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                        <Star className="size-3 fill-current" />
                                        Principal
                                    </span>
                                )}
                            </div>
                            <div
                                className="text-sm text-foreground truncate"
                                title={primaryTitle}
                            >
                                {primaryTitle}
                            </div>
                            {showAlias && (
                                <div
                                    className="text-[13px] text-muted-foreground truncate"
                                    title={r.nombre}
                                >
                                    {r.nombre}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'direccionFiscal',
                header: 'Dirección fiscal y contacto',
                cell: ({ row }) => {
                    const r = row.original;
                    const contactParts = [r.telefono, r.email].filter(Boolean);

                    return (
                        <div className="py-1 min-w-0 max-w-60 space-y-0.5">
                            <div
                                className={
                                    r.direccionFiscal
                                        ? 'text-sm text-foreground truncate'
                                        : 'text-[13px] text-muted-foreground'
                                }
                                title={r.direccionFiscal || undefined}
                            >
                                {r.direccionFiscal || 'Sin dirección fiscal'}
                            </div>
                            <div className="text-[13px] text-muted-foreground truncate tabular-nums">
                                {contactParts.length > 0
                                    ? contactParts.join(' · ')
                                    : 'Sin contacto registrado'}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'facturacion',
                header: 'Facturación SUNAT',
                cell: ({ row }) => {
                    const r = row.original;
                    const f = r.facturacion;

                    if (f) {
                        const subDetail = [
                            f.ubigeo ? `Ubigeo ${f.ubigeo}` : null,
                            f.usuarioSol ? `SOL: ${f.usuarioSol}` : null,
                        ]
                            .filter(Boolean)
                            .join(' · ');

                        return (
                            <div className="py-1 space-y-0.5 min-w-0 max-w-44">
                                <span
                                    className={
                                        f.produccion
                                            ? 'inline-flex items-center rounded-md bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300'
                                            : 'inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300'
                                    }
                                >
                                    {f.produccion
                                        ? 'Producción'
                                        : 'Pruebas (Beta)'}
                                </span>
                                <div className="text-[13px] text-muted-foreground truncate tabular-nums">
                                    {subDetail || 'Configuración básica'}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className="py-1">
                            {isAdmin ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenFacturacion(r);
                                    }}
                                    className="h-7 -ml-2 px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                                >
                                    <FileKey2 className="size-3.5" />
                                    <span>Configurar</span>
                                </Button>
                            ) : (
                                <span className="text-[13px] text-muted-foreground">
                                    Sin configurar
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'sucursales',
                header: 'Sucursales',
                cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <div className="py-1 min-w-0 max-w-44">
                            <div
                                className={
                                    r.sucursales.length > 0
                                        ? 'text-sm text-foreground truncate'
                                        : 'text-[13px] text-muted-foreground'
                                }
                                title={r.sucursales.map((s) => s.nombre).join(', ')}
                            >
                                {formatSucursalesPreview(r.sucursales)}
                            </div>
                            {r.series.length > 0 && (
                                <div className="text-[13px] text-muted-foreground tabular-nums truncate">
                                    Series: {r.series.map((s) => s.serie).join(', ')}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'totalComprobantes',
                header: () => <div className="text-right">Actividad</div>,
                cell: ({ row }) => {
                    const r = row.original;
                    const hasActivity =
                        r.totalComprobantes > 0 ||
                        r.totalVentas > 0 ||
                        r.totalCompras > 0;

                    if (!hasActivity) {
                        return (
                            <div className="text-right text-[13px] text-muted-foreground py-1">
                                Sin movimientos
                            </div>
                        );
                    }

                    return (
                        <div className="text-right py-1">
                            <div className="text-sm font-medium text-foreground tabular-nums">
                                {r.totalComprobantes}{' '}
                                {r.totalComprobantes === 1
                                    ? 'comprobante'
                                    : 'comprobantes'}
                            </div>
                            <div className="text-[13px] text-muted-foreground tabular-nums">
                                {r.totalVentas}{' '}
                                {r.totalVentas === 1 ? 'venta' : 'ventas'}
                                {r.totalCompras > 0
                                    ? ` · ${r.totalCompras} ${
                                          r.totalCompras === 1
                                              ? 'compra'
                                              : 'compras'
                                      }`
                                    : ''}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'activo',
                header: 'Estado',
                cell: ({ row }) => {
                    const r = row.original;
                    return r.activo ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/12 px-2.5 py-0.5 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                            Activo
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-[13px] font-medium text-muted-foreground">
                            Inactivo
                        </span>
                    );
                },
            },
            {
                id: 'acciones',
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        {renderRowMenu(row.original)}
                    </div>
                ),
            },
        ],
        [copiedId, handleCopyRuc, handleOpenFacturacion, isAdmin, renderRowMenu]
    );

    const table = useTable(
        {
            features,
            data: paginatedRucs,
            columns,
            manualPagination: true,
            rowCount: totalCount,
            state: {
                pagination: {
                    pageIndex: safePage - 1,
                    pageSize: PAGE_SIZE,
                },
            },
        },
        (state) => ({ pagination: state.pagination })
    );

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage: safePage,
        totalPages,
        paginationItemsToDisplay: 3,
    });

    const filterTabs: {
        value: RucEstadoFiltro;
        label: string;
        count: number;
    }[] = [
        { value: 'all', label: 'Todos', count: metrics.total },
        { value: 'activos', label: 'Activos', count: metrics.activos },
        { value: 'inactivos', label: 'Inactivos', count: metrics.inactivos },
    ];

    const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(safePage * PAGE_SIZE, totalCount);

    const deleteHasDependencies = Boolean(
        deleteTarget &&
            (deleteTarget.sucursales.length > 0 ||
                deleteTarget.totalVentas > 0 ||
                deleteTarget.totalComprobantes > 0)
    );

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Encabezado */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                            RUCs emisores
                        </h1>
                        {isMutating && (
                            <Loader2
                                className="size-4 text-primary animate-spin shrink-0"
                                aria-label="Guardando cambios"
                            />
                        )}
                    </div>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                        Razones sociales registradas para emitir comprobantes, configurar credenciales SUNAT y asignar facturación por sucursal.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-9 px-3 text-sm gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Limpiar</span>
                        </Button>
                    )}

                    {isAdmin && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="h-9 px-4 text-sm font-medium gap-1.5 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Registrar RUC</span>
                        </Button>
                    )}
                </div>
            </header>

            {/* Banda resumen asimétrica */}
            <section
                aria-label="Resumen de RUCs emisores"
                className="rounded-xl bg-muted/45 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
                <div className="lg:col-span-5 space-y-1 min-w-0">
                    <div className="text-[13px] font-medium text-muted-foreground">
                        RUC principal de facturación
                    </div>
                    {metrics.principal ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                                    {metrics.principal.numeroRuc}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) =>
                                        handleCopyRuc(
                                            e,
                                            metrics.principal!.numeroRuc,
                                            'summary-principal'
                                        )
                                    }
                                    aria-label={`Copiar RUC principal ${metrics.principal.numeroRuc}`}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {copiedId === 'summary-principal' ? (
                                        <Check className="size-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </button>
                            </div>
                            <p
                                className="text-[13px] text-muted-foreground truncate"
                                title={
                                    metrics.principal.razonSocial ||
                                    metrics.principal.nombre
                                }
                            >
                                {metrics.principal.razonSocial ||
                                    metrics.principal.nombre}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="text-xl font-semibold text-foreground">
                                Sin RUC principal
                            </div>
                            <p className="text-[13px] text-muted-foreground">
                                {rucs.length > 0
                                    ? 'Selecciona un RUC de la tabla para definir el emisor predeterminado.'
                                    : 'Registra tu primera razón social para habilitar la facturación.'}
                            </p>
                        </>
                    )}
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6">
                    <div className="space-y-0.5">
                        <div className="text-[13px] text-muted-foreground">
                            Registrados
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
                            {metrics.total}
                        </div>
                        <div className="text-[13px] text-muted-foreground tabular-nums">
                            {metrics.activos}{' '}
                            {metrics.activos === 1 ? 'activo' : 'activos'} ·{' '}
                            {metrics.conFacturacion} con SUNAT
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <div className="text-[13px] text-muted-foreground">
                            Sucursales vinculadas
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
                            {metrics.sucursalesVinculadas}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            Con RUC predeterminado
                        </div>
                    </div>

                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <div className="text-[13px] text-muted-foreground">
                            Comprobantes emitidos
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
                            {metrics.totalComprobantes}
                        </div>
                        <div className="text-[13px] text-muted-foreground tabular-nums">
                            {metrics.totalVentas}{' '}
                            {metrics.totalVentas === 1
                                ? 'venta vinculada'
                                : 'ventas vinculadas'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Controles de filtrado y búsqueda */}
            <section aria-label="Filtros de RUCs" className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                        role="tablist"
                        aria-label="Filtrar por estado"
                        className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted/55 p-1"
                    >
                        {filterTabs.map((tab) => {
                            const active = estadoFilter === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => {
                                        setEstadoFilter(tab.value);
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150 cursor-pointer ${
                                        active
                                            ? 'bg-background text-foreground font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className="tabular-nums opacity-75">
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por RUC, razón social, nombre comercial, ubigeo, dirección o sucursal..."
                            aria-label="Buscar RUC"
                            className="h-10 pl-9 pr-9 text-sm bg-background border-border/80"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <select
                        aria-label="Ordenar RUCs"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value as RucOrdenFiltro);
                            setCurrentPage(1);
                        }}
                        className="h-10 rounded-md border border-border/80 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
                    >
                        <option value="principal">Principal primero</option>
                        <option value="nombre">Nombre (A–Z)</option>
                        <option value="comprobantes">Más comprobantes</option>
                        <option value="recientes">Más recientes</option>
                    </select>
                </div>
            </section>

            {/* Vista móvil y tablet (< lg) */}
            <div className="lg:hidden space-y-3">
                {paginatedRucs.length > 0 ? (
                    paginatedRucs.map((r) => (
                        <div
                            key={r.id}
                            onClick={() => handleOpenDetail(r)}
                            className="rounded-xl bg-muted/40 p-4 space-y-3 cursor-pointer transition-colors hover:bg-muted/55"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground tabular-nums">
                                            {r.numeroRuc}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleCopyRuc(e, r.numeroRuc, r.id)
                                            }
                                            aria-label={`Copiar RUC ${r.numeroRuc}`}
                                            className="rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {copiedId === r.id ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                        {r.esPrincipal && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                                <Star className="size-3 fill-current" />
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-foreground truncate">
                                        {r.razonSocial || r.nombre}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <span
                                        className={
                                            r.activo
                                                ? 'rounded-md bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300'
                                                : 'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                                        }
                                    >
                                        {r.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {renderRowMenu(r)}
                                </div>
                            </div>

                            {r.direccionFiscal && (
                                <p className="text-[13px] text-muted-foreground truncate">
                                    {r.direccionFiscal}
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 text-[13px]">
                                <div>
                                    <div className="text-muted-foreground">
                                        Facturación
                                    </div>
                                    <div className="font-medium text-foreground truncate">
                                        {r.facturacion
                                            ? r.facturacion.produccion
                                                ? 'Producción'
                                                : 'Pruebas'
                                            : 'Sin configurar'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Sucursales
                                    </div>
                                    <div className="font-medium text-foreground truncate">
                                        {formatSucursalesPreview(r.sucursales)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Actividad
                                    </div>
                                    <div className="font-medium text-foreground tabular-nums">
                                        {r.totalComprobantes} comp.
                                    </div>
                                </div>
                            </div>

                            {isAdmin && !r.facturacion && (
                                <div className="pt-1">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenFacturacion(r);
                                        }}
                                        className="h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer"
                                    >
                                        <FileKey2 className="size-3.5" />
                                        <span>Agregar datos de facturación</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl bg-muted/40 p-8 text-center space-y-2.5">
                        <Building2 className="size-8 mx-auto text-muted-foreground/60" />
                        <p className="text-[15px] font-medium text-foreground">
                            {isFiltered
                                ? 'No se encontraron RUCs'
                                : 'Aún no hay RUCs registrados'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {isFiltered
                                ? 'Ningún registro coincide con la búsqueda o el estado seleccionado.'
                                : 'Registra al menos un RUC emisor para emitir comprobantes desde el punto de venta.'}
                        </p>
                        {isFiltered ? (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-9 text-sm cursor-pointer"
                            >
                                Limpiar filtros
                            </Button>
                        ) : (
                            isAdmin && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleOpenCreate}
                                    className="h-9 text-sm gap-1.5 cursor-pointer"
                                >
                                    <Plus className="size-4" />
                                    <span>Registrar primer RUC</span>
                                </Button>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Vista escritorio (>= lg) */}
            <div className="hidden lg:block rounded-xl bg-card border border-border/80 overflow-hidden">
                <Table className="min-w-220">
                    <TableHeader className="bg-muted/45">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
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
                                    onClick={() => handleOpenDetail(row.original)}
                                    className="hover:bg-muted/35 transition-colors duration-150 cursor-pointer"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="px-4 py-3 align-middle"
                                        >
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
                                        <Building2 className="size-8 mx-auto text-muted-foreground/60" />
                                        <p className="text-[15px] font-medium text-foreground">
                                            {isFiltered
                                                ? 'No se encontraron RUCs'
                                                : 'Aún no hay RUCs registrados'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isFiltered
                                                ? 'Ningún registro coincide con la búsqueda o el estado seleccionado.'
                                                : 'Registra tu primer RUC emisor para vincular sucursales y emitir comprobantes.'}
                                        </p>
                                        <div className="pt-1">
                                            {isFiltered ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleClearFilters}
                                                    className="h-9 text-sm cursor-pointer"
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            ) : (
                                                isAdmin && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={handleOpenCreate}
                                                        className="h-9 text-sm gap-1.5 cursor-pointer"
                                                    >
                                                        <Plus className="size-4" />
                                                        <span>
                                                            Registrar primer RUC
                                                        </span>
                                                    </Button>
                                                )
                                            )}
                                        </div>
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
                        {totalCount === 1 ? 'RUC' : 'RUCs'}
                    </p>

                    {totalPages > 1 && (
                        <Pagination className="w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={safePage <= 1}
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1)
                                            )
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
                                    const isActive = pageNumber === safePage;
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <Button
                                                type="button"
                                                variant={
                                                    isActive ? 'default' : 'ghost'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage(pageNumber)
                                                }
                                                aria-current={
                                                    isActive ? 'page' : undefined
                                                }
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
                                        disabled={safePage >= totalPages}
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
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

            {/* Panel lateral de detalle */}
            <SheetRucDetalle
                ruc={selectedRuc}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                isAdmin={isAdmin}
                onEdit={handleOpenEdit}
                onConfigureFacturacion={handleOpenFacturacion}
                onSetPrincipal={handleSetPrincipal}
                isMutating={isMutating}
            />

            {/* Panel lateral de configuración de facturación SUNAT */}
            {isAdmin && (
                <SheetFacturacionForm
                    ruc={facturacionTargetRuc}
                    open={isFacturacionOpen}
                    onOpenChange={(open) => {
                        setIsFacturacionOpen(open);
                        if (!open) setFacturacionRucId(null);
                    }}
                    onSuccess={handleFacturacionSuccess}
                />
            )}

            {/* Modal de registro y edición de RUC */}
            {isAdmin && (
                <ModalNewRucEmpresa
                    isOpen={isFormModalOpen}
                    onClose={() => {
                        setIsFormModalOpen(false);
                        setEditingRuc(null);
                    }}
                    rucToEdit={editingRuc}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Confirmación de eliminación */}
            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open && deleteStatus !== 'executing') {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar RUC {deleteTarget?.numeroRuc}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteHasDependencies
                                ? `Este RUC (${deleteTarget?.razonSocial || deleteTarget?.nombre}) tiene sucursales, ventas o comprobantes vinculados y no podrá eliminarse. Puedes deshabilitarlo para dejar de emitir con él.`
                                : `Se eliminará permanentemente "${deleteTarget?.razonSocial || deleteTarget?.nombre}" del catálogo de emisores. Esta acción no se puede deshacer.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={deleteStatus === 'executing'}
                            className="cursor-pointer"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        {deleteHasDependencies ? (
                            <AlertDialogAction
                                variant="secondary"
                                disabled={isMutating}
                                onClick={() => {
                                    if (!deleteTarget) return;
                                    if (deleteTarget.activo) {
                                        handleToggleActivo(deleteTarget);
                                    }
                                    setDeleteTarget(null);
                                }}
                                className="cursor-pointer"
                            >
                                {deleteTarget?.activo
                                    ? 'Deshabilitar en su lugar'
                                    : 'Entendido'}
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction
                                variant="destructive"
                                disabled={deleteStatus === 'executing'}
                                onClick={() => {
                                    if (!deleteTarget) return;
                                    executeDelete({ id: deleteTarget.id });
                                }}
                                className="cursor-pointer gap-1.5"
                            >
                                {deleteStatus === 'executing' && (
                                    <Loader2 className="size-3.5 animate-spin" />
                                )}
                                <span>Eliminar</span>
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
