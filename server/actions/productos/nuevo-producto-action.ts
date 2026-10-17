'use server';

import { actionClient } from "@/lib/safe-action";
import { productoSchema } from "@/types/producto-schema";
import db from "@/server";
import { eq } from "drizzle-orm";
import { products } from "@/server/schema/products";
import { revalidatePath } from "next/cache";

export const nuevoProductoAction = actionClient
    .inputSchema(productoSchema)
    .action(async ({ parsedInput: { id, name, descripcion, precioCompra, precioVenta, image, codigo, enConsignacion, nota, categoryId, marcaId, unidadId, proveedorId } }) => {
        try {
            const existingProduct = await db.query.products.findFirst({
                where: {
                    name: name.toLowerCase(),
                    codigo: codigo.toLowerCase()
                }
            });

            if (existingProduct) return { ok: false, msg: "El producto ya existe" };

            if (id) {
                await db.update(products).set({
                    ...(name && { name: name.toLowerCase() }),
                    ...(descripcion && { description: descripcion.toLowerCase() }),
                    ...(precioCompra && { precioCompra }),
                    ...(precioVenta && { precioVenta }),
                    ...(image && { image }),
                    ...(enConsignacion && { enConsignacion }),
                    ...(codigo && { codigo: codigo.toLowerCase() }),
                    ...(nota && { nota: nota?.toLowerCase() }),
                    ...(categoryId && { categoryId }),
                    ...(marcaId && { marcaId }),
                    ...(unidadId && { unidadId }),
                    ...(proveedorId && { proveedorId }),
                }).where(eq(products.id, id));
                revalidatePath("/productos");
                return { ok: true, msg: "Producto actualizado exitosamente" };

            }

            await db.insert(products).values({
                name: name.toLowerCase(),
                description: descripcion.toLowerCase(),
                precioCompra,
                precioVenta,
                ...(image && { image }),
                ...(enConsignacion && { enConsignacion }),
                codigo: codigo.toLowerCase(),
                ...(nota && { nota: nota.toLowerCase() }),
                categoryId,
                marcaId,
                unidadId,
                proveedorId,
            });

            revalidatePath("/productos");
            return { ok: true, msg: "Producto creado exitosamente" };
        } catch (error) {
            console.log(error);
            return { error: true, msg: "Error al crear el producto" };
        }
    })