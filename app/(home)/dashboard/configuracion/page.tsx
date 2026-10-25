import SidebarAux from "../../_ui/Sidebar";
import db from "@/server";
import { igv } from "@/server/schema/igv";
import { tipoDocumento } from "@/server/schema/tipo-documento";
import { configuracion } from "@/server/schema/configuracion";
import ConfiguracionClient from "./_ui/ConfiguracionClient";

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
    // 1. Obtener tasa actual de IGV (crear por defecto 18% si no existe)
    let currentIgv = await db.query.igv.findFirst({
        orderBy: (i, { desc }) => [desc(i.createdAt)],
    });

    if (!currentIgv) {
        const [defaultIgv] = await db.insert(igv).values({
            value: 0.18,
            isActive: true,
        }).returning();
        currentIgv = defaultIgv;
    }

    // 2. Obtener tipos de documento (sembrar DNI, RUC, CE, Pasaporte si la tabla está vacía)
    let docs = await db.query.tipoDocumento.findMany({
        orderBy: (d, { asc }) => [asc(d.nombre)],
    });

    if (docs.length === 0) {
        await db.insert(tipoDocumento).values([
            { nombre: 'DNI', estado: true },
            { nombre: 'RUC', estado: true },
            { nombre: 'Carnet de Extranjería', estado: true },
            { nombre: 'Pasaporte', estado: true },
        ]);
        docs = await db.query.tipoDocumento.findMany({
            orderBy: (d, { asc }) => [asc(d.nombre)],
        });
    }

    // 3. Obtener configuración de recargos y comisiones (crear defaults 5% y 3% si no existen)
    let config = await db.query.configuracion.findFirst({
        orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    if (!config) {
        const [defaultConfig] = await db.insert(configuracion).values({
            recargoTarjeta: 0.05,
            comisionVendedor: 0.03,
        }).returning();
        config = defaultConfig;
    }

    return (
        <SidebarAux>
            <div className='p-4 sm:p-6 lg:p-8 w-full'>
                <ConfiguracionClient
                    initialIgv={currentIgv}
                    initialTiposDocumento={docs}
                    initialConfiguracion={config}
                />
            </div>
        </SidebarAux>
    );
}