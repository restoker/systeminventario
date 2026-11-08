'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { products } from '@/server/schema/products';
import { kardex } from '@/server/schema/kardex';
import { compra } from '@/server/schema/compras';
import { productosCompras } from '@/server/schema/producto-compra';
import { egresos } from '@/server/schema/egreso';
import { api } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { reabastecerSchema } from '@/types/reabastecer-schema';

export const reabastecerAction = actionClient
    .inputSchema(reabastecerSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const {
                sucursalId,
                proveedorId,
                tipoComprobanteId,
                numeroComprobante,
                fechaComprobante,
                aCredito,
                numeroDiasCredito,
                motivo,
                items,
            } = parsedInput;

            // 1. Validar que la caja de la sucursal esté abierta
            const cajaAbierta = await db.query.caja.findFirst({
                where: {
                    AND: [
                        { estado: 'abierto' },
                        { sucursalId: sucursalId }
                    ]
                }
            });

            if (!cajaAbierta) {
                return {
                    ok: false,
                    msg: 'Operación denegada: La caja de esta sucursal no se encuentra abierta.'
                };
            }

            // 2. Validar proveedor y tipo de comprobante
            const proveedorExiste = await db.query.proveedor.findFirst({
                where: { id: proveedorId }
            });

            if (!proveedorExiste || proveedorExiste.activo === false) {
                return {
                    ok: false,
                    msg: 'El proveedor seleccionado no existe o se encuentra inactivo.'
                };
            }

            const tipoComprobanteExiste = await db.query.tipoComprobante.findFirst({
                where: { id: tipoComprobanteId }
            });

            if (!tipoComprobanteExiste) {
                return {
                    ok: false,
                    msg: 'El tipo de comprobante seleccionado no es válido.'
                };
            }

            // 3. Validar que todos los productos existan
            const productIds = items.map((item) => item.productoId);
            const existingProducts = await db
                .select({ id: products.id })
                .from(products)
                .where(inArray(products.id, productIds));

            if (existingProducts.length !== productIds.length) {
                return {
                    ok: false,
                    msg: 'Uno o más productos seleccionados no existen en el catálogo.'
                };
            }

            // 4. Calcular totales y normalizar fechas
            const montoTotal = Number(
                items.reduce((acc, item) => acc + item.cantidad * item.costoUnitario, 0).toFixed(2)
            );
            const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);
            const cleanComprobante = numeroComprobante.trim() || 'S/N';
            const parsedDate = fechaComprobante ? new Date(`${fechaComprobante}T12:00:00`) : new Date();
            const fechaValida = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

            // 5. Ejecutar registro atómico: compra, productosCompras, stock, kardex y egreso (si no es a crédito)
            const compraRegistrada = await db.transaction(async (tx) => {
                // 5.1 Insertar cabecera de compra
                const [nuevaCompra] = await tx
                    .insert(compra)
                    .values({
                        monto: montoTotal,
                        numeroComprobante: cleanComprobante,
                        isACredito: aCredito,
                        numeroDiasCredito: aCredito ? (numeroDiasCredito ?? null) : null,
                        fechaComprobante: fechaValida,
                        estado: aCredito ? 'pendiente' : 'pagado',
                        tipoComprobanteId: tipoComprobanteExiste.id,
                        userId: session.user.id,
                        cajaId: cajaAbierta.id,
                        proveedorId: proveedorExiste.id,
                        sucursalId: sucursalId,
                    })
                    .returning();

                // 5.2 Insertar detalle de productos de la compra (productosCompras)
                await tx.insert(productosCompras).values(
                    items.map((item) => ({
                        compraId: nuevaCompra.id,
                        productoId: item.productoId,
                        cantidad: item.cantidad,
                        precio: item.costoUnitario,
                    }))
                );

                // 5.3 Actualizar stock_sucursal, catálogo de productos y registrar kardex por cada producto
                for (const item of items) {
                    const [existingStock] = await tx
                        .select()
                        .from(stockSucursal)
                        .where(
                            and(
                                eq(stockSucursal.productoId, item.productoId),
                                eq(stockSucursal.sucursalId, sucursalId)
                            )
                        )
                        .limit(1);

                    const stockAnterior = existingStock?.cantidad ?? 0;
                    const stockActual = stockAnterior + item.cantidad;

                    if (existingStock) {
                        await tx
                            .update(stockSucursal)
                            .set({
                                cantidad: sql`${stockSucursal.cantidad} + ${item.cantidad}`,
                                updatedAt: new Date(),
                            })
                            .where(eq(stockSucursal.id, existingStock.id));
                    } else {
                        await tx.insert(stockSucursal).values({
                            productoId: item.productoId,
                            sucursalId,
                            cantidad: item.cantidad,
                            stockMinimo: 5,
                        });
                    }

                    // Actualizar precio de compra y proveedor en el producto maestro
                    const productUpdates: Record<string, unknown> = {
                        proveedorId: proveedorExiste.id,
                        updatedAt: new Date(),
                    };

                    if (item.costoUnitario > 0) {
                        productUpdates.precioCompra = item.costoUnitario;
                    }

                    await tx
                        .update(products)
                        .set(productUpdates)
                        .where(eq(products.id, item.productoId));

                    // Registrar movimiento de entrada en Kardex vinculado a la compra
                    const [lastKardex] = await tx
                        .select({ secuencia: kardex.secuencia })
                        .from(kardex)
                        .where(
                            and(
                                eq(kardex.productoId, item.productoId),
                                eq(kardex.sucursalId, sucursalId)
                            )
                        )
                        .orderBy(desc(kardex.secuencia))
                        .limit(1);

                    const secuencia = (lastKardex?.secuencia ?? 0) + 1;

                    await tx.insert(kardex).values({
                        secuencia,
                        tipoMovimiento: 'ENTRADA',
                        motivo: 'COMPRA',
                        detalleMotivo:
                            motivo?.trim() ||
                            `Compra ${aCredito ? 'a crédito' : 'al contado'} (${cleanComprobante})`,
                        origenTipo: 'INGRESO',
                        origenId: nuevaCompra.id,
                        cantidad: item.cantidad,
                        stockAnterior,
                        stockActual,
                        costoUnitario: item.costoUnitario.toFixed(4),
                        costoPromedio: item.costoUnitario.toFixed(4),
                        comprobanteRef: cleanComprobante,
                        productoId: item.productoId,
                        sucursalId,
                        usuarioId: session.user.id,
                    });
                }

                // 5.4 Si la compra NO es a crédito, registrar la salida de dinero como egreso en la caja abierta
                if (!aCredito) {
                    const nombreTipo = tipoComprobanteExiste.nombre.toLowerCase();
                    const tipoDocEgreso: 'ticket' | 'boleta' | 'factura' | 'cheque' | 'sin comprobante' =
                        nombreTipo.includes('factura')
                            ? 'factura'
                            : nombreTipo.includes('boleta')
                            ? 'boleta'
                            : nombreTipo.includes('ticket')
                            ? 'ticket'
                            : nombreTipo.includes('cheque')
                            ? 'cheque'
                            : 'sin comprobante';

                    let serieEgreso: string | null = null;
                    let numeroEgreso: string | null = cleanComprobante;

                    if (cleanComprobante.includes('-')) {
                        const [seriePart, ...numParts] = cleanComprobante.split('-');
                        serieEgreso = seriePart.trim() || null;
                        numeroEgreso = numParts.join('-').trim() || null;
                    } else if (tipoComprobanteExiste.serie) {
                        serieEgreso = tipoComprobanteExiste.serie;
                    }

                    const nombreProveedor = proveedorExiste.razonSocial || proveedorExiste.nombre;
                    const descripcionEgreso =
                        motivo?.trim() ||
                        `Compra de mercadería (${items.length} prod. / ${totalUnidades} unid.) - Prov: ${nombreProveedor}`;

                    await tx.insert(egresos).values({
                        tipoDocumento: tipoDocEgreso,
                        motivo: 'compras',
                        serie: serieEgreso,
                        numero: numeroEgreso,
                        fecha: fechaValida,
                        descripcion: descripcionEgreso,
                        monto: montoTotal,
                        estado: 'activo',
                        cajaId: cajaAbierta.id,
                        createdByUserId: session.user.id,
                    });
                }

                return nuevaCompra;
            });

            // 6. Revalidar rutas afectadas
            revalidatePath('/dashboard/inventario');
            revalidatePath('/dashboard/inventario/reabastecer');
            revalidatePath('/dashboard/pos');
            revalidatePath('/dashboard/productos');
            revalidatePath('/dashboard/caja');

            return {
                ok: true,
                compraId: compraRegistrada.id,
                msg: aCredito
                    ? `Compra a crédito registrada (${items.length} ${items.length === 1 ? 'producto' : 'productos'}, ${totalUnidades} unid.). No se generó egreso en caja.`
                    : `Compra al contado e ingreso de ${totalUnidades} unidades registrados con egreso en caja.`
            };
        } catch (error) {
            console.error('Error en reabastecerAction:', error);
            return {
                ok: false,
                msg: 'Error interno en el servidor al registrar la compra y reabastecer inventario.'
            };
        }
    });
