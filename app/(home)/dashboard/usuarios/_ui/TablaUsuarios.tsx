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
    ClockIcon,
    XIcon,
    EyeIcon,
    PhoneIcon,
    MailIcon,
    ShieldCheckIcon,
    StoreIcon,
    Building2Icon,
    CheckIcon,
    UserIcon,
    RotateCcwIcon,
    GlobeIcon,
    MapPinIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { usePagination } from '@/hooks/use-pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem
} from '@/components/ui/pagination';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

export type SucursalInfo = {
    id: string;
    nombre: string;
    codigo?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    activo?: boolean | null;
};

export type UsuarioItem = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username: string;
    phone: string;
    role: 'admin' | 'saler';
    createdAt: Date | string;
    updatedAt: Date | string;
    sucursales?: SucursalInfo[];
};

interface TablaUsuariosProps {
    usuarios: UsuarioItem[];
    sucursales?: { id: string; nombre: string; codigo?: string | null }[];
}

const features = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
    paginatedRowModel: createPaginatedRowModel()
});

export default function TablaUsuarios({ usuarios, sucursales = [] }: TablaUsuariosProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'saler'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [sucursalFilter, setSucursalFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<number>(10);
    const searchInputId = useId();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`${label} copiado al portapapeles`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all' || sucursalFilter !== 'all';

    const handleResetFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
        setSucursalFilter('all');
    };

    // Filtrado en vivo de usuarios
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(usuario => {
            const query = searchQuery.trim().toLowerCase();

            // Coincidencia con búsqueda general
            const matchesSearch =
                !query ||
                usuario.name.toLowerCase().includes(query) ||
                usuario.username.toLowerCase().includes(query) ||
                usuario.email.toLowerCase().includes(query) ||
                (usuario.phone && usuario.phone.includes(query)) ||
                (usuario.sucursales && usuario.sucursales.some(s => s.nombre.toLowerCase().includes(query)));

            // Filtro por Rol
            const matchesRole =
                roleFilter === 'all' || usuario.role === roleFilter;

            // Filtro por Estado de Verificación
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'verified' && usuario.emailVerified) ||
                (statusFilter === 'unverified' && !usuario.emailVerified);

            // Filtro por Sucursal
            const matchesSucursal =
                sucursalFilter === 'all' ||
                (usuario.sucursales && usuario.sucursales.some(s => s.id === sucursalFilter));

            return matchesSearch && matchesRole && matchesStatus && matchesSucursal;
        });
    }, [usuarios, searchQuery, roleFilter, statusFilter, sucursalFilter]);

    // Columnas de la tabla (usando TanStack React Table v9 API)
    const columns = useMemo<ColumnDef<typeof features, UsuarioItem>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Usuario',
                cell: ({ row }) => {
                    const user = row.original;
                    const initials = user.name
                        .trim()
                        .split(/\s+/)
                        .map(part => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'US';

                    return (
                        <div className='flex items-center gap-3 py-1'>
                            <Avatar className='size-9 border bg-muted/30 shrink-0'>
                                {user.image && (
                                    <AvatarImage src={user.image} alt={user.name} className='object-cover' />
                                )}
                                <AvatarFallback className='text-xs font-semibold bg-primary/10 text-primary'>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col min-w-0'>
                                <span className='text-sm font-medium text-foreground truncate max-w-44 sm:max-w-56'>
                                    {user.name}
                                </span>
                                <span className='text-xs text-muted-foreground font-mono'>
                                    @{user.username}
                                </span>
                            </div>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'email',
                header: 'Contacto',
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className='flex flex-col gap-1 text-sm py-0.5'>
                            <div className='flex items-center gap-1.5 min-w-0' title={user.email}>
                                <MailIcon className='size-3.5 text-muted-foreground shrink-0' />
                                <span className='text-xs text-foreground truncate max-w-40 sm:max-w-48'>
                                    {user.email}
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <PhoneIcon className='size-3.5 text-muted-foreground shrink-0' />
                                <span className='text-xs font-mono text-muted-foreground'>
                                    {user.phone || '—'}
                                </span>
                            </div>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'role',
                header: 'Rol',
                cell: ({ row }) => {
                    const role = row.original.role;
                    if (role === 'admin') {
                        return (
                            <Badge
                                variant='outline'
                                className='bg-primary/10 text-primary border-primary/20 text-xs font-medium gap-1'
                            >
                                <ShieldCheckIcon className='size-3' />
                                Administrador
                            </Badge>
                        );
                    }
                    return (
                        <Badge
                            variant='outline'
                            className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-medium gap-1'
                        >
                            <StoreIcon className='size-3' />
                            Vendedor
                        </Badge>
                    );
                }
            },
            {
                id: 'sucursales',
                header: 'Sucursales Asignadas',
                cell: ({ row }) => {
                    const user = row.original;
                    const sucs = user.sucursales ?? [];

                    if (user.role === 'admin' && sucs.length === 0) {
                        return (
                            <div className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium'>
                                <GlobeIcon className='size-3.5 text-primary/70 shrink-0' />
                                <span>Acceso Global (Todas)</span>
                            </div>
                        );
                    }

                    if (sucs.length === 0) {
                        return (
                            <span className='text-xs text-muted-foreground/80 italic'>
                                Sin sucursal asignada
                            </span>
                        );
                    }

                    if (sucs.length === 1) {
                        return (
                            <Badge
                                variant='outline'
                                className='bg-muted/40 text-foreground border-border text-xs font-normal gap-1 max-w-40 truncate'
                                title={sucs[0].nombre}
                            >
                                <Building2Icon className='size-3 text-muted-foreground shrink-0' />
                                <span className='truncate'>{sucs[0].nombre}</span>
                            </Badge>
                        );
                    }

                    const sucursalesNames = sucs.map(s => s.nombre).join(', ');
                    return (
                        <div className='flex items-center gap-1.5' title={sucursalesNames}>
                            <Badge
                                variant='outline'
                                className='bg-muted/40 text-foreground border-border text-xs font-normal gap-1 max-w-36 truncate'
                            >
                                <Building2Icon className='size-3 text-muted-foreground shrink-0' />
                                <span className='truncate'>{sucs[0].nombre}</span>
                            </Badge>
                            <Badge variant='secondary' className='text-[10px] px-1.5 py-0 h-5 font-mono'>
                                +{sucs.length - 1}
                            </Badge>
                        </div>
                    );
                }
            },
            {
                accessorKey: 'emailVerified',
                header: 'Estado',
                cell: ({ row }) => {
                    const isVerified = row.original.emailVerified;
                    return isVerified ? (
                        <Badge
                            variant='outline'
                            className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium gap-1'
                        >
                            <CheckCircle2Icon className='size-3 text-emerald-500' />
                            Verificado
                        </Badge>
                    ) : (
                        <Badge
                            variant='outline'
                            className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-medium gap-1'
                        >
                            <ClockIcon className='size-3 text-amber-500' />
                            Pendiente
                        </Badge>
                    );
                }
            },
            {
                accessorKey: 'createdAt',
                header: 'Registrado',
                cell: ({ row }) => {
                    const date = new Date(row.original.createdAt);
                    const formatted = isNaN(date.getTime())
                        ? '—'
                        : new Intl.DateTimeFormat('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }).format(date);

                    return (
                        <span className='text-xs text-muted-foreground font-mono whitespace-nowrap'>
                            {formatted}
                        </span>
                    );
                }
            },
            {
                id: 'actions',
                header: () => <span className='sr-only'>Acciones</span>,
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className='flex justify-end'>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            size='icon-sm'
                                            variant='ghost'
                                            className='cursor-pointer text-muted-foreground hover:text-foreground'
                                            aria-label='Opciones de usuario'
                                        />
                                    }
                                >
                                    <EllipsisVerticalIcon className='size-4' aria-hidden='true' />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end' className='w-48'>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className='text-xs text-muted-foreground'>
                                            Acciones de Usuario
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => setSelectedUser(user)}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <EyeIcon className='size-3.5 text-muted-foreground' />
                                            <span>Ver ficha técnica</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => copyToClipboard(user.email, 'Correo')}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <MailIcon className='size-3.5 text-muted-foreground' />
                                            <span>Copiar correo</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => copyToClipboard(user.phone, 'Teléfono')}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <PhoneIcon className='size-3.5 text-muted-foreground' />
                                            <span>Copiar teléfono</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => copyToClipboard(user.id, 'ID de usuario')}
                                            className='cursor-pointer gap-2 text-xs'
                                        >
                                            <CopyIcon className='size-3.5 text-muted-foreground' />
                                            <span>Copiar ID</span>
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
        []
    );

    // Instancia de tabla TanStack
    const table = useTable(
        {
            features,
            data: filteredUsuarios,
            columns,
            initialState: {
                pagination: { pageIndex: 0, pageSize }
            }
        },
        state => ({ pagination: state.pagination })
    );

    const { pageIndex } = table.state.pagination;
    const totalRowCount = table.getRowCount();
    const totalPages = table.getPageCount();

    const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
        currentPage: pageIndex + 1,
        totalPages,
        paginationItemsToDisplay: 3
    });

    return (
        <div className='w-full flex flex-col gap-4'>
            {/* Barra de Filtros y Búsqueda */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
                {/* Campo de búsqueda */}
                <div className='relative flex-1 max-w-md'>
                    <label htmlFor={searchInputId} className='sr-only'>
                        Buscar usuarios
                    </label>
                    <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                    <Input
                        id={searchInputId}
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            table.setPageIndex(0);
                        }}
                        placeholder='Buscar por nombre, usuario, correo, teléfono...'
                        className='pl-9 pr-9 h-9 text-xs sm:text-sm'
                    />
                    {searchQuery && (
                        <button
                            type='button'
                            onClick={() => {
                                setSearchQuery('');
                                table.setPageIndex(0);
                            }}
                            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5'
                            aria-label='Limpiar búsqueda'
                        >
                            <XIcon className='size-4' />
                        </button>
                    )}
                </div>

                {/* Filtros desplegables */}
                <div className='flex items-center flex-wrap gap-2'>
                    {/* Filtro por Rol */}
                    <Select
                        value={roleFilter}
                        onValueChange={val => {
                            if (val) setRoleFilter(val as 'all' | 'admin' | 'saler');
                            table.setPageIndex(0);
                        }}
                    >
                        <SelectTrigger className='w-32 h-9 text-xs cursor-pointer'>
                            <SelectValue placeholder='Rol' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>Todos los roles</SelectItem>
                            <SelectItem value='admin'>Administrador</SelectItem>
                            <SelectItem value='saler'>Vendedor</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filtro por Estado */}
                    <Select
                        value={statusFilter}
                        onValueChange={val => {
                            if (val) setStatusFilter(val as 'all' | 'verified' | 'unverified');
                            table.setPageIndex(0);
                        }}
                    >
                        <SelectTrigger className='w-32 h-9 text-xs cursor-pointer'>
                            <SelectValue placeholder='Estado' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>Todos los estados</SelectItem>
                            <SelectItem value='verified'>Verificados</SelectItem>
                            <SelectItem value='unverified'>Pendientes</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filtro por Sucursal si existen */}
                    {sucursales.length > 0 && (
                        <Select
                            value={sucursalFilter}
                            onValueChange={val => {
                                setSucursalFilter(val || 'all');
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className='w-36 h-9 text-xs cursor-pointer'>
                                <SelectValue placeholder='Sucursal' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Todas las sucursales</SelectItem>
                                {sucursales.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Botón de restablecer filtros */}
                    {hasActiveFilters && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleResetFilters}
                            className='h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5'
                            title='Restablecer filtros'
                        >
                            <RotateCcwIcon className='size-3.5' />
                            <span className='hidden sm:inline'>Limpiar</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Contenedor de la Tabla */}
            <div className='w-full rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden'>
                <div className='overflow-x-auto'>
                    <Table>
                        <TableHeader className='bg-muted/30'>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                                    {headerGroup.headers.map(header => (
                                        <TableHead
                                            key={header.id}
                                            className='text-muted-foreground h-12 text-xs font-semibold first:pl-5 last:pr-5'
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
                                        className='hover:bg-muted/40 transition-colors border-b last:border-none'
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
                                    <TableCell colSpan={columns.length} className='h-48 text-center'>
                                        <div className='flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground'>
                                            <div className='size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/80 mb-1'>
                                                <UserIcon className='size-5' />
                                            </div>
                                            <span className='text-sm font-medium text-foreground'>
                                                No se encontraron usuarios
                                            </span>
                                            <p className='text-xs text-muted-foreground text-balance'>
                                                {hasActiveFilters
                                                    ? 'Ningún usuario coincide con los criterios de búsqueda o filtros seleccionados.'
                                                    : 'Aún no hay usuarios registrados en el sistema.'}
                                            </p>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant='outline'
                                                    size='xs'
                                                    onClick={handleResetFilters}
                                                    className='mt-2 text-xs gap-1'
                                                >
                                                    <RotateCcwIcon className='size-3' />
                                                    Limpiar filtros
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer de Paginación */}
                <div className='flex items-center justify-between gap-3 px-5 py-3.5 border-t bg-card max-sm:flex-col md:max-lg:flex-col'>
                    {/* Contador de registros */}
                    <div className='flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap' aria-live='polite'>
                        <span>
                            Mostrando{' '}
                            <span className='font-medium text-foreground'>
                                {totalRowCount === 0 ? 0 : pageIndex * pageSize + 1}
                            </span>{' '}
                            a{' '}
                            <span className='font-medium text-foreground'>
                                {Math.min(pageIndex * pageSize + pageSize, totalRowCount)}
                            </span>{' '}
                            de <span className='font-medium text-foreground'>{totalRowCount}</span> usuarios
                        </span>

                        <div className='flex items-center gap-1.5 pl-3 border-l'>
                            <span>Por página:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={val => {
                                    if (val) {
                                        const newSize = Number(val);
                                        setPageSize(newSize);
                                        table.setPageSize(newSize);
                                        table.setPageIndex(0);
                                    }
                                }}
                            >
                                <SelectTrigger className='w-16 h-7 text-xs cursor-pointer px-2'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='5'>5</SelectItem>
                                    <SelectItem value='10'>10</SelectItem>
                                    <SelectItem value='20'>20</SelectItem>
                                    <SelectItem value='50'>50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Controles de paginación */}
                    <div>
                        <Pagination>
                            <PaginationContent className='gap-1'>
                                <PaginationItem>
                                    <Button
                                        size='sm'
                                        variant='ghost'
                                        className='h-8 text-xs cursor-pointer disabled:pointer-events-none disabled:opacity-40 gap-1'
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        aria-label='Ir a la página anterior'
                                    >
                                        <ChevronLeftIcon className='size-4' aria-hidden='true' />
                                        <span className='hidden sm:inline'>Anterior</span>
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
                                                className={`size-8 text-xs cursor-pointer font-medium ${
                                                    !isActive
                                                        ? 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
                                        size='sm'
                                        variant='ghost'
                                        className='h-8 text-xs cursor-pointer disabled:pointer-events-none disabled:opacity-40 gap-1'
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        aria-label='Ir a la página siguiente'
                                    >
                                        <span className='hidden sm:inline'>Siguiente</span>
                                        <ChevronRightIcon className='size-4' aria-hidden='true' />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>

            {/* Ficha técnica en Sheet Lateral */}
            <Sheet open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
                <SheetContent side='right' className='sm:max-w-md w-full p-0 flex flex-col justify-between'>
                    {selectedUser && (
                        <div className='flex flex-col h-full overflow-y-auto'>
                            <SheetHeader className='p-6 border-b bg-muted/20'>
                                <div className='flex items-center gap-3.5'>
                                    <Avatar className='size-14 border bg-muted/40'>
                                        {selectedUser.image && (
                                            <AvatarImage
                                                src={selectedUser.image}
                                                alt={selectedUser.name}
                                                className='object-cover'
                                            />
                                        )}
                                        <AvatarFallback className='text-base font-semibold bg-primary/10 text-primary'>
                                            {selectedUser.name
                                                .trim()
                                                .split(/\s+/)
                                                .map(p => p[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase() || 'US'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='min-w-0'>
                                        <SheetTitle className='text-lg font-bold truncate text-foreground'>
                                            {selectedUser.name}
                                        </SheetTitle>
                                        <SheetDescription className='text-xs text-muted-foreground font-mono'>
                                            @{selectedUser.username}
                                        </SheetDescription>
                                        <div className='flex items-center gap-2 mt-2'>
                                            {selectedUser.role === 'admin' ? (
                                                <Badge
                                                    variant='outline'
                                                    className='bg-primary/10 text-primary border-primary/20 text-xs font-medium gap-1'
                                                >
                                                    <ShieldCheckIcon className='size-3' />
                                                    Administrador
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant='outline'
                                                    className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-medium gap-1'
                                                >
                                                    <StoreIcon className='size-3' />
                                                    Vendedor
                                                </Badge>
                                            )}

                                            {selectedUser.emailVerified ? (
                                                <Badge
                                                    variant='outline'
                                                    className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1'
                                                >
                                                    <CheckCircle2Icon className='size-3 text-emerald-500' />
                                                    Verificado
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant='outline'
                                                    className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs gap-1'
                                                >
                                                    <ClockIcon className='size-3 text-amber-500' />
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className='p-6 flex flex-col gap-6 text-sm flex-1'>
                                {/* Información de Contacto */}
                                <div className='flex flex-col gap-3'>
                                    <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                        Información de Contacto
                                    </span>
                                    <div className='rounded-lg border bg-muted/20 p-3.5 flex flex-col gap-3'>
                                        <div className='flex items-center justify-between gap-2'>
                                            <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                                                <MailIcon className='size-3.5' />
                                                <span>Correo Electrónico</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-medium text-foreground text-xs'>
                                                    {selectedUser.email}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(selectedUser.email, 'Correo')}
                                                    className='text-muted-foreground hover:text-foreground cursor-pointer'
                                                    title='Copiar correo'
                                                >
                                                    {copiedField === 'Correo' ? (
                                                        <CheckIcon className='size-3 text-emerald-600' />
                                                    ) : (
                                                        <CopyIcon className='size-3' />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className='flex items-center justify-between gap-2 border-t pt-2.5'>
                                            <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                                                <PhoneIcon className='size-3.5' />
                                                <span>Teléfono Móvil</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-mono font-medium text-foreground text-xs'>
                                                    {selectedUser.phone || 'No registrado'}
                                                </span>
                                                {selectedUser.phone && (
                                                    <button
                                                        onClick={() => copyToClipboard(selectedUser.phone, 'Teléfono')}
                                                        className='text-muted-foreground hover:text-foreground cursor-pointer'
                                                        title='Copiar teléfono'
                                                    >
                                                        {copiedField === 'Teléfono' ? (
                                                            <CheckIcon className='size-3 text-emerald-600' />
                                                        ) : (
                                                            <CopyIcon className='size-3' />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sucursales Asignadas */}
                                <div className='flex flex-col gap-3'>
                                    <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                        Asignación de Sucursales
                                    </span>
                                    {selectedUser.role === 'admin' && (!selectedUser.sucursales || selectedUser.sucursales.length === 0) ? (
                                        <div className='rounded-lg border bg-muted/20 p-3.5 flex items-start gap-3'>
                                            <GlobeIcon className='size-4 text-primary shrink-0 mt-0.5' />
                                            <div>
                                                <span className='text-xs font-semibold text-foreground block'>
                                                    Acceso Global Administrativo
                                                </span>
                                                <span className='text-xs text-muted-foreground'>
                                                    Este usuario cuenta con permisos de administrador en todas las sedes y almacenes registrados.
                                                </span>
                                            </div>
                                        </div>
                                    ) : selectedUser.sucursales && selectedUser.sucursales.length > 0 ? (
                                        <div className='flex flex-col gap-2'>
                                            {selectedUser.sucursales.map(suc => (
                                                <div
                                                    key={suc.id}
                                                    className='rounded-lg border bg-muted/20 p-3 flex flex-col gap-1'
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <span className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                                                            <Building2Icon className='size-3.5 text-muted-foreground' />
                                                            {suc.nombre}
                                                        </span>
                                                        {suc.codigo && (
                                                            <Badge variant='outline' className='text-[10px] font-mono px-1.5 py-0'>
                                                                {suc.codigo}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {suc.direccion && (
                                                        <div className='flex items-center gap-1 text-[11px] text-muted-foreground mt-1'>
                                                            <MapPinIcon className='size-3 shrink-0' />
                                                            <span className='truncate'>{suc.direccion}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='rounded-lg border border-dashed p-3.5 text-center text-xs text-muted-foreground'>
                                            Sin sucursal asignada actualmente.
                                        </div>
                                    )}
                                </div>

                                {/* Auditoría / Registro */}
                                <div className='flex flex-col gap-3'>
                                    <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                        Registro y Auditoría
                                    </span>
                                    <div className='rounded-lg border bg-muted/20 p-3.5 flex flex-col gap-2.5 text-xs'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-muted-foreground'>ID de Sistema:</span>
                                            <span className='font-mono text-muted-foreground truncate max-w-44' title={selectedUser.id}>
                                                {selectedUser.id}
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-between border-t pt-2'>
                                            <span className='text-muted-foreground'>Fecha de Registro:</span>
                                            <span className='font-medium text-foreground'>
                                                {new Intl.DateTimeFormat('es-PE', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                }).format(new Date(selectedUser.createdAt))}
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-between border-t pt-2'>
                                            <span className='text-muted-foreground'>Última Actualización:</span>
                                            <span className='font-medium text-foreground'>
                                                {new Intl.DateTimeFormat('es-PE', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                }).format(new Date(selectedUser.updatedAt))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='p-4 border-t bg-card flex justify-end gap-2'>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setSelectedUser(null)}
                                    className='text-xs'
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}