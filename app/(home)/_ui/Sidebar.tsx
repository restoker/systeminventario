'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
} from '@/components/ui/sidebar';

import ProfileDropdown, {
    getUserInitials,
    ROLE_LABELS,
    type ProfileSessionUser,
} from '@/components/shadcn-studio/blocks/dropdown-profile';
import { authClient } from '@/lib/auth-client';

import FacebookIcon from '@/assets/svg/facebook-icon';
import InstagramIcon from '@/assets/svg/instagram-icon';
import LinkedinIcon from '@/assets/svg/linkedin-icon';
import TwitterIcon from '@/assets/svg/twitter-icon';

import {
    ChartNoAxesCombinedIcon,
    ShoppingCartPlusIcon,
    ArchiveIcon,
    NotebookTextIcon,
    ArrowLeftRightIcon,
    CornerDownLeftIcon,
    Building2Icon,
    ShoppingCartIcon,
    ReceiptIcon,
    DollarSignIcon,
    FileTextIcon,
    PackageIcon,
    TagsIcon,
    BookmarkIcon,
    ScaleIcon,
    UsersIcon,
    ChevronDownIcon,
    UserIcon,
    HardDriveIcon,
    SettingsIcon,
    Wallet,
} from 'lucide-react';

// Icono personalizado para Consignación (Portapapeles con gráfica de barras)
const ClipboardChartIcon = ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 17v-2" />
        <path d="M12 17v-4" />
        <path d="M15 17v-6" />
    </svg>
);

export type UserRole = 'admin' | 'saler';

export interface NavItem {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
}

// Record de rutas para Administrador
export const adminRoutes: Record<string, NavItem[]> = {
    Principal: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: ChartNoAxesCombinedIcon,
            badge: 5,
        },
    ],
    Inventario: [
        {
            title: 'Reabastecer productos',
            url: '/dashboard/inventario',
            icon: ShoppingCartPlusIcon,
        },
        {
            title: 'Stock',
            url: '/dashboard/inventario/stock',
            icon: ArchiveIcon,
        },
        {
            title: 'Kardex',
            url: '/dashboard/inventario/kardex',
            icon: NotebookTextIcon,
        },
        {
            title: 'Consignación',
            url: '/dashboard/consignacion',
            icon: ClipboardChartIcon,
        },
        {
            title: 'Pago a proveedores',
            url: '/dashboard/proveedores/transacciones',
            icon: ArrowLeftRightIcon,
        },
        {
            title: 'Devoluciones',
            url: '/dashboard/devoluciones',
            icon: CornerDownLeftIcon,
        },
        // {
        //     title: 'Sucursales',
        //     url: '/dashboard/sucursales',
        //     icon: Building2Icon,
        // },
    ],
    Venta: [
        {
            title: 'Caja',
            url: '/dashboard/caja',
            icon: Wallet,
        },
        {
            title: 'Productos',
            url: '/dashboard/productos',
            icon: ShoppingCartIcon,
        },
        {
            title: 'Punto de venta',
            url: '/dashboard/pos',
            icon: ReceiptIcon,
        },
        {
            title: 'Comisiones vendedor',
            url: '/dashboard/comisiones',
            icon: DollarSignIcon,
        },
        {
            title: 'Equipo POS',
            url: '/dashboard/pos-team',
            icon: HardDriveIcon,
        },
        {
            title: 'Vendedores',
            url: '/dashboard/vendedores',
            icon: UserIcon,
        },
        {
            title: 'Tiendas',
            url: '/dashboard/sucursales',
            icon: Building2Icon,
        },
        {
            title: 'Configuración',
            url: '/dashboard/configuracion',
            icon: SettingsIcon,
        },
    ],
    Reportes: [
        {
            title: 'Historial de cobros',
            url: '/dashboard/reportes/vendedores',
            icon: UserIcon,
        },
        {
            title: 'Ganancias',
            url: '/dashboard/reportes/ganancias',
            icon: DollarSignIcon,
        },
    ],
    Catalogo: [
        {
            title: 'Clientes',
            url: '/dashboard/clientes',
            icon: UsersIcon,
        },
        {
            title: "RUC's",
            url: '/dashboard/rucs',
            icon: TagsIcon,
        },
        {
            title: 'Costos',
            url: '/dashboard/costos',
            icon: BookmarkIcon,
        },
        {
            title: 'Proveedores',
            url: '/dashboard/proveedores',
            icon: ScaleIcon,
        },
        {
            title: 'Usuarios',
            url: '/dashboard/usuarios',
            icon: UsersIcon,
        },
    ],
};

// Record de rutas para Vendedor (Saler)
export const salerRoutes: Record<string, NavItem[]> = {
    Principal: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: ChartNoAxesCombinedIcon,
        },
    ],
    Inventario: [
        {
            title: 'Stock',
            url: '/dashboard/inventario/stock',
            icon: ArchiveIcon,
        },
        {
            title: 'Kardex',
            url: '/dashboard/inventario/kardex',
            icon: NotebookTextIcon,
        },
        {
            title: 'Devoluciones',
            url: '/dashboard/devoluciones',
            icon: CornerDownLeftIcon,
        },
    ],
    Venta: [
        {
            title: 'Nueva Venta',
            url: '/dashboard/pos',
            icon: ShoppingCartIcon,
        },
        {
            title: 'Mis Ventas',
            url: '/dashboard/ventas',
            icon: ReceiptIcon,
        },
        {
            title: 'Caja',
            url: '/dashboard/caja',
            icon: DollarSignIcon,
        },
        {
            title: 'Comprobantes',
            url: '/dashboard/comprobantes',
            icon: FileTextIcon,
        },
    ],
    Catalogo: [
        {
            title: 'Productos',
            url: '/dashboard/productos',
            icon: PackageIcon,
        },
    ],
};

export const routesByRole: Record<UserRole, Record<string, NavItem[]>> = {
    admin: adminRoutes,
    saler: salerRoutes,
};

interface BreadcrumbSegment {
    label: string;
    href?: string;
}

const GROUP_DISPLAY_LABELS: Record<string, string> = {
    Catalogo: 'Catálogo',
};

const SEGMENT_LABELS: Record<string, string> = {
    inventario: 'Inventario',
    stock: 'Stock',
    kardex: 'Kardex',
    reabastecer: 'Reabastecer',
    consignacion: 'Consignación',
    proveedores: 'Proveedores',
    transacciones: 'Pago a proveedores',
    devoluciones: 'Devoluciones',
    caja: 'Caja',
    productos: 'Productos',
    new: 'Nuevo producto',
    pos: 'Punto de venta',
    ventas: 'Ventas',
    vendedores: 'Vendedores',
    sucursales: 'Tiendas',
    configuracion: 'Configuración',
    usuarios: 'Usuarios',
};

const EXTRA_ROUTE_TRAILS: Record<string, BreadcrumbSegment[]> = {
    '/dashboard/inventario/reabastecer': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Inventario', href: '/dashboard/inventario' },
        { label: 'Reabastecer' },
    ],
    '/dashboard/productos/new': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Productos', href: '/dashboard/productos' },
        { label: 'Nuevo producto' },
    ],
    '/dashboard/proveedores/transacciones': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Proveedores', href: '/dashboard/proveedores' },
        { label: 'Pago a proveedores' },
    ],
};

function formatSegmentLabel(segment: string): string {
    const known = SEGMENT_LABELS[segment.toLowerCase()];
    if (known) return known;
    const words = segment.replace(/[-_]+/g, ' ').trim();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

/** Build ordered, clickable breadcrumb segments from the current route and role menu. */
function resolveBreadcrumbs(
    pathname: string,
    routes: Record<string, NavItem[]>
): { crumbs: BreadcrumbSegment[]; pageTitle: string } {
    const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';

    if (normalized === '/dashboard' || normalized === '/') {
        return { crumbs: [{ label: 'Dashboard' }], pageTitle: 'Dashboard' };
    }

    const extraTrail = EXTRA_ROUTE_TRAILS[normalized];
    if (extraTrail) {
        return {
            crumbs: extraTrail,
            pageTitle: extraTrail[extraTrail.length - 1].label,
        };
    }

    for (const [groupTitle, items] of Object.entries(routes)) {
        const match = items.find((item) => item.url === normalized);
        if (!match) continue;

        if (groupTitle === 'Principal') {
            return { crumbs: [{ label: match.title }], pageTitle: match.title };
        }

        const groupLabel = GROUP_DISPLAY_LABELS[groupTitle] ?? groupTitle;
        const groupHref =
            groupTitle === 'Inventario' && normalized !== '/dashboard/inventario'
                ? '/dashboard/inventario'
                : undefined;

        return {
            crumbs: [
                { label: 'Dashboard', href: '/dashboard' },
                { label: groupLabel, href: groupHref },
                { label: match.title },
            ],
            pageTitle: match.title,
        };
    }

    const segments = normalized.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);
    if (segments.length === 0) {
        return { crumbs: [{ label: 'Dashboard' }], pageTitle: 'Dashboard' };
    }

    const trail: BreadcrumbSegment[] = [{ label: 'Dashboard', href: '/dashboard' }];
    segments.forEach((segment, idx) => {
        const label = formatSegmentLabel(segment);
        if (!label) return;
        const isLast = idx === segments.length - 1;
        const knownParentHref =
            !isLast && (segment === 'inventario' || segment === 'productos' || segment === 'proveedores')
                ? `/dashboard/${segment}`
                : undefined;
        trail.push({ label, href: knownParentHref });
    });

    return {
        crumbs: trail,
        pageTitle: trail[trail.length - 1]?.label ?? 'Dashboard',
    };
}

interface SidebarAuxProps {
    children: React.ReactNode;
    role?: UserRole;
}

const SidebarAux = ({ children, role }: SidebarAuxProps) => {
    const pathname = usePathname() || '/dashboard';
    const normalizedPath = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    const { data: session, isPending: isSessionPending } = authClient.useSession();
    const sessionUser = session?.user as ProfileSessionUser | undefined;
    const userRole: UserRole =
        role ?? (sessionUser?.role === 'admin' || sessionUser?.role === 'saler' ? sessionUser.role : 'admin');
    const currentRoutes = routesByRole[userRole] ?? adminRoutes;
    const { crumbs, pageTitle } = resolveBreadcrumbs(normalizedPath, currentRoutes);

    const showSessionSkeleton = isSessionPending && !sessionUser;
    const displayName = sessionUser?.name?.trim() || 'Usuario';
    const userImage = sessionUser?.image?.trim() || undefined;
    const initials = getUserInitials(sessionUser?.name, sessionUser?.email);
    const roleLabel = ROLE_LABELS[userRole].full;

    return (
        <div className='flex min-h-dvh w-full'>
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                        {Object.entries(currentRoutes).map(([groupTitle, items]) => (
                            <SidebarGroup key={groupTitle}>
                                {groupTitle !== 'Principal' && (
                                    <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
                                )}
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {items.map((item) => {
                                            const IconComponent = item.icon;
                                            const isActive = normalizedPath === item.url;
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        isActive={isActive}
                                                        render={<Link href={item.url} />}
                                                    >
                                                        <IconComponent />
                                                        <span>{item.title}</span>
                                                    </SidebarMenuButton>
                                                    {item.badge !== undefined && (
                                                        <SidebarMenuBadge className='bg-primary/10 top-1/2! right-2 -translate-y-1/2! rounded-full'>
                                                            {item.badge}
                                                        </SidebarMenuBadge>
                                                    )}
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>
                </Sidebar>
                <div className='flex min-w-0 flex-1 flex-col'>
                    <header data-ui='' className='sticky top-0 z-40 border-b border-border/70 bg-sidebar'>
                        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6'>
                            <div className='flex min-w-0 items-center gap-3'>
                                <SidebarTrigger
                                    aria-label='Alternar menú lateral'
                                    title='Alternar menú lateral (⌘B)'
                                    className='size-9 shrink-0 text-muted-foreground hover:text-foreground sm:size-8 [&_svg]:size-4!'
                                />
                                <div className='min-w-0'>
                                    <span className='block truncate text-sm font-semibold tracking-tight text-foreground sm:hidden'>
                                        {pageTitle}
                                    </span>
                                    <Breadcrumb className='hidden sm:block'>
                                        <BreadcrumbList className='flex-nowrap whitespace-nowrap'>
                                            {crumbs.map((crumb, index) => {
                                                const isLast = index === crumbs.length - 1;
                                                const isIntermediate = index > 0 && !isLast;
                                                return (
                                                    <Fragment key={`${crumb.label}-${index}`}>
                                                        {index > 0 && (
                                                            <BreadcrumbSeparator
                                                                className={isIntermediate ? 'hidden lg:block' : undefined}
                                                            />
                                                        )}
                                                        <BreadcrumbItem
                                                            className={isIntermediate ? 'hidden lg:inline-flex' : undefined}
                                                        >
                                                            {isLast ? (
                                                                <BreadcrumbPage className='max-w-44 truncate font-medium text-foreground lg:max-w-64'>
                                                                    {crumb.label}
                                                                </BreadcrumbPage>
                                                            ) : crumb.href ? (
                                                                <BreadcrumbLink render={<Link href={crumb.href} />}>
                                                                    {crumb.label}
                                                                </BreadcrumbLink>
                                                            ) : (
                                                                <span className='text-muted-foreground'>
                                                                    {crumb.label}
                                                                </span>
                                                            )}
                                                        </BreadcrumbItem>
                                                    </Fragment>
                                                );
                                            })}
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                                {normalizedPath !== '/dashboard/pos' && (
                                    <Link
                                        href='/dashboard/pos'
                                        className='hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex'
                                    >
                                        <ReceiptIcon className='size-3.5 text-amber-600 dark:text-amber-500' />
                                        <span>{userRole === 'saler' ? 'Nueva venta' : 'Punto de venta'}</span>
                                    </Link>
                                )}
                                <ProfileDropdown
                                    user={sessionUser}
                                    role={userRole}
                                    trigger={
                                        showSessionSkeleton ? (
                                            <Button
                                                variant='ghost'
                                                disabled
                                                aria-label='Cargando cuenta'
                                                className='h-10 gap-2.5 rounded-md px-1.5 sm:pr-2'
                                            >
                                                <Skeleton className='size-7 rounded-full' />
                                                <span className='hidden flex-col gap-1 sm:flex'>
                                                    <Skeleton className='h-3 w-20' />
                                                    <Skeleton className='h-2.5 w-14' />
                                                </span>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant='ghost'
                                                aria-label={`Cuenta de ${displayName}`}
                                                className='group/profile h-10 gap-2.5 rounded-md px-1.5 hover:bg-muted aria-expanded:bg-muted sm:pr-2'
                                            >
                                                <Avatar size='sm' className='size-7 shrink-0 after:border-foreground/10'>
                                                    {userImage ? (
                                                        <AvatarImage src={userImage} alt={displayName} />
                                                    ) : null}
                                                    <AvatarFallback className='bg-foreground text-background text-xs font-semibold'>
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className='hidden min-w-0 flex-col items-start text-left sm:flex'>
                                                    <span className='max-w-36 truncate text-[13px] font-semibold leading-tight text-foreground'>
                                                        {displayName}
                                                    </span>
                                                    <span className='max-w-36 truncate text-xs leading-tight text-muted-foreground'>
                                                        {roleLabel}
                                                    </span>
                                                </span>
                                                <ChevronDownIcon className='hidden size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded/profile:rotate-180 sm:block' />
                                            </Button>
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </header>
                    <main className='mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6'>
                        {children}
                    </main>
                    <footer>
                        <div className='text-muted-foreground mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
                            <p className='text-sm text-balance max-sm:text-center'>
                                {`©${new Date().getFullYear()}`}{' '}
                                <a href='#' className='text-primary'>
                                    shadcn/studio
                                </a>
                                , Made for better web design
                            </p>
                            <div className='text-muted-foreground *:hover:text-primary flex items-center gap-5'>
                                <a href='#'>
                                    <FacebookIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <InstagramIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <LinkedinIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <TwitterIcon className='size-4' />
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default SidebarAux;
