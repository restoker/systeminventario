import { api } from "@/lib/auth";
import db from "@/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { StoreIcon } from "lucide-react";
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
            with: {
                sucursal: true,
            }
        });

        if (!usuarioSucursal || !usuarioSucursal.sucursal) {
            return (
                <SidebarAux>
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                        <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 mb-3">
                            <StoreIcon className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Sin Sucursal Asignada</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Tu usuario de vendedor no tiene una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sucursal para poder operar la caja.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        const sucursal = usuarioSucursal.sucursal;

        // Consultar si hay una caja abierta para la sucursal del vendedor
        const caja = await db.query.caja.findFirst({
            where: {
                AND: [
                    { estado: 'abierto' },
                    { sucursalId: sucursal.id }
                ]
            },
            with: {
                usuario: true,
            }
        });

        // Si no hubiera una caja abierta, mostrar pantalla para abrir la caja
        if (!caja) {
            return (
                <SidebarAux>
                    <AbrirCajaView
                        sucursal={sucursal}
                        canChangeSucursal={false}
                    />
                </SidebarAux>
            );
        }

        // Si hay una caja abierta, llevarle a dicha caja (pantalla solo con título por el momento)
        return (
            <SidebarAux>
                <CajaAbiertaView
                    sucursal={sucursal}
                    caja={caja}
                    canChangeSucursal={false}
                />
            </SidebarAux>
        );
    } else {
        return notFound();
    }
}
