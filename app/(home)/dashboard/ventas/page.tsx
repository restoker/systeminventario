import db from "@/server";
import SidebarAux from "../../_ui/Sidebar";
import { api } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function VentasPage() {
    const session = await api.getSession({ headers: await headers() });
    if (!session) {
        notFound();
    }
    const user = await session.user;
    const products = await db.query.stockSucursal.findMany();

    if (user.role === "admin") {


    } else if (user.role === "saler") {

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

    }
    return (
        <SidebarAux>
            <h1>Ventas</h1>
        </SidebarAux>
    );
}