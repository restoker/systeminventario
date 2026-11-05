import { api } from "@/lib/auth";
import db from "@/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SidebarAux from "../../_ui/Sidebar";
import SelectSucursal from "./_ui/SelectSucursal";
import AbrirCajaView from "./_ui/AbrirCajaView";
import CajaAbiertaView from "./_ui/CajaAbiertaView";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        sucursalId?: string;
    }>;
}

export default async function CajaPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect("/login");

    const params = await searchParams;
    const sucursalId = params?.sucursalId;

    if (session.user.role === 'admin') {
        // ADMIN PART
        const sucursales = await db.query.sucursal.findMany({
            orderBy: { nombre: 'asc' },
        });

        // Buscar si la sucursal seleccionada existe
        const selectedSucursal = sucursalId
            ? sucursales.find((s) => s.id === sucursalId)
            : null;

        // Si no se ha elegido sucursal o no existe en la BD, mostrar pantalla para elegir sucursal
        if (!selectedSucursal) {
            return (
                <SidebarAux>
                    <SelectSucursal sucursales={sucursales} />
                </SidebarAux>
            );
        }

        // Consultar si hay una caja abierta para la sucursal seleccionada
        const cajaAbierta = await db.query.caja.findFirst({
            where: {
                AND: [
                    { estado: 'abierto' },
                    { sucursalId: selectedSucursal.id },
                ]
            },
            with: {
                usuario: true,
            }
        });

        // Si hay una caja abierta, mostrar pantalla de caja abierta (solo título por el momento)
        if (cajaAbierta) {
            return (
                <SidebarAux>
                    <CajaAbiertaView
                        sucursal={selectedSucursal}
                        sucursales={sucursales}
                        caja={cajaAbierta}
                    />
                </SidebarAux>
            );
        }

        // Si no hay caja abierta, mostrar pantalla con la opción de abrir nueva caja
        return (
            <SidebarAux>
                <AbrirCajaView
                    sucursal={selectedSucursal}
                    sucursales={sucursales}
                />
            </SidebarAux>
        );
    } else if (session.user.role === 'saler') {
        // SALER PART
        const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
            where: { userId: session.user.id },
        });

        if (!usuarioSucursal) return notFound();
        const caja = await db.query.caja.findFirst({
            where: { AND: [{ estado: 'abierto' }, { sucursalId: usuarioSucursal.sucursalId }] }
        });
        if (!caja) {
            return (
                <SidebarAux>
                    <div className="text-2xl font-bold bg-red-300">Abrir caja</div>
                </SidebarAux>
            );
        }

        const ventas = await db.query.venta.findMany({
            where: { cajaId: caja.id },
        });

        return (
            <SidebarAux>
                <div className="p-6">
                    <h1 className="text-2xl font-bold">Caja Abierta</h1>
                </div>
            </SidebarAux>
        );
    } else {
        return notFound();
    }
}
