import { api } from "@/lib/auth";
import db from "@/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { StoreIcon } from "lucide-react";
import SidebarAux from "../../_ui/Sidebar";
import SelectSucursal from "../caja/_ui/SelectSucursal";
import AbrirCajaView from "../caja/_ui/AbrirCajaView";
import PosTerminal, { PosStockItem } from "./_ui/PosTerminal";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        sucursalId?: string;
    }>;
}

export default async function PosPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect("/login");

    const params = await searchParams;
    const sucursalId = params?.sucursalId;

    if (session.user.role === 'admin') {
        // ADMIN PART: El administrador puede elegir en qué local vender
        const sucursales = await db.query.sucursal.findMany({
            orderBy: { nombre: 'asc' },
        });

        // Buscar si la sucursal seleccionada existe
        const selectedSucursal = sucursalId
            ? sucursales.find((s) => s.id === sucursalId)
            : null;

        // Si no se ha elegido sucursal, mostrar la pantalla para elegir sucursal
        if (!selectedSucursal) {
            return (
                <SidebarAux>
                    <SelectSucursal
                        sucursales={sucursales}
                        targetUrl="/dashboard/pos"
                        moduleName="Punto de Venta"
                        title="Punto de Venta (POS) - Selección de Local"
                        subtitle="Selecciona la tienda o sucursal donde deseas operar las ventas en el POS."
                        actionLabel="Ingresar al POS"
                    />
                </SidebarAux>
            );
        }

        // Validar si hay una caja abierta para la sucursal seleccionada
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

        // Si NO hay una caja abierta, obligar a abrir la caja para poder vender en el POS
        if (!cajaAbierta) {
            return (
                <SidebarAux>
                    <AbrirCajaView
                        sucursal={selectedSucursal}
                        sucursales={sucursales}
                        canChangeSucursal={true}
                        returnUrl="/dashboard/pos"
                        moduleName="Punto de Venta"
                        description="Para poder realizar ventas en el Punto de Venta (POS) en esta sucursal, es indispensable abrir la caja primero."
                    />
                </SidebarAux>
            );
        }

        // Si hay una caja abierta, cargar los productos de dicha tienda según stock_sucursal
        const stocks = await db.query.stockSucursal.findMany({
            where: { sucursalId: selectedSucursal.id },
            with: {
                producto: {
                    with: {
                        categoria: true,
                        marca: true,
                        unidad: true,
                        proveedor: true,
                        igv: true,
                        imagenes: true,
                    }
                }
            },
            orderBy: { cantidad: 'desc' }
        });

        return (
            <SidebarAux>
                <PosTerminal
                    sucursal={selectedSucursal}
                    sucursales={sucursales}
                    caja={cajaAbierta}
                    usuario={session.user}
                    stocks={stocks as unknown as PosStockItem[]}
                    canChangeSucursal={true}
                />
            </SidebarAux>
        );
    } else if (session.user.role === 'saler') {
        // SALER PART: El vendedor opera en su sucursal asignada
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
                            Tu usuario de vendedor no tiene una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para acceder al Punto de Venta.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        const sucursal = usuarioSucursal.sucursal;

        // Validar si hay una caja abierta para la sucursal del vendedor
        const cajaAbierta = await db.query.caja.findFirst({
            where: {
                AND: [
                    { estado: 'abierto' },
                    { sucursalId: sucursal.id },
                ]
            },
            with: {
                usuario: true,
            }
        });

        // Si NO hay caja abierta en su sucursal, mostrar pantalla para abrir la caja
        if (!cajaAbierta) {
            return (
                <SidebarAux>
                    <AbrirCajaView
                        sucursal={sucursal}
                        canChangeSucursal={false}
                        returnUrl="/dashboard/pos"
                        moduleName="Punto de Venta"
                        description="Para poder realizar ventas en el Punto de Venta (POS) en tu sucursal, debes abrir la caja primero."
                    />
                </SidebarAux>
            );
        }

        // Si hay una caja abierta, cargar los productos de dicha tienda según stock_sucursal
        const stocks = await db.query.stockSucursal.findMany({
            where: { sucursalId: sucursal.id },
            with: {
                producto: {
                    with: {
                        categoria: true,
                        marca: true,
                        unidad: true,
                        proveedor: true,
                        igv: true,
                        imagenes: true,
                    }
                }
            },
            orderBy: { cantidad: 'desc' }
        });

        return (
            <SidebarAux>
                <PosTerminal
                    sucursal={sucursal}
                    caja={cajaAbierta}
                    usuario={session.user}
                    stocks={stocks as unknown as PosStockItem[]}
                    canChangeSucursal={false}
                />
            </SidebarAux>
        );
    } else {
        return notFound();
    }
}
