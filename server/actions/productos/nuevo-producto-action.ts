'use server';

import { actionClient } from "@/lib/safe-action";
import { productoSchema } from "@/types/producto-schema";
import db from "@/server";
import { eq } from "drizzle-orm";
import { products } from "@/server/schema/products";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

export const nuevoProductoAction = actionClient
    .inputSchema(productoSchema)
    .action(async ({ parsedInput: { id, name, descripcion, precioCompra, precioVenta, image, codigo, enConsignacion, nota, categoryId, marcaId, unidadId, proveedorId } }) => {
        try {

            if (id) {
                const productoExiste = await db.query.products.findFirst({
                    where: { id: id },
                    with: {
                        categoria: {
                            columns: {
                                id: true,
                            }
                        },
                        proveedor: {
                            columns: {
                                id: true,
                            }
                        },
                        marca: {
                            columns: {
                                id: true,
                            }
                        },
                        unidad: {
                            columns: {
                                id: true,
                            }
                        }
                    }
                });
                if (!productoExiste) return { ok: false, msg: 'El producto no existe' };

                // verificar si el codigo del producto ya existe
                const codigoExiste = await db.query.products.findFirst({
                    where: { codigo: codigo.toLowerCase() },
                });
                if (codigoExiste) return { ok: false, msg: 'El codigo del producto ya existe, pruebe usando otro' };

                // verificar si la categoria existe
                const categoriaExiste = await db.query.categorias.findFirst({
                    where: {
                        id: productoExiste.categoria!.id,
                    },
                });
                if (!categoriaExiste) return { ok: false, msg: 'La categoria no existe' };
                // verificar si el proveedor existe
                const proveedorExiste = await db.query.proveedor.findFirst({
                    where: { id: productoExiste.proveedor!.id, },
                });
                if (!proveedorExiste) return { ok: false, msg: 'El proveedor no existe' };
                // verificar si la marca existe
                const marcaExiste = await db.query.marcas.findFirst({
                    where: { id: productoExiste.marca!.id, },
                });
                if (!marcaExiste) return { ok: false, msg: 'La marca no existe' };
                // verificar si la unidad existe
                const unidadExiste = await db.query.unidades.findFirst({
                    where: { id: productoExiste.unidad!.id, },
                });
                if (!unidadExiste) return { ok: false, msg: 'La unidad no existe' };


                let urlImage;
                if (image && (image as File).size > 0) {
                    if (productoExiste.image) {
                        const publicIdImage = extractPublicId(productoExiste.image);
                        await cloudinary.uploader.destroy(publicIdImage);
                    }
                    urlImage = await uploadImage(image as File);
                    if (!urlImage) return { ok: false, msg: 'Error al actualizar la imagen' };
                }

                await db.update(products).set({
                    ...(name && { name: name.toLowerCase() }),
                    ...(descripcion && { description: descripcion.toLowerCase() }),
                    ...(precioCompra && { precioCompra }),
                    ...(precioVenta && { precioVenta }),
                    ...(image && { image: urlImage }),
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

            const existingProduct = await db.query.products.findFirst({
                where: {
                    name: name.toLowerCase(),
                    codigo: codigo.toLowerCase()
                },
                with: {
                    categoria: {
                        columns: {
                            id: true,
                        }
                    },
                    proveedor: {
                        columns: {
                            id: true,
                        }
                    },
                    marca: {
                        columns: {
                            id: true,
                        }
                    },
                    unidad: {
                        columns: {
                            id: true,
                        }
                    }
                }
            });

            if (existingProduct) return { ok: false, msg: "El producto ya existe" };

            // verificar si el codigo del producto ya existe
            const codigoExiste = await db.query.products.findFirst({
                where: { codigo: codigo.toLowerCase() },
            });
            if (codigoExiste) return { ok: false, msg: 'El codigo del producto ya existe, pruebe usando otro' };

            // verificar si la categoria existe
            const categoriaExiste = await db.query.categorias.findFirst({
                where: {
                    id: categoryId,
                },
            });
            if (!categoriaExiste) return { ok: false, msg: 'La categoria no existe' };
            // verificar si el proveedor existe
            const proveedorExiste = await db.query.proveedor.findFirst({
                where: { id: proveedorId, },
            });
            if (!proveedorExiste) return { ok: false, msg: 'El proveedor no existe' };
            // verificar si la marca existe
            const marcaExiste = await db.query.marcas.findFirst({
                where: { id: marcaId, },
            });
            if (!marcaExiste) return { ok: false, msg: 'La marca no existe' };
            // verificar si la unidad existe
            const unidadExiste = await db.query.unidades.findFirst({
                where: { id: unidadId, },
            });
            if (!unidadExiste) return { ok: false, msg: 'La unidad no existe' };

            if (image) {
                const urlImage = await uploadImage(image as File);
                if (!urlImage) return { ok: false, msg: 'Error al subir la imagen' };

                await db.insert(products).values({
                    name: name.toLowerCase(),
                    description: descripcion.toLowerCase(),
                    precioCompra,
                    precioVenta,
                    ...(image && { image: urlImage }),
                    ...(enConsignacion && { enConsignacion }),
                    codigo: codigo.toLowerCase(),
                    ...(nota && { nota: nota.toLowerCase() }),
                    categoryId,
                    marcaId,
                    unidadId,
                    proveedorId,
                });

            } else {
                await db.insert(products).values({
                    name: name.toLowerCase(),
                    description: descripcion.toLowerCase(),
                    precioCompra,
                    precioVenta,
                    ...(enConsignacion && { enConsignacion }),
                    codigo: codigo.toLowerCase(),
                    ...(nota && { nota: nota.toLowerCase() }),
                    categoryId,
                    marcaId,
                    unidadId,
                    proveedorId,
                });
            }

            revalidatePath("/productos");
            return { ok: true, msg: "Producto creado exitosamente" };
        } catch (error) {
            console.log(error);
            return { error: true, msg: "Error al crear el producto" };
        }
    })


const uploadImage = async (image: File) => {
    try {
        const buffer = await image.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Image}`);
        return result.secure_url;
    } catch (e) {
        // console.log(e);
        return null;
    }
}