'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Building2,
    Search,
    Plus,
    X,
    MoreHorizontal,
    Eye,
    Edit3,
    Trash2,
    Copy,
    Check,
    Phone,
    Mail,
    MapPin,
    Package,
    Power,
    CheckCircle2,
    XCircle,
    Boxes,
    Building
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { toggleProveedorAction } from '@/server/actions/proveedor/toggle-proveedor-action';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProveedorWithProductCount } from '@/interfaces';
import ModalProveedorForm from './ModalProveedorForm';
import ModalDeleteProveedor from './ModalDeleteProveedor';
import SheetProveedorDetalle from './SheetProveedorDetalle';

interface StatsProps {
    total: number;
    activos: number;
    inactivos: number;
    conProductos: number;
}

interface TableProveedoresProps {
    proveedores: ProveedorWithProductCount[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchQuery: string;
    estadoFilter: string;
    stats: StatsProps;
}

export default function TableProveedores({
    proveedores,
    totalCount,
    currentPage,
    pageSize,
    searchQuery,
    estadoFilter,
    stats,
}: TableProveedoresProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Estado local para input de búsqueda
    const [searchInput, setSearchInput] = useState(searchQuery);

    // Modales y drawers
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState<ProveedorWithProductCount | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [proveedorToDelete, setProveedorToDelete] = useState<ProveedorWithProductCount | null>(null);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<ProveedorWithProductCount | null>(null);

    // Estado para feedback de copia
    const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

    // Safe Action para alternar estado activo/inactivo
    const { execute: executeToggle } = useAction(toggleProveedorAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg);
                router.refresh();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error al actualizar el estado del proveedor');
        },
    });

    const createQueryString = (params: Record<string, string | number | null>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '' || value === undefined) {
                current.delete(key);
            } else {
                current.set(key, String(value));
            }
        });
        return current.toString();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            router.push(`/dashboard/proveedores?${createQueryString({ page: 1, search: searchInput.trim() })}`);
        });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        startTransition(() => {
            router.push(`/dashboard/proveedores?${createQueryString({ page: 1, search: null })}`);
        });
    };

    const handleFilterEstado = (nuevoEstado: string) => {
        startTransition(() => {
            router.push(
                `/dashboard/proveedores?${createQueryString({
                    page: 1,
                    estado: nuevoEstado === 'all' ? null : nuevoEstado,
                })}`
            );
        });
    };

    const handlePageChange = (newPage: number) => {
        startTransition(() => {
            router.push(`/dashboard/proveedores?${createQueryString({ page: newPage })}`);
        });
    };

    const handlePageSizeChange = (newSize: string) => {
        startTransition(() => {
            router.push(`/dashboard/proveedores?${createQueryString({ page: 1, pageSize: newSize })}`);
        });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedDoc(text);
        toast.success(`${label} copiado al portapapeles`);
        setTimeout(() => setCopiedDoc(null), 1800);
    };

    const openCreateModal = () => {
        setProveedorToEdit(null);
        setIsFormOpen(true);
    };

    const openEditModal = (prov: ProveedorWithProductCount) => {
        setProveedorToEdit(prov);
        setIsFormOpen(true);
    };

    const openDeleteModal = (prov: ProveedorWithProductCount) => {
        setProveedorToDelete(prov);
        setIsDeleteOpen(true);
    };

    const openSheetDetails = (prov: ProveedorWithProductCount) => {
        setSelectedProveedor(prov);
        setIsSheetOpen(true);
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return (
        <div className="space-y-6">
            {/* Cabecera Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Proveedores
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control de empresas abastecedoras, documentos tributarios y productos asociados.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 shadow-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        <span>Nuevo Proveedor</span>
                    </Button>
                </div>
            </div>

            {/* Fila de Métricas Clave */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Total Proveedores</span>
                        <Building2 className="size-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">
                        {stats.total}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Registrados en el sistema
                    </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Activos Operativos</span>
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {stats.activos}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Habilitados para compras
                    </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Inactivos</span>
                        <XCircle className="size-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-muted-foreground tabular-nums">
                        {stats.inactivos}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Pausados temporalmente
                    </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Con Productos</span>
                        <Boxes className="size-4 text-primary" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">
                        {stats.conProductos}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Proveedores en catálogo activo
                    </span>
                </div>
            </div>

            {/* Barra de Filtros, Búsqueda y Pestañas de Estado */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Pestañas de Estado */}
                <div className="inline-flex rounded-lg border border-border/70 bg-muted/30 p-1 self-start">
                    <button
                        type="button"
                        onClick={() => handleFilterEstado('all')}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${estadoFilter === 'all'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Todos ({stats.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterEstado('activo')}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${estadoFilter === 'activo'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Activos ({stats.activos})
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterEstado('inactivo')}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${estadoFilter === 'inactivo'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Inactivos ({stats.inactivos})
                    </button>
                </div>

                {/* Formulario de Búsqueda */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-2 w-full lg:w-auto"
                >
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Buscar por nombre, RUC, contacto..."
                            className="w-full rounded-lg border border-border/80 bg-background pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                title="Limpiar búsqueda"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        className="text-xs cursor-pointer shrink-0"
                    >
                        Buscar
                    </Button>
                </form>
            </div>

            {/* Tabla de Proveedores */}
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/70">
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground min-w-55">
                                Proveedor / Razón Social
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground min-w-35">
                                RUC / Documento
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground min-w-45">
                                Contacto
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground min-w-40">
                                Dirección
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground text-center min-w-25">
                                Catálogo
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground min-w-27.5">
                                Estado
                            </TableHead>
                            <TableHead className="py-3 px-4 font-semibold text-xs text-foreground text-right min-w-20">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {proveedores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-center py-6">
                                        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                            <Building className="size-6 stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {searchQuery || estadoFilter !== 'all'
                                                ? 'No se encontraron proveedores'
                                                : 'Aún no hay proveedores registrados'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {searchQuery || estadoFilter !== 'all'
                                                ? `No hay proveedores que coincidan con los filtros aplicados.`
                                                : 'Comienza registrando tu primer proveedor para asociarlo a tus compras y catálogo.'}
                                        </p>
                                        <div className="pt-2">
                                            {searchQuery || estadoFilter !== 'all' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSearchInput('');
                                                        router.push('/dashboard/proveedores');
                                                    }}
                                                    className="text-xs cursor-pointer"
                                                >
                                                    Restablecer filtros
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={openCreateModal}
                                                    className="text-xs cursor-pointer gap-1.5"
                                                >
                                                    <Plus className="size-3.5" />
                                                    <span>Registrar Primer Proveedor</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            proveedores.map((prov) => {
                                const isActivo = Boolean(prov.activo);
                                return (
                                    <TableRow
                                        key={prov.id}
                                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${!isActivo ? 'opacity-70 bg-muted/10' : ''
                                            }`}
                                    >
                                        {/* Proveedor / Razón Social */}
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => openSheetDetails(prov)}
                                                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs select-none hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                                                    title={`Ver ficha de ${prov.nombre}`}
                                                >
                                                    {prov.nombre[0]?.toUpperCase() || 'P'}
                                                </button>
                                                <div className="min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => openSheetDetails(prov)}
                                                        className="font-semibold text-xs text-foreground hover:underline capitalize text-left block truncate max-w-50 cursor-pointer"
                                                        title={prov.nombre}
                                                    >
                                                        {prov.nombre}
                                                    </button>
                                                    {prov.razonSocial ? (
                                                        <span
                                                            className="text-[11px] text-muted-foreground block truncate max-w-50 capitalize"
                                                            title={prov.razonSocial}
                                                        >
                                                            {prov.razonSocial}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground/60 italic block">
                                                            Sin razón social
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* RUC / Documento */}
                                        <TableCell className="py-3 px-4">
                                            {prov.numeroDocumento ? (
                                                <div className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums bg-muted/40 px-2 py-1 rounded-md border border-border/60">
                                                    <span className="text-foreground font-medium">
                                                        {prov.numeroDocumento}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(prov.numeroDocumento!, 'RUC')
                                                        }
                                                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                        title="Copiar número de documento"
                                                    >
                                                        {copiedDoc === prov.numeroDocumento ? (
                                                            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <Copy className="size-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/60 italic">
                                                    No registrado
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Contacto (Teléfono y Email) */}
                                        <TableCell className="py-3 px-4">
                                            <div className="space-y-1">
                                                {prov.telefono ? (
                                                    <a
                                                        href={`tel:${prov.telefono}`}
                                                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                                                        title="Llamar"
                                                    >
                                                        <Phone className="size-3 shrink-0" />
                                                        <span>{prov.telefono}</span>
                                                    </a>
                                                ) : null}

                                                {prov.email ? (
                                                    <a
                                                        href={`mailto:${prov.email}`}
                                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-42.5"
                                                        title={prov.email}
                                                    >
                                                        <Mail className="size-3 shrink-0" />
                                                        <span className="truncate">{prov.email}</span>
                                                    </a>
                                                ) : null}

                                                {!prov.telefono && !prov.email && (
                                                    <span className="text-xs text-muted-foreground/60 italic">
                                                        Sin contacto
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Dirección */}
                                        <TableCell className="py-3 px-4">
                                            {prov.direccion ? (
                                                <div
                                                    className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-45 line-clamp-2 capitalize"
                                                    title={prov.direccion}
                                                >
                                                    <MapPin className="size-3 shrink-0 mt-0.5 text-muted-foreground/70" />
                                                    <span>{prov.direccion}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/60 italic">
                                                    Sin dirección
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Catálogo / Productos Asociados */}
                                        <TableCell className="py-3 px-4 text-center">
                                            <Badge
                                                variant="secondary"
                                                className="text-[11px] font-normal tabular-nums gap-1"
                                            >
                                                <Package className="size-3" />
                                                <span>{prov.totalProductos}</span>
                                            </Badge>
                                        </TableCell>

                                        {/* Estado (Switch / Badge) */}
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={isActivo}
                                                    onCheckedChange={(checked) => {
                                                        executeToggle({ id: prov.id, activo: checked });
                                                    }}
                                                    size="sm"
                                                    title={isActivo ? 'Desactivar proveedor' : 'Activar proveedor'}
                                                />
                                                <span
                                                    className={`text-xs font-medium ${isActivo
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {isActivo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="py-3 px-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                                    aria-label="Abrir opciones"
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                                            Opciones
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => openSheetDetails(prov)}
                                                            className="gap-2 text-xs cursor-pointer"
                                                        >
                                                            <Eye className="size-3.5" />
                                                            <span>Ver Ficha Completa</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(prov)}
                                                            className="gap-2 text-xs cursor-pointer"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                            <span>Editar Proveedor</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                executeToggle({ id: prov.id, activo: !isActivo });
                                                            }}
                                                            className="gap-2 text-xs cursor-pointer"
                                                        >
                                                            <Power className="size-3.5" />
                                                            <span>
                                                                {isActivo ? 'Desactivar' : 'Activar'}
                                                            </span>
                                                        </DropdownMenuItem>
                                                        {prov.numeroDocumento && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleCopy(prov.numeroDocumento!, 'RUC')
                                                                }
                                                                className="gap-2 text-xs cursor-pointer"
                                                            >
                                                                <Copy className="size-3.5" />
                                                                <span>Copiar RUC</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuGroup>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteModal(prov)}
                                                            className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            <span>Eliminar</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación y Resumen de Registros */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                    <span>Mostrando</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                            if (val) handlePageSizeChange(val);
                        }}
                    >
                        <SelectTrigger className="h-8 w-18 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>
                        de <strong className="text-foreground font-medium">{totalCount}</strong> proveedores
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1 || isPending}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="h-8 text-xs px-2.5 cursor-pointer disabled:opacity-40"
                        >
                            Anterior
                        </Button>
                        <span className="px-2 text-xs font-medium text-foreground">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages || isPending}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="h-8 text-xs px-2.5 cursor-pointer disabled:opacity-40"
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </div>

            {/* Modales y Drawer */}
            <ModalProveedorForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                proveedorToEdit={proveedorToEdit}
                onSuccess={() => {
                    router.refresh();
                }}
            />

            <ModalDeleteProveedor
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                proveedor={proveedorToDelete}
                onSuccess={() => {
                    router.refresh();
                }}
            />

            <SheetProveedorDetalle
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                proveedor={selectedProveedor}
                onEdit={(prov) => {
                    openEditModal(prov);
                }}
                onToggleStatus={(prov) => {
                    executeToggle({ id: prov.id, activo: !prov.activo });
                    setSelectedProveedor((prev) =>
                        prev ? { ...prev, activo: !prev.activo } : null
                    );
                }}
            />
        </div>
    );
}