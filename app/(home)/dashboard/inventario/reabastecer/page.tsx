import { api } from "@/lib/auth";
import db from "@/server";
import { tipoComprobante } from "@/server/schema/tipo-comprobante";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { StoreIcon } from "lucide-react";
import SidebarAux from "../../../_ui/Sidebar";
import SelectSucursal from "../../caja/_ui/SelectSucursal";
import AbrirCajaView from "../../caja/_ui/AbrirCajaView";
import FormReabastecer from "./_ui/FormReabastecer";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        sucursalId?: string;
        productoId?: string;
    }>;
}

export default async function ReabastecerPage({ searchParams }: PageProps) {
    const session = await api.getSession({ headers: await headers() });

    if (!session?.user) return redirect("/login");

    const params = await searchParams;
    let sucursalId = params?.sucursalId;
    const productoId = params?.productoId;

    // Si no se proporcionó sucursalId pero sí productoId,
    // buscar en stockSucursal para conocer a qué sucursal pertenece dicho producto
    if (!sucursalId && productoId) {
        const stockRecord = await db.query.stockSucursal.findFirst({
            where: {
                productoId: productoId
            },
            with: {
                sucursal: true
            }
        });

        if (stockRecord?.sucursalId) {
            sucursalId = stockRecord.sucursalId;
        }
    }

    // Si el usuario es vendedor (saler), validar su sucursal asignada
    if (session.user.role === 'saler') {
        const usuarioSucursal = await db.query.usuarioSucursal.findFirst({
            where: { userId: session.user.id },
            with: {
                sucursal: true
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
                            Tu usuario de vendedor no tiene una sucursal asignada. Por favor, solicita a un administrador que te asigne a una sede para reabastecer el inventario.
                        </p>
                    </div>
                </SidebarAux>
            );
        }

        sucursalId = usuarioSucursal.sucursalId;
    }

    // Si el usuario es administrador y no tiene sucursal definida aún, mostrar selector de sucursal
    if (session.user.role === 'admin' && !sucursalId) {
        const sucursales = await db.query.sucursal.findMany({
            orderBy: { nombre: 'asc' }
        });

        const targetUrl = productoId
            ? `/dashboard/inventario/reabastecer?productoId=${productoId}`
            : '/dashboard/inventario/reabastecer';

        return (
            <SidebarAux>
                <SelectSucursal
                    sucursales={sucursales}
                    targetUrl={targetUrl}
                    moduleName="Reabastecer Inventario"
                    title="Reabastecer Inventario - Selección de Sucursal"
                    subtitle="Selecciona la sucursal donde ingresarás la mercadería para verificar el estado de la caja."
                    actionLabel="Continuar a Reabastecer"
                />
            </SidebarAux>
        );
    }

    // Obtener la sucursal seleccionada
    const sucursales = await db.query.sucursal.findMany({
        orderBy: { nombre: 'asc' }
    });

    const selectedSucursal = sucursales.find((s) => s.id === sucursalId);

    if (!selectedSucursal) {
        return notFound();
    }

    // 1. Validar si hay una caja abierta en la sucursal elegida
    const cajaAbierta = await db.query.caja.findFirst({
        where: {
            AND: [
                { estado: 'abierto' },
                { sucursalId: selectedSucursal.id }
            ]
        },
        with: {
            usuario: true
        }
    });

    // 2. Si NO hay una caja abierta, mostrar la pantalla de Abrir Caja
    if (!cajaAbierta) {
        const returnUrl = `/dashboard/inventario/reabastecer?sucursalId=${selectedSucursal.id}${productoId ? `&productoId=${productoId}` : ''}`;

        return (
            <SidebarAux>
                <AbrirCajaView
                    sucursal={selectedSucursal}
                    sucursales={sucursales}
                    canChangeSucursal={session.user.role === 'admin'}
                    returnUrl={returnUrl}
                    moduleName="Reabastecimiento de Inventario"
                    description={`Para realizar operaciones de reabastecimiento o ingreso de mercadería en la sucursal "${selectedSucursal.nombre}", es necesario que la caja se encuentre abierta.`}
                />
            </SidebarAux>
        );
    }

    // 3. Cargar tipos de comprobante (sembrar catálogo base si aún está vacío)
    const allTiposComprobante = await db.query.tipoComprobante.findMany({
        orderBy: { nombre: 'asc' }
    });
    // TODO: Verificar esto, en el backend ya esta el seteo de esto
    // if (allTiposComprobante.length === 0) {
    //     await db.insert(tipoComprobante).values([
    //         { nombre: 'Factura', estado: true, serie: 'F001', numero: '00000000', nombreSunat: 'FACTURA ELECTRÓNICA', correlative: 0 },
    //         { nombre: 'Boleta', estado: true, serie: 'B001', numero: '00000000', nombreSunat: 'BOLETA DE VENTA ELECTRÓNICA', correlative: 0 },
    //         { nombre: 'Ticket', estado: true, serie: 'T001', numero: '00000000', nombreSunat: 'TICKET DE COMPRA', correlative: 0 },
    //         { nombre: 'Liquidación de Compra', estado: true, serie: 'E001', numero: '00000000', nombreSunat: 'LIQUIDACIÓN DE COMPRA ELECTRÓNICA', correlative: 0 },
    //         { nombre: 'Sin Comprobante', estado: true, serie: 'S001', numero: '00000000', nombreSunat: 'SIN COMPROBANTE', correlative: 0 },
    //     ]);
    //     allTiposComprobante = await db.query.tipoComprobante.findMany({
    //         orderBy: { nombre: 'asc' }
    //     });
    // }

    const tiposComprobante = allTiposComprobante.filter((t) => t.estado !== false);

    // 4. Cargar datos de producto inicial, existencias de toda la sucursal, proveedores y catálogo
    const [selectedProduct, stocksSucursal, proveedores, tipoDocumentos, allProducts] = await Promise.all([
        productoId
            ? db.query.products.findFirst({
                where: { id: productoId },
                with: {
                    categoria: true,
                    marca: true,
                    unidad: true,
                    proveedor: true,
                    imagenes: true
                }
            })
            : Promise.resolve(null),
        db.query.stockSucursal.findMany({
            where: { sucursalId: selectedSucursal.id }
        }),
        db.query.proveedor.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        }),
        db.query.tipoDocumento.findMany({
            where: { estado: true },
            orderBy: { nombre: 'asc' }
        }),
        db.query.products.findMany({
            with: {
                categoria: true,
                marca: true,
                unidad: true,
                proveedor: true,
                imagenes: true
            },
            orderBy: { name: 'asc' }
        }),
    ]);

    return (
        <SidebarAux>
            <FormReabastecer
                sucursal={selectedSucursal}
                sucursales={sucursales}
                caja={cajaAbierta}
                productoInicial={selectedProduct || null}
                stocksSucursal={stocksSucursal}
                proveedores={proveedores}
                tipoDocumentos={tipoDocumentos}
                tiposComprobante={tiposComprobante}
                productosDisponibles={allProducts}
                canChangeSucursal={session.user.role === 'admin'}
            />
        </SidebarAux>
    );
}
