'use client';

import { useState, type ComponentType, type ReactElement } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2Icon,
  Loader2Icon,
  LogOutIcon,
  ReceiptIcon,
  SettingsIcon,
  ShoppingCartIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export type ProfileUserRole = 'admin' | 'saler';

export interface ProfileSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
}

export const ROLE_LABELS: Record<ProfileUserRole, { full: string; compact: string }> = {
  admin: { full: 'Administrador', compact: 'Admin' },
  saler: { full: 'Vendedor', compact: 'Vendedor' },
};

interface QuickLinkItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const QUICK_LINKS_BY_ROLE: Record<ProfileUserRole, QuickLinkItem[]> = {
  admin: [
    { label: 'Configuración', href: '/dashboard/configuracion', icon: SettingsIcon },
    { label: 'Usuarios', href: '/dashboard/usuarios', icon: UsersIcon },
    { label: 'Sucursales', href: '/dashboard/sucursales', icon: Building2Icon },
  ],
  saler: [
    { label: 'Punto de venta', href: '/dashboard/pos', icon: ShoppingCartIcon },
    { label: 'Caja', href: '/dashboard/caja', icon: WalletIcon },
    { label: 'Mis ventas', href: '/dashboard/ventas', icon: ReceiptIcon },
  ],
};

/** Derive crisp two-letter initials from the user's name or email. */
export function getUserInitials(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }

  const cleanEmail = email?.trim();
  if (cleanEmail) {
    return cleanEmail.slice(0, 2).toUpperCase();
  }

  return 'US';
}

type Props = {
  trigger: ReactElement;
  defaultOpen?: boolean;
  align?: 'start' | 'center' | 'end';
  user?: ProfileSessionUser | null;
  role?: ProfileUserRole;
};

const ProfileDropdown = ({ trigger, defaultOpen, align = 'end', user: userProp, role: roleProp }: Props) => {
  const { data } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = userProp ?? (data?.user as ProfileSessionUser | undefined);
  const resolvedRole: ProfileUserRole =
    roleProp ?? (user?.role === 'admin' || user?.role === 'saler' ? user.role : 'saler');
  const isAdmin = resolvedRole === 'admin';

  const displayName = user?.name?.trim() || 'Usuario';
  const displayEmail = user?.email?.trim() || '';
  const username = user?.username?.trim() || '';
  const userImage = user?.image?.trim() || undefined;
  const initials = getUserInitials(user?.name, user?.email);
  const quickLinks = QUICK_LINKS_BY_ROLE[resolvedRole];

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      const response = await authClient.signOut();
      if (response && 'error' in response && response.error) {
        toast.error(response.error.message || 'No se pudo cerrar la sesión');
        setIsSigningOut(false);
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('Error al cerrar sesión. Intenta nuevamente.');
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className='w-64 p-1.5' align={align} sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center gap-3 rounded-sm px-2 py-2 font-normal'>
            <Avatar className='size-9 shrink-0 after:border-foreground/10'>
              {userImage ? <AvatarImage src={userImage} alt={displayName} /> : null}
              <AvatarFallback className='bg-foreground text-background text-xs font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between gap-2'>
                <p className='truncate text-sm font-semibold text-foreground'>{displayName}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium leading-none',
                    isAdmin
                      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {ROLE_LABELS[resolvedRole].compact}
                </span>
              </div>
              {displayEmail ? (
                <p className='mt-0.5 truncate text-xs text-muted-foreground'>{displayEmail}</p>
              ) : null}
              {username ? (
                <p className='mt-0.5 truncate text-xs text-muted-foreground/80'>@{username}</p>
              ) : null}
              {!displayEmail && !username ? (
                <p className='mt-0.5 truncate text-xs text-muted-foreground'>Sesión activa</p>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='-mx-1.5 my-1' />

        <DropdownMenuGroup>
          {quickLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href} aria-current={isActive ? 'page' : undefined} />}
                className={cn(
                  'cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-sm',
                  isActive && 'bg-accent font-medium text-accent-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 group-focus/dropdown-menu-item:text-accent-foreground',
                    isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                  )}
                />
                <span className='truncate'>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='-mx-1.5 my-1' />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant='destructive'
            disabled={isSigningOut}
            closeOnClick={false}
            onClick={handleSignOut}
            className='cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium'
          >
            {isSigningOut ? (
              <Loader2Icon className='size-4 animate-spin' />
            ) : (
              <LogOutIcon className='size-4' />
            )}
            <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
