import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { Store } from 'lucide-react';

import { api } from '@/lib/auth';
import db from '@/server';
import { sucursal } from '@/server/schema/sucursal';
import { getClientesDirectory } from '@/server/queries/clientes';
import SidebarAux from '@/app/(home)/_ui/Sidebar';
import {
    ClienteOrdenFiltro,
    ClienteSegmentoFiltro,
    ClienteSucursalOption,
} from '@/interfaces/clientes';
import TablaClientes from './_ui/TablaClientes';

export const dynamic = 'force-dynamic';

const VALID_SEGMENTOS = new Set<ClienteSegmentoFiltro>([
    'all',
    'empresa',
    'persona',
    'con_saldo',
    'sin_documento',
]);

const VALID_SORTS = new Set<ClienteOrdenFiltro>([
    'ultima_compra',
    'mayor_gasto',
    'mas_compras',
    'saldo_pendiente',
    'nombre',
]);

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        search?: string;
        segmento?: string;
        sucursalId?: string;
        sortBy?: string;
    }>;
}

export default async function ClientesPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) {
        return redirect('/login');
    }

    const isAdmin = session.user.role === 'admin';
    const role = isAdmin ? 'admin' : 'saler';

    const params = await searchParams;
    const requestedPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(params.pageSize || '20', 10) || 20));
    const search = params.search?.trim() || '';

    const rawSegmento = params.segmento?.trim() as ClienteSegmentoFiltro | undefined;
    const segmento: ClienteSegmentoFiltro =
        rawSegmento && VALID_SEGMENTOS.has(rawSegmento) ? rawSegmento : 'all';

    const rawSortBy = params.sortBy?.trim() as ClienteOrdenFiltro | undefined;
    const sortBy: ClienteOrdenFiltro =
        rawSortBy && VALID_SORTS.has(rawSortBy) ? rawSortBy : 'ultima_compra';

    let sucursalId = params.sucursalId?.trim() || 'all';
    let sucursales: ClienteSucursalOption[] = [];

    if (!isAdmin) {
        const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
            where: { userId: session.user.id },
            with: {
                sucursal: true,
            },
        });

        if (!usuarioSucursal || !usuarioSucursal.sucursal) {
            return (
                <SidebarAux role={role}>
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-amber-500/12 p-3 text-amber-700 dark:text-amber-300 mb-3">
                            <Store className="size-6" />
                        </div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Sin sucursal asignada
                        </h1>
                        <p className="text-[15px] text-muted-foreground mt-1.5 max-w-md leading-relaxed">
                            Tu cuenta de vendedor aún no tiene una sucursal asignada. Solicita a un administrador que te asigne una sede para consultar clientes.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
        sucursales = [
            {
                id: usuarioSucursal.sucursal.id,
                nombre: usuarioSucursal.sucursal.nombre,
                codigo: usuarioSucursal.sucursal.codigo,
            },
        ];
    } else {
        sucursales = await db
            .select({
                id: sucursal.id,
                nombre: sucursal.nombre,
                codigo: sucursal.codigo,
            })
            .from(sucursal)
            .where(eq(sucursal.activo, true))
            .orderBy(asc(sucursal.nombre));
    }

    const { filteredClientes, metrics } = await getClientesDirectory({
        search,
        segmento,
        sucursalId,
        sortBy,
    });

    const totalCount = filteredClientes.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const offset = (currentPage - 1) * pageSize;
    const paginatedClientes = filteredClientes.slice(offset, offset + pageSize);

    return (
        <SidebarAux role={role}>
            <TablaClientes
                clientes={paginatedClientes}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                metrics={metrics}
                sucursales={sucursales}
                isAdmin={isAdmin}
                filters={{
                    search,
                    segmento,
                    sucursalId,
                    sortBy,
                }}
            />
        </SidebarAux>
    );
}
