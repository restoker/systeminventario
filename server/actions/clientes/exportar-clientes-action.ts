'use server';

import { headers } from 'next/headers';

import { api } from '@/lib/auth';
import db from '@/server';
import { getClientesDirectory } from '@/server/queries/clientes';
import { ClientesFilters } from '@/interfaces/clientes';

function escapeCsvCell(value: string | number | null | undefined): string {
    const str = value === null || value === undefined ? '' : String(value);
    return `"${str.replace(/"/g, '""')}"`;
}

export async function exportarClientesCSVAction(filters: Partial<ClientesFilters>) {
    try {
        const session = await api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: 'No autorizado. Por favor inicia sesión.' };
        }

        let scopedSucursalId = filters.sucursalId || 'all';
        if (session.user.role === 'saler') {
            const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
                where: { userId: session.user.id },
            });
            if (!usuarioSucursal) {
                return { success: false, error: 'Usuario vendedor sin sucursal asignada.' };
            }
            scopedSucursalId = usuarioSucursal.sucursalId;
        }

        const { filteredClientes } = await getClientesDirectory({
            search: filters.search ?? '',
            segmento: filters.segmento ?? 'all',
            sucursalId: scopedSucursalId,
            sortBy: filters.sortBy ?? 'ultima_compra',
        });

        if (filteredClientes.length === 0) {
            return {
                success: false,
                error: 'No se encontraron clientes con los filtros aplicados.',
            };
        }

        const headersRow = [
            'Cliente / Razón Social',
            'Categoría',
            'Tipo Doc.',
            'Número Documento',
            'Teléfono',
            'Dirección',
            'Sucursal Principal',
            'Todas las Sucursales',
            'Compras',
            'Unidades Compradas',
            'Total Gastado (S/)',
            'Ticket Promedio (S/)',
            'Saldo Pendiente (S/)',
            'Descuentos Aplicados (S/)',
            'Última Compra',
            'Hora Última Compra',
        ];

        const csvRows = filteredClientes.map((cliente) => {
            const categoriaLabel =
                cliente.categoria === 'empresa'
                    ? 'Empresa'
                    : cliente.categoria === 'varios'
                      ? 'Público General'
                      : 'Persona Natural';

            return [
                escapeCsvCell(cliente.nombre),
                escapeCsvCell(categoriaLabel),
                escapeCsvCell(cliente.tipoDocumentoNombre || '-'),
                escapeCsvCell(cliente.numeroDocumento || 'Sin documento'),
                escapeCsvCell(cliente.telefono || '-'),
                escapeCsvCell(cliente.direccion || '-'),
                escapeCsvCell(cliente.sucursalPrincipalNombre),
                escapeCsvCell(cliente.sucursalesNombres.join(' · ')),
                cliente.totalCompras,
                cliente.totalProductos,
                cliente.totalGastado.toFixed(2),
                cliente.ticketPromedio.toFixed(2),
                cliente.totalPendiente.toFixed(2),
                cliente.totalDescuentos.toFixed(2),
                escapeCsvCell(cliente.ultimaCompraFormateada),
                escapeCsvCell(cliente.ultimaCompraHora),
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headersRow.join(','), ...csvRows].join('\n');

        return {
            success: true,
            csvContent,
            count: filteredClientes.length,
        };
    } catch (error) {
        console.error('Error al exportar clientes CSV:', error);
        return { success: false, error: 'Error inesperado al generar el archivo CSV.' };
    }
}
