'use client'

import React, { useId, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable
} from '@tanstack/react-table'
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
  UserCheckIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  CheckIcon
} from 'lucide-react'
import { toast } from 'sonner'

import { Usuario } from '@/interfaces'
import { usePagination } from '@/hooks/use-pagination'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ModalNuevoVendedor from './ModalNuevoVendedor'

interface TableVendedoresProps {
  vendedores: Usuario[]
}

const features = tableFeatures({
  rowPaginationFeature,
  columnVisibilityFeature,
  paginatedRowModel: createPaginatedRowModel()
})

export default function TableVendedores({ vendedores }: TableVendedoresProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedSeller, setSelectedSeller] = useState<Usuario | null>(null)
  const [isNewSellerModalOpen, setIsNewSellerModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const searchInputId = useId()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} copiado al portapapeles`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Live filtering by search query and verification status
  const filteredData = useMemo(() => {
    return vendedores.filter(vendedor => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        vendedor.name.toLowerCase().includes(query) ||
        vendedor.username.toLowerCase().includes(query) ||
        vendedor.email.toLowerCase().includes(query) ||
        (vendedor.phone && vendedor.phone.includes(query))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && vendedor.emailVerified) ||
        (statusFilter === 'unverified' && !vendedor.emailVerified)

      return matchesSearch && matchesStatus
    })
  }, [vendedores, searchQuery, statusFilter])

  const columns = useMemo<ColumnDef<typeof features, Usuario>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Vendedor',
        cell: ({ row }) => {
          const seller = row.original
          const initials = seller.name
            .trim()
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'VE'

          return (
            <div className='flex items-center gap-3 py-1'>
              <Avatar className='size-10 border bg-muted/40 shrink-0'>
                {seller.image && <AvatarImage src={seller.image} alt={seller.name} className='object-cover' />}
                <AvatarFallback className='text-xs font-semibold text-foreground/80 bg-primary/10 text-primary'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col min-w-0'>
                <span className='text-sm font-semibold text-card-foreground truncate max-w-48 sm:max-w-64'>
                  {seller.name}
                </span>
                <span className='text-xs text-muted-foreground font-mono'>
                  @{seller.username}
                </span>
              </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'email',
        header: 'Correo Electrónico',
        cell: ({ row }) => {
          const email = row.original.email
          return (
            <div className='flex items-center gap-1.5 text-sm'>
              <MailIcon className='size-3.5 text-muted-foreground shrink-0' />
              <span className='text-foreground truncate max-w-44 sm:max-w-56' title={email}>
                {email}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: ({ row }) => {
          const phone = row.original.phone
          return (
            <div className='flex items-center gap-1.5 text-sm'>
              <PhoneIcon className='size-3.5 text-muted-foreground shrink-0' />
              <span className='font-mono text-xs text-foreground/90'>
                {phone || '—'}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: 'emailVerified',
        header: 'Estado',
        cell: ({ row }) => {
          const isVerified = row.original.emailVerified
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
          )
        }
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: () => (
          <Badge
            variant='secondary'
            className='bg-primary/10 text-primary border border-primary/20 text-xs font-medium capitalize'
          >
            Vendedor
          </Badge>
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Registrado',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt)
          const formatted = isNaN(date.getTime())
            ? '—'
            : new Intl.DateTimeFormat('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }).format(date)

          return <span className='text-xs text-muted-foreground whitespace-nowrap'>{formatted}</span>
        }
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>Acciones</span>,
        cell: ({ row }) => {
          const seller = row.original
          return (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      className='cursor-pointer text-muted-foreground hover:text-foreground'
                      aria-label='Opciones de vendedor'
                    />
                  }
                >
                  <EllipsisVerticalIcon className='size-4' aria-hidden='true' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuLabel className='text-xs text-muted-foreground'>
                    Acciones
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => setSelectedSeller(seller)}
                      className='cursor-pointer gap-2 text-xs'
                    >
                      <EyeIcon className='size-3.5 text-muted-foreground' />
                      <span>Ver detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(seller.email, 'Correo')}
                      className='cursor-pointer gap-2 text-xs'
                    >
                      <MailIcon className='size-3.5 text-muted-foreground' />
                      <span>Copiar correo</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(seller.phone, 'Teléfono')}
                      className='cursor-pointer gap-2 text-xs'
                    >
                      <PhoneIcon className='size-3.5 text-muted-foreground' />
                      <span>Copiar teléfono</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(seller.id, 'ID')}
                      className='cursor-pointer gap-2 text-xs text-muted-foreground'
                    >
                      <CopyIcon className='size-3.5' />
                      <span>Copiar ID</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableHiding: false
      }
    ],
    []
  )

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
  )

  const { pageIndex, pageSize } = table.state.pagination

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    table.setPageIndex(0)
  }

  const selectedInitials = selectedSeller?.name
    ? selectedSeller.name
        .trim()
        .split(/\s+/)
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VE'

  return (
    <>
      <div className='w-full rounded-xl border bg-card shadow-xs overflow-hidden'>
        {/* Toolbar: Search, Status Filter, Page Size, New Seller Action */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b bg-card/60 backdrop-blur-xs'>
          <div className='flex flex-wrap items-center gap-2.5 flex-1'>
            {/* Search Input */}
            <div className='relative w-full sm:w-72'>
              <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
              <Input
                id={searchInputId}
                type='text'
                placeholder='Buscar por nombre, correo, usuario...'
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  table.setPageIndex(0)
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
                setStatusFilter(val as 'all' | 'verified' | 'unverified')
                table.setPageIndex(0)
              }}
            >
              <SelectTrigger className='w-[145px] h-9 text-xs cursor-pointer'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                <SelectItem value='verified'>Verificados</SelectItem>
                <SelectItem value='unverified'>Pendientes</SelectItem>
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
                  table.setPageSize(Number(val))
                  table.setPageIndex(0)
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

            {/* New Seller Button */}
            <Button
              onClick={() => setIsNewSellerModalOpen(true)}
              className='h-9 gap-1.5 shadow-xs cursor-pointer text-xs font-medium'
            >
              <UserPlusIcon className='size-3.5' />
              <span>Nuevo Vendedor</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className='bg-muted/30 hover:bg-muted/30'>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        className='text-muted-foreground text-xs font-semibold tracking-wider uppercase h-12 first:pl-5 last:pr-5'
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
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
                      <TableCell key={cell.id} className='first:pl-5 last:pr-5 py-3'>
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
                          <UsersIcon className='size-6' />
                        )}
                      </div>
                      <p className='text-sm font-semibold text-foreground'>
                        {searchQuery || statusFilter !== 'all'
                          ? 'No se encontraron vendedores'
                          : 'No hay vendedores registrados'}
                      </p>
                      <p className='text-xs text-muted-foreground text-center'>
                        {searchQuery || statusFilter !== 'all'
                          ? 'Prueba ajustando los términos de búsqueda o limpiando los filtros seleccionados.'
                          : 'Comienza agregando un nuevo miembro a tu equipo comercial con el botón superior.'}
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
                          onClick={() => setIsNewSellerModalOpen(true)}
                          className='mt-2 cursor-pointer text-xs gap-1.5'
                        >
                          <UserPlusIcon className='size-3.5' />
                          <span>Crear primer vendedor</span>
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
        <div className='flex items-center justify-between gap-3 px-5 py-4 border-t bg-card/40 max-sm:flex-col'>
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
            vendedor{table.getRowCount() === 1 ? '' : 'es'}
          </p>

          {table.getPageCount() > 1 && (
            <div>
              <Pagination>
                <PaginationContent>
                  {/* Previous Button */}
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

                  {/* Left Ellipsis */}
                  {showLeftEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Page Numbers */}
                  {pages.map(page => {
                    const isActive = page === pageIndex + 1

                    return (
                      <PaginationItem key={page}>
                        <Button
                          size='icon-sm'
                          variant={isActive ? 'default' : 'ghost'}
                          className={`cursor-pointer text-xs ${
                            !isActive &&
                            'bg-primary/5 text-primary hover:bg-primary/15'
                          }`}
                          onClick={() => table.setPageIndex(page - 1)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    )
                  })}

                  {/* Right Ellipsis */}
                  {showRightEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Next Button */}
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

      {/* Slide-Over Drawer for Seller Details */}
      <Sheet
        open={!!selectedSeller}
        onOpenChange={open => !open && setSelectedSeller(null)}
      >
        <SheetContent className='w-full sm:max-w-md p-6 overflow-y-auto'>
          {selectedSeller && (
            <div className='flex flex-col gap-6'>
              <SheetHeader className='text-left space-y-1 pb-4 border-b'>
                <div className='flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider'>
                  <UserCheckIcon className='size-4' />
                  <span>Perfil de Vendedor</span>
                </div>
                <SheetTitle className='text-xl font-bold text-foreground'>
                  {selectedSeller.name}
                </SheetTitle>
                <SheetDescription className='text-xs text-muted-foreground'>
                  Información de la cuenta, accesos y datos de contacto registrados.
                </SheetDescription>
              </SheetHeader>

              {/* Profile Card */}
              <div className='flex items-center gap-4 p-4 rounded-xl border bg-muted/20'>
                <Avatar className='size-14 border-2 border-primary/20 shrink-0'>
                  {selectedSeller.image && (
                    <AvatarImage src={selectedSeller.image} alt={selectedSeller.name} className='object-cover' />
                  )}
                  <AvatarFallback className='text-base font-bold bg-primary/10 text-primary'>
                    {selectedInitials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col min-w-0'>
                  <span className='font-semibold text-base text-foreground truncate'>
                    {selectedSeller.name}
                  </span>
                  <span className='text-xs text-muted-foreground font-mono'>
                    @{selectedSeller.username}
                  </span>
                  <div className='flex items-center gap-2 mt-1.5'>
                    <Badge variant='secondary' className='text-[11px] font-medium capitalize bg-primary/10 text-primary'>
                      Vendedor
                    </Badge>
                    {selectedSeller.emailVerified ? (
                      <Badge
                        variant='outline'
                        className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                      >
                        Verificado
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]'
                      >
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact and Account Information Details */}
              <div className='space-y-3.5'>
                <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  Datos de Contacto
                </h4>

                {/* Email Item */}
                <div className='flex items-center justify-between p-3 rounded-lg border bg-card text-xs'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0'>
                      <MailIcon className='size-4' />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-muted-foreground block text-[11px]'>Correo Electrónico</span>
                      <span className='font-medium text-foreground truncate block'>
                        {selectedSeller.email}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => copyToClipboard(selectedSeller.email, 'Correo')}
                    className='cursor-pointer text-muted-foreground hover:text-foreground shrink-0'
                    title='Copiar correo'
                  >
                    {copiedField === 'Correo' ? (
                      <CheckIcon className='size-3.5 text-emerald-500' />
                    ) : (
                      <CopyIcon className='size-3.5' />
                    )}
                  </Button>
                </div>

                {/* Phone Item */}
                <div className='flex items-center justify-between p-3 rounded-lg border bg-card text-xs'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0'>
                      <PhoneIcon className='size-4' />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-muted-foreground block text-[11px]'>Teléfono</span>
                      <span className='font-mono font-medium text-foreground block'>
                        {selectedSeller.phone || 'No registrado'}
                      </span>
                    </div>
                  </div>
                  {selectedSeller.phone && (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      onClick={() => copyToClipboard(selectedSeller.phone, 'Teléfono')}
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

                {/* User ID */}
                <div className='flex items-center justify-between p-3 rounded-lg border bg-card text-xs'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <div className='p-2 rounded-md bg-muted text-muted-foreground shrink-0'>
                      <ShieldCheckIcon className='size-4' />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-muted-foreground block text-[11px]'>ID de Usuario</span>
                      <span className='font-mono text-muted-foreground truncate block'>
                        {selectedSeller.id}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => copyToClipboard(selectedSeller.id, 'ID')}
                    className='cursor-pointer text-muted-foreground hover:text-foreground shrink-0'
                    title='Copiar ID'
                  >
                    {copiedField === 'ID' ? (
                      <CheckIcon className='size-3.5 text-emerald-500' />
                    ) : (
                      <CopyIcon className='size-3.5' />
                    )}
                  </Button>
                </div>
              </div>

              {/* Registration and Activity Details */}
              <div className='space-y-3.5 pt-2'>
                <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  Actividad de Cuenta
                </h4>
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  <div className='p-3 rounded-lg border bg-card'>
                    <div className='flex items-center gap-1.5 text-muted-foreground mb-1'>
                      <CalendarIcon className='size-3.5' />
                      <span className='text-[11px]'>Fecha de registro</span>
                    </div>
                    <span className='font-medium text-foreground block'>
                      {new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }).format(new Date(selectedSeller.createdAt))}
                    </span>
                  </div>

                  <div className='p-3 rounded-lg border bg-card'>
                    <div className='flex items-center gap-1.5 text-muted-foreground mb-1'>
                      <ClockIcon className='size-3.5' />
                      <span className='text-[11px]'>Última actualización</span>
                    </div>
                    <span className='font-medium text-foreground block'>
                      {new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }).format(new Date(selectedSeller.updatedAt))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions footer in drawer */}
              <div className='flex gap-2.5 pt-4 border-t mt-auto'>
                <Button
                  variant='outline'
                  className='flex-1 cursor-pointer text-xs'
                  onClick={() => setSelectedSeller(null)}
                >
                  Cerrar
                </Button>
                {selectedSeller.email && (
                  <Button
                    className='flex-1 cursor-pointer text-xs gap-1.5'
                    onClick={() => {
                      window.location.href = `mailto:${selectedSeller.email}`
                    }}
                  >
                    <MailIcon className='size-3.5' />
                    <span>Enviar Correo</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal to Register a New Seller */}
      <ModalNuevoVendedor
        isOpen={isNewSellerModalOpen}
        onClose={() => setIsNewSellerModalOpen(false)}
      />
    </>
  )
}