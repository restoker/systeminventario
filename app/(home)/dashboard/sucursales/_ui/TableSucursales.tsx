'use client';

import React, { useId, useMemo, useState } from 'react';
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
    ChevronLeftIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    CopyIcon,
    CheckCircle2Icon,
    XCircleIcon,
    XIcon,
    EyeIcon,
    PhoneIcon,
    MailIcon,
    MapPinIcon,
    Building2Icon,
    PlusIcon,
    EditIcon,
    CalendarIcon,
    FileTextIcon,
    BoxesIcon,
    PowerIcon,
    CheckIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';

import { Sucursal } from '@/interfaces';
import { usePagination } from '@/hooks/use-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toggleSucursalAction } from '@/server/actions/sucursal/toggle-sucursal-action';
import ModalSucursalForm from './ModalSucursalForm';
// import { useSearchParams } from 'next/navigation';

interface TableSucursalesProps {
    sucursales: Sucursal[];
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
    paginatedRowModel: createPaginatedRowModel()
});

export default function TableSucursales({ sucursales }: TableSucursalesProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    // const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const searchInputId = useId();

    const { execute: executeToggle, status: toggleStatus } = useAction(toggleSucursalAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                if (selectedSucursal && data.sucursal) {
                    setSelectedSucursal(prev => prev ? { ...prev, activo: data.sucursal.activo } : null);
                }
            } else {
                toast.error(data?.msg || 'Error al cambiar estado');
            }
        },
        onError: () => {
            toast.error('Error al actualizar el estado de la sucursal');
        }
    });

    const isToggling = toggleStatus === 'executing';

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`${label} copiado al portapapeles`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleOpenCreateModal = () => {
        // setEditingSucursal(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (sucursal: Sucursal) => {
        // setEditingSucursal(sucursal);
        setIsFormModalOpen(true);
    };

    // Live filtering by search query & active status
    const filteredData = useMemo(() => {
        return sucursales.filter(item => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !query ||
                item.nombre.toLowerCase().includes(query) ||
                item.codigo.toLowerCase().includes(query) ||
                item.direccion.toLowerCase().includes(query) ||
                (item.telefono && item.telefono.toLowerCase().includes(query)) ||
                (item.ruc && item.ruc.includes(query)) ||
                (item.email && item.email.toLowerCase().includes(query)) ||
                (item.razonSocial && item.razonSocial.toLowerCase().includes(query));

            const isActive = item.activo ?? true;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && isActive) ||
                (statusFilter === 'inactive' && !isActive);

            return matchesSearch && matchesStatus;
        });
    }, [sucursales, searchQuery, statusFilter]);

    const columns = useMemo<ColumnDef<typeof features, Sucursal>[]>(
        () => [
            {
                accessorKey: 'nombre',
                header: 'Sucursal / Sede',
                cell: ({ row }) => {
                    const item = row.original;
                    const initialLetter = item.nombre.trim().charAt(0).toUpperCase() || 'S';

                    return (
                        <div className='flex items-center gap-3 py-1'>
                            <div className='size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20'>
                                {initialLetter}
                            </div>
                            <div className='flex flex-col min-w-0'>
                                <button
                                    type='button'
                                    onClick={() => setSelectedSucursal(item)}
                                    className='text-sm font-semibold text-foreground hover:underline cursor-pointer text-left truncate max-w-44 sm:max-w-64 capitalize'
                                    title={item.nombre}
                                >
                                    {item.nombre}
                                </button>
                                <span className='text-xs text-muted-foreground truncate max-w-44 sm:max-w-60' title={item.razonSocial || item.direccion}>
                                    {item.razonSocial ? item.razonSocial : item.direccion}
                                </span>
                            </div>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'codigo',
                header: 'Código',
                cell: ({ row }) => {
                    const code = row.original.codigo;
                    return (
                        <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border uppercase'>
                                {code}
                            </span>
                            <button
                                type='button'
                                onClick={() => copyToClipboard(code, 'Código')}
                                className='p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                                title='Copiar código'
                            >
                                <CopyIcon className='size-3' />
                            </button>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'direccion',
                header: 'Dirección',
                cell: ({ row }) => {
                    const address = row.original.direccion;
                    return (
                        <div className='flex items-start gap-1.5 text-xs text-muted-foreground max-w-56 sm:max-w-72'>
                            <MapPinIcon className='size-3.5 text-muted-foreground/70 shrink-0 mt-0.5' />
                            <span className='line-clamp-2 text-foreground/90' title={address}>
                                {address}
                            </span>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'telefono',
                header: 'Contacto',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className='flex flex-col gap-0.5 text-xs'>
                            {item.telefono ? (
                                <div className='flex items-center gap-1.5 text-foreground/90'>
                                    <PhoneIcon className='size-3 text-muted-foreground shrink-0' />
                                    <span>{item.telefono}</span>
                                </div>
                            ) : (
                                <span className='text-muted-foreground'>No registrado</span>
                            )}
                            {item.email && (
                                <div className='flex items-center gap-1.5 text-muted-foreground truncate max-w-44' title={item.email}>
                                    <MailIcon className='size-3 shrink-0' />
                                    <span className='truncate'>{item.email}</span>
                                </div>
                            )}
                        </div>
                    );
                }
            },
            {
                accessorKey: 'ruc',
                header: 'RUC / Fiscal',
                cell: ({ row }) => {
                    const ruc = row.original.ruc;
                    return ruc ? (
                        <span className='text-xs font-medium text-foreground/90'>
                            {ruc}
                        </span>
                    ) : (
                        <span className='text-xs text-muted-foreground'>No registrado</span>
                    );
                }
            },
            {
                accessorKey: 'activo',
                header: 'Estado',
                cell: ({ row }) => {
                    const isActive = row.original.activo ?? true;
                    return isActive ? (
                        <Badge
                            variant='outline'
                            className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium gap-1'
                        >
                            <CheckCircle2Icon className='size-3 text-emerald-500' />
                            Activa
                        </Badge>
                    ) : (
                        <Badge
                            variant='outline'
                            className='bg-muted text-muted-foreground border-border text-xs font-medium gap-1'
                        >
                            <XCircleIcon className='size-3 text-muted-foreground' />
                            Inactiva
                        </Badge>
                    );
                }
            },
            {
                id: 'actions',
                header: () => <span className='sr-only'>Acciones</span>,
                cell: ({ row }) => {
                    const sucursal = row.original;
                    const isActive = sucursal.activo ?? true;

                    return (
                        <div className='flex justify-end'>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            size='icon-sm'
                                            variant='ghost'
                                            className='cursor-pointer text-muted-foreground hover:text-foreground size-8'
                                            aria-label='Opciones de sucursal'
                                        />
                                    }
                                >
                                    <EllipsisVerticalIcon className='size-4' aria-hidden='true' />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end' className='w-48'>
                                    <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
                                        Opciones
                                    </DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onClick={() => setSelectedSucursal(sucursal)}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <EyeIcon className='size-3.5 text-muted-foreground' />
                                            <span>Ver detalles</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleOpenEditModal(sucursal)}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <EditIcon className='size-3.5 text-muted-foreground' />
                                            <span>Editar sucursal</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => copyToClipboard(sucursal.codigo, 'Código')}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <CopyIcon className='size-3.5 text-muted-foreground' />
                                            <span>Copiar código</span>
                                        </DropdownMenuItem>
                                        {sucursal.ruc && (
                                            <DropdownMenuItem
                                                onClick={() => copyToClipboard(sucursal.ruc!, 'RUC')}
                                                className='cursor-pointer gap-2 text-xs'
                                            >
                                                <FileTextIcon className='size-3.5 text-muted-foreground' />
                                                <span>Copiar RUC</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onClick={() => executeToggle({ id: sucursal.id, activo: !isActive })}
                                            disabled={isToggling}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <PowerIcon className={`size-3.5 ${isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                                            <span>{isActive ? 'Desactivar sede' : 'Activar sede'}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                enableHiding: false
            }
        ],
        [isToggling, executeToggle]
    );

    const table = useTable(
        {
            features,
            data: filteredData,
            columns,
            initialState: {
                pagination: { pageIndex: 0, pageSize: 8 }
            }
        },
        state => ({ pagination: state.pagination })
    );

    const { pageIndex, pageSize } = table.state.pagination;

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage: pageIndex + 1,
        totalPages: table.getPageCount(),
        paginationItemsToDisplay: 2
    });

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        table.setPageIndex(0);
    };

    return (
        <>
            <div data-ui className='w-full rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden'>
                {/* Control bar: Search, Filter, Page size, New branch action */}
                <div data-ui className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b bg-card/60'>
                    <div className='flex flex-wrap items-center gap-2.5 flex-1'>
                        {/* Search Input */}
                        <div className='relative w-full sm:w-72'>
                            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                            <Input
                                id={searchInputId}
                                type='text'
                                placeholder='Buscar por nombre, código, RUC, dirección...'
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    table.setPageIndex(0);
                                }}
                                className='pl-9 pr-8 h-9 text-xs sm:text-sm'
                            />
                            {searchQuery && (
                                <button
                                    type='button'
                                    onClick={() => setSearchQuery('')}
                                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
                                    aria-label='Borrar búsqueda'
                                >
                                    <XIcon className='size-3.5' />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={val => {
                                setStatusFilter(val as 'all' | 'active' | 'inactive');
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className='w-[145px] h-9 text-xs cursor-pointer'>
                                <SelectValue placeholder='Estado' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Todos los estados</SelectItem>
                                <SelectItem value='active'>Sedes activas</SelectItem>
                                <SelectItem value='inactive'>Sedes inactivas</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters Button (shown only when active) */}
                        {(searchQuery || statusFilter !== 'all') && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={resetFilters}
                                className='h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5'
                            >
                                <XIcon className='size-3.5' />
                                <span>Restablecer</span>
                            </Button>
                        )}
                    </div>

                    {/* Right Toolbar Actions */}
                    <div className='flex items-center gap-2.5 shrink-0 justify-between sm:justify-end'>
                        {/* Page Size Selector */}
                        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <span>Filas:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={val => {
                                    table.setPageSize(Number(val));
                                    table.setPageIndex(0);
                                }}
                            >
                                <SelectTrigger className='w-[70px] h-9 text-xs cursor-pointer'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='5'>5</SelectItem>
                                    <SelectItem value='8'>8</SelectItem>
                                    <SelectItem value='10'>10</SelectItem>
                                    <SelectItem value='20'>20</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* New Branch Button */}
                        <Button
                            onClick={handleOpenCreateModal}
                            className='h-9 gap-1.5 shadow-xs cursor-pointer text-xs font-medium'
                        >
                            <PlusIcon className='size-3.5' />
                            <span>Nueva Sucursal</span>
                        </Button>
                    </div>
                </div>

                {/* Table Container */}
                <div className='overflow-x-auto'>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id} className='bg-muted/30 hover:bg-muted/30'>
                                    {headerGroup.headers.map(header => (
                                        <TableHead
                                            key={header.id}
                                            className='text-muted-foreground text-xs font-semibold h-12 first:pl-5 last:pr-5'
                                        >
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                        className='hover:bg-muted/40 transition-colors border-b last:border-0'
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className='first:pl-5 last:pr-5 py-3.5'>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className='h-48 text-center py-8'>
                                        <div className='flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto'>
                                            <div className='rounded-full p-3 bg-muted text-muted-foreground'>
                                                {searchQuery || statusFilter !== 'all' ? (
                                                    <SearchIcon className='size-6' />
                                                ) : (
                                                    <Building2Icon className='size-6' />
                                                )}
                                            </div>
                                            <p className='text-sm font-semibold text-foreground'>
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'No se encontraron sucursales coincidentes'
                                                    : 'No hay sucursales registradas'}
                                            </p>
                                            <p className='text-xs text-muted-foreground text-center'>
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'Intenta con otros términos de búsqueda o restablece los filtros aplicados.'
                                                    : 'Comienza configurando tu primera sede física o almacén de inventario.'}
                                            </p>
                                            {searchQuery || statusFilter !== 'all' ? (
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={resetFilters}
                                                    className='mt-2 cursor-pointer text-xs'
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            ) : (
                                                <Button
                                                    size='sm'
                                                    onClick={handleOpenCreateModal}
                                                    className='mt-2 cursor-pointer text-xs gap-1.5'
                                                >
                                                    <PlusIcon className='size-3.5' />
                                                    <span>Crear primera sucursal</span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer with Pagination */}
                <div data-ui className='flex items-center justify-between gap-3 px-5 py-4 border-t bg-card/40 max-sm:flex-col'>
                    <p className='text-muted-foreground text-xs whitespace-nowrap' aria-live='polite'>
                        Mostrando{' '}
                        <span className='font-medium text-foreground'>
                            {table.getRowCount() === 0 ? 0 : pageIndex * pageSize + 1}
                        </span>{' '}
                        a{' '}
                        <span className='font-medium text-foreground'>
                            {Math.min(pageIndex * pageSize + pageSize, table.getRowCount())}
                        </span>{' '}
                        de{' '}
                        <span className='font-medium text-foreground'>
                            {table.getRowCount()}
                        </span>{' '}
                        sucursal{table.getRowCount() === 1 ? '' : 'es'}
                    </p>

                    {table.getPageCount() > 1 && (
                        <div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='disabled:pointer-events-none disabled:opacity-40 text-xs gap-1 cursor-pointer'
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                            aria-label='Ir a la página anterior'
                                        >
                                            <ChevronLeftIcon className='size-4' aria-hidden='true' />
                                            <span>Anterior</span>
                                        </Button>
                                    </PaginationItem>

                                    {showLeftEllipsis && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}

                                    {pages.map(page => {
                                        const isActive = page === pageIndex + 1;

                                        return (
                                            <PaginationItem key={page}>
                                                <Button
                                                    size='icon-sm'
                                                    variant={isActive ? 'default' : 'ghost'}
                                                    className={`cursor-pointer text-xs ${!isActive &&
                                                        'bg-primary/5 text-primary hover:bg-primary/15'
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
                                            variant='ghost'
                                            size='sm'
                                            className='disabled:pointer-events-none disabled:opacity-40 text-xs gap-1 cursor-pointer'
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                            aria-label='Ir a la página siguiente'
                                        >
                                            <span>Siguiente</span>
                                            <ChevronRightIcon className='size-4' aria-hidden='true' />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-over Drawer for Branch Details */}
            <Sheet
                open={!!selectedSucursal}
                onOpenChange={open => !open && setSelectedSucursal(null)}
            >
                <SheetContent className='w-full sm:max-w-md p-6 overflow-y-auto'>
                    {selectedSucursal && (
                        <div data-ui className='flex flex-col gap-6'>
                            <SheetHeader data-ui className='text-left space-y-1 pb-4 border-b'>
                                <div className='flex items-center gap-2 text-xs font-semibold text-primary'>
                                    <Building2Icon className='size-4' />
                                    <span>Ficha de Sucursal</span>
                                </div>
                                <SheetTitle className='text-xl font-bold text-foreground capitalize'>
                                    {selectedSucursal.nombre}
                                </SheetTitle>
                                <SheetDescription className='text-xs text-muted-foreground'>
                                    Detalle general, ubicación, información fiscal y estado operativo.
                                </SheetDescription>
                            </SheetHeader>

                            {/* Summary Card */}
                            <div className='flex items-center gap-4 p-4 rounded-xl border bg-muted/20'>
                                <div className='size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0'>
                                    {selectedSucursal.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className='flex flex-col min-w-0 flex-1'>
                                    <div className='flex items-center gap-2'>
                                        <span className='font-semibold text-base text-foreground capitalize truncate'>
                                            {selectedSucursal.nombre}
                                        </span>
                                    </div>
                                    <span className='text-xs text-muted-foreground'>
                                        Código: {selectedSucursal.codigo.toUpperCase()}
                                    </span>
                                    <div className='mt-1.5'>
                                        {selectedSucursal.activo ?? true ? (
                                            <Badge
                                                variant='outline'
                                                className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] gap-1'
                                            >
                                                <CheckCircle2Icon className='size-3 text-emerald-500' />
                                                Operativa y Activa
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant='outline'
                                                className='bg-muted text-muted-foreground border-border text-[11px] gap-1'
                                            >
                                                <XCircleIcon className='size-3' />
                                                Inactiva
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className='space-y-3.5'>
                                <h4 className='text-xs font-semibold text-muted-foreground'>
                                    Ubicación Física
                                </h4>
                                <div className='flex items-start justify-between p-3.5 rounded-lg border bg-card text-xs'>
                                    <div className='flex items-start gap-2.5 min-w-0'>
                                        <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0 mt-0.5'>
                                            <MapPinIcon className='size-4' />
                                        </div>
                                        <div className='min-w-0'>
                                            <span className='text-muted-foreground block text-[11px]'>Dirección</span>
                                            <span className='font-medium text-foreground block leading-relaxed'>
                                                {selectedSucursal.direccion}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant='ghost'
                                        size='icon-sm'
                                        onClick={() => copyToClipboard(selectedSucursal.direccion, 'Dirección')}
                                        className='cursor-pointer text-muted-foreground hover:text-foreground shrink-0'
                                        title='Copiar dirección'
                                    >
                                        {copiedField === 'Dirección' ? (
                                            <CheckIcon className='size-3.5 text-emerald-500' />
                                        ) : (
                                            <CopyIcon className='size-3.5' />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className='space-y-3.5'>
                                <h4 className='text-xs font-semibold text-muted-foreground'>
                                    Datos de Contacto
                                </h4>

                                {/* Phone */}
                                <div className='flex items-center justify-between p-3 rounded-lg border bg-card text-xs'>
                                    <div className='flex items-center gap-2.5 min-w-0'>
                                        <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0'>
                                            <PhoneIcon className='size-4' />
                                        </div>
                                        <div className='min-w-0'>
                                            <span className='text-muted-foreground block text-[11px]'>Teléfono</span>
                                            <span className='font-medium text-foreground block'>
                                                {selectedSucursal.telefono || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedSucursal.telefono && (
                                        <Button
                                            variant='ghost'
                                            size='icon-sm'
                                            onClick={() => copyToClipboard(selectedSucursal.telefono, 'Teléfono')}
                                            className='cursor-pointer text-muted-foreground hover:text-foreground shrink-0'
                                            title='Copiar teléfono'
                                        >
                                            {copiedField === 'Teléfono' ? (
                                                <CheckIcon className='size-3.5 text-emerald-500' />
                                            ) : (
                                                <CopyIcon className='size-3.5' />
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Email */}
                                <div className='flex items-center justify-between p-3 rounded-lg border bg-card text-xs'>
                                    <div className='flex items-center gap-2.5 min-w-0'>
                                        <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0'>
                                            <MailIcon className='size-4' />
                                        </div>
                                        <div className='min-w-0'>
                                            <span className='text-muted-foreground block text-[11px]'>Correo Electrónico</span>
                                            <span className='font-medium text-foreground truncate block'>
                                                {selectedSucursal.email || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedSucursal.email && (
                                        <Button
                                            variant='ghost'
                                            size='icon-sm'
                                            onClick={() => copyToClipboard(selectedSucursal.email!, 'Correo')}
                                            className='cursor-pointer text-muted-foreground hover:text-foreground shrink-0'
                                            title='Copiar correo'
                                        >
                                            {copiedField === 'Correo' ? (
                                                <CheckIcon className='size-3.5 text-emerald-500' />
                                            ) : (
                                                <CopyIcon className='size-3.5' />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Fiscal Details */}
                            <div className='space-y-3.5'>
                                <h4 className='text-xs font-semibold text-muted-foreground'>
                                    Información Fiscal
                                </h4>
                                <div className='grid grid-cols-2 gap-3 text-xs'>
                                    <div className='p-3 rounded-lg border bg-card'>
                                        <span className='text-[11px] text-muted-foreground block mb-0.5'>RUC</span>
                                        <span className='font-semibold text-foreground'>
                                            {selectedSucursal.ruc || 'No registrado'}
                                        </span>
                                    </div>
                                    <div className='p-3 rounded-lg border bg-card'>
                                        <span className='text-[11px] text-muted-foreground block mb-0.5'>Razón Social</span>
                                        <span className='font-medium text-foreground truncate block' title={selectedSucursal.razonSocial || 'No registrado'}>
                                            {selectedSucursal.razonSocial ? selectedSucursal.razonSocial : 'No registrado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Stock Relation Info */}
                            {selectedSucursal.stocks !== undefined && (
                                <div className='space-y-3.5'>
                                    <h4 className='text-xs font-semibold text-muted-foreground'>
                                        Inventario en Sede
                                    </h4>
                                    <div className='p-3.5 rounded-lg border bg-card flex items-center justify-between text-xs'>
                                        <div className='flex items-center gap-2.5'>
                                            <div className='p-2 rounded-md bg-primary/10 text-primary shrink-0'>
                                                <BoxesIcon className='size-4' />
                                            </div>
                                            <div>
                                                <span className='font-medium text-foreground block'>
                                                    {selectedSucursal.stocks.length} producto{selectedSucursal.stocks.length === 1 ? '' : 's'} asignado{selectedSucursal.stocks.length === 1 ? '' : 's'}
                                                </span>
                                                <span className='text-[11px] text-muted-foreground'>
                                                    Stock acumulado:{' '}
                                                    <span className='font-semibold text-foreground'>
                                                        {selectedSucursal.stocks.reduce((acc, s) => acc + (s.cantidad || 0), 0)} unidades
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Audit Dates */}
                            <div className='space-y-3.5 pt-1'>
                                <h4 className='text-xs font-semibold text-muted-foreground'>
                                    Registro del Sistema
                                </h4>
                                <div className='grid grid-cols-2 gap-3 text-xs'>
                                    <div className='p-3 rounded-lg border bg-card'>
                                        <div className='flex items-center gap-1.5 text-muted-foreground mb-1'>
                                            <CalendarIcon className='size-3.5' />
                                            <span className='text-[11px]'>Fecha de creación</span>
                                        </div>
                                        <span className='font-medium text-foreground block'>
                                            {new Intl.DateTimeFormat('es-PE', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            }).format(new Date(selectedSucursal.createdAt))}
                                        </span>
                                    </div>
                                    <div className='p-3 rounded-lg border bg-card'>
                                        <div className='flex items-center gap-1.5 text-muted-foreground mb-1'>
                                            <CalendarIcon className='size-3.5' />
                                            <span className='text-[11px]'>Última modificación</span>
                                        </div>
                                        <span className='font-medium text-foreground block'>
                                            {new Intl.DateTimeFormat('es-PE', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            }).format(new Date(selectedSucursal.updatedAt))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions in drawer footer */}
                            <div data-ui className='flex gap-2.5 pt-4 border-t mt-auto'>
                                <Button
                                    variant='outline'
                                    onClick={() => {
                                        const suc = selectedSucursal;
                                        setSelectedSucursal(null);
                                        handleOpenEditModal(suc);
                                    }}
                                    className='flex-1 cursor-pointer gap-2 text-xs'
                                >
                                    <EditIcon className='size-3.5' />
                                    <span>Editar Sede</span>
                                </Button>
                                <Button
                                    variant={(selectedSucursal.activo ?? true) ? 'destructive' : 'default'}
                                    onClick={() => {
                                        const current = selectedSucursal.activo ?? true;
                                        executeToggle({ id: selectedSucursal.id, activo: !current });
                                    }}
                                    disabled={isToggling}
                                    className='flex-1 cursor-pointer gap-2 text-xs'
                                >
                                    <PowerIcon className='size-3.5' />
                                    <span>
                                        {(selectedSucursal.activo ?? true) ? 'Desactivar Sede' : 'Activar Sede'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Modal for Creating / Editing Sucursal */}
            <ModalSucursalForm
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    // setEditingSucursal(null);
                }}
            // sucursalToEdit={editingSucursal}
            />
        </>
    );
}