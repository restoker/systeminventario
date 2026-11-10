import { seedTiposPago, SeedOptions } from "./tipo-pago-seed";
import { seedTiposComprobante } from "./tipo-comprobante-seed";
import { seedUsuarios } from "./usuarios-seed";

export * from "./tipo-pago-seed";
export * from "./tipo-comprobante-seed";
export * from "./usuarios-seed";

export type { SeedOptions };

/**
 * Agrupador y ejecutor de todos los seeds de la base de datos.
 *
 * NOTA: Por defecto (`clean: true`), elimina la data anterior de cada entidad
 * antes de insertar la data del seed para asegurar un estado fresco y libre de conflictos.
 *
 * Ejecuta de forma secuencial la siembra de:
 * 1. Tipos de Pago (Efectivo, Tarjeta, PLIN, YAPE, Depósito, Falta pagar)
 * 2. Tipos de Comprobante (Factura, Boleta, Ticket, Liquidación de Compra, Sin Comprobante)
 * 3. Usuarios base (Admin y Vendedor)
 *
 * Puedes agregar más seeds creando su archivo respectivo y llamándolo aquí.
 */
export const runAllSeeds = async (options: SeedOptions = { clean: true }) => {
    const isClean = options.clean ?? true;
    console.log(`🌱 [Seeds] Iniciando ejecución de seeds de la base de datos (Limpiar data anterior: ${isClean ? 'SÍ' : 'NO'})...\n`);

    const results = {
        tiposPago: await seedTiposPago({ clean: isClean }),
        tiposComprobante: await seedTiposComprobante({ clean: isClean }),
        usuarios: await seedUsuarios({ clean: isClean }),
        // Agrega aquí llamadas a futuros seeds del sistema:
        // tiposDocumento: await seedTiposDocumento({ clean: isClean }),
        // categorias: await seedCategorias({ clean: isClean }),
    };

    console.log("\n✅ [Seeds] Ejecución finalizada:");
    Object.entries(results).forEach(([key, res]) => {
        console.log(` - ${key}: ${res.msg}`);
    });

    return results;
};

// Permite ejecutar directamente el archivo con: npm run db:seed o npx tsx server/seed/index.ts
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('server/seed')) {
    runAllSeeds({ clean: true })
        .then(() => {
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Error ejecutando seeds:", err);
            process.exit(1);
        });
}
