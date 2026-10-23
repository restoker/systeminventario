'use client';

import React from 'react';
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
import { Separator } from '@/components/ui/separator';
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

import LanguageDropdown from '@/components/shadcn-studio/blocks/dropdown-language';
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile';
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
    LanguagesIcon,
    UserIcon,
    HardDriveIcon,
    SettingsIcon,
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
            title: 'Ingreso Productos',
            url: '/inventario/ingreso-productos',
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
            url: '/dashboard/inventario/consignacion',
            icon: ClipboardChartIcon,
        },
        {
            title: 'Pago a proveedores',
            url: '/dashboard/inventario/pago-proveedores',
            icon: ArrowLeftRightIcon,
        },
        {
            title: 'Devoluciones',
            url: '/dashboard/inventario/devoluciones',
            icon: CornerDownLeftIcon,
        },
        {
            title: 'Sucursales',
            url: '/dashboard/sucursales',
            icon: Building2Icon,
        },
    ],
    Venta: [
        {
            title: 'Productos',
            url: '/dashboard/productos',
            icon: ShoppingCartIcon,
        },
        {
            title: 'Punto de venta',
            url: '/dashboard/ventas',
            icon: ReceiptIcon,
        },
        {
            title: 'Comisiones vendedor',
            url: '/dashboard/caja',
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
            url: '/dashboard/pos-team',
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
            title: 'Servicios',
            url: '/dashboard/categorias',
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
            url: '/dashboard/inventario/devoluciones',
            icon: CornerDownLeftIcon,
        },
    ],
    Venta: [
        {
            title: 'Nueva Venta',
            url: '/ventas/nueva',
            icon: ShoppingCartIcon,
        },
        {
            title: 'Mis Ventas',
            url: '/ventas',
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

interface SidebarAuxProps {
    children: React.ReactNode;
    role?: UserRole;
}

const SidebarAux = ({ children, role }: SidebarAuxProps) => {
    const pathname = usePathname();
    const { data: session } = authClient.useSession();
    const userRole: UserRole = role ?? (session?.user as { role?: UserRole } | undefined)?.role ?? 'admin';
    const currentRoutes = routesByRole[userRole] ?? adminRoutes;

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
                                            const isActive = pathname === item.url;
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
                <div className='flex flex-1 flex-col'>
                    <header className='bg-card sticky top-0 z-50 border-b'>
                        <div className='mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6'>
                            <div className='flex items-center gap-4'>
                                <SidebarTrigger className='[&_svg]:size-5!' />
                                <Separator orientation='vertical' className='hidden h-4! data-vertical:self-center sm:block' />
                                <Breadcrumb className='hidden sm:block'>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href='#'>Home</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href='#'>Dashboard</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Free</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <LanguageDropdown
                                    trigger={
                                        <Button variant='ghost' size='icon-lg'>
                                            <LanguagesIcon />
                                        </Button>
                                    }
                                />
                                <ProfileDropdown
                                    trigger={
                                        <Button variant='ghost' size='icon-lg'>
                                            <Avatar className='size-[inherit] rounded-[inherit] after:rounded-[inherit]'>
                                                <AvatarImage
                                                    src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png'
                                                    className='rounded-[inherit]'
                                                />
                                                <AvatarFallback className='rounded-[inherit]'>JD</AvatarFallback>
                                            </Avatar>
                                        </Button>
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
