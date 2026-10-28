import { UsersIcon, ShieldCheckIcon, StoreIcon, CheckCircle2Icon } from 'lucide-react';

import db from "@/server";
import SidebarAux from "@/app/(home)/_ui/Sidebar";
import TablaUsuarios from "./_ui/TablaUsuarios";

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
    const usuarios = await db.query.users.findMany({
        orderBy: { createdAt: 'desc' },
        with: {
            sucursales: true
        }
    });

    const sucursales = await db.query.sucursal.findMany({
        where: { activo: { eq: true } },
        columns: { id: true, nombre: true, codigo: true },
        orderBy: { nombre: 'asc' }
    });

    const totalUsuarios = usuarios.length;
    const totalAdmins = usuarios.filter(u => u.role === 'admin').length;
    const totalVendedores = usuarios.filter(u => u.role === 'saler').length;
    const totalVerificados = usuarios.filter(u => u.emailVerified).length;

    return (
        <SidebarAux>
            <div className='flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'>
                {/* Header de la página */}
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                            <span>Dashboard</span>
                            <span>/</span>
                            <span className='text-foreground font-medium'>Usuarios</span>
                        </div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            Directorio de Usuarios
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1 max-w-2xl'>
                            Gestión centralizada de credenciales, roles de acceso al sistema y asignación de sucursales operativas.
                        </p>
                    </div>
                </div>

                {/* Resumen de Métricas */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-primary/10 text-primary shrink-0'>
                            <UsersIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Total Usuarios</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalUsuarios}</span>
                        </div>
                    </div>

                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0'>
                            <ShieldCheckIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Administradores</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalAdmins}</span>
                        </div>
                    </div>

                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0'>
                            <StoreIcon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Vendedores</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalVendedores}</span>
                        </div>
                    </div>

                    <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
                        <div className='rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
                            <CheckCircle2Icon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <span className='text-xs text-muted-foreground block truncate'>Verificados</span>
                            <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalVerificados}</span>
                        </div>
                    </div>
                </div>

                {/* Datatable de Usuarios */}
                <TablaUsuarios usuarios={usuarios} sucursales={sucursales} />
            </div>
        </SidebarAux>
    );
}