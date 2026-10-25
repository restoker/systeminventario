'use server';

import { actionClient } from "@/lib/safe-action";
import { extractFiles, productoSchema } from "@/types/producto-schema";
import db from "@/server";
import { eq } from "drizzle-orm";
import { products } from "@/server/schema/products";
import { imagenProducto } from "@/server/schema/imagen-producto";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';

cloudinary.config(process.env.CLOUDINARY_URL ?? '');

export const nuevoProductoAction = actionClient
    .inputSchema(productoSchema)
    .action(async ({ parsedInput: { id, name, descripcion, precioCompra, precioVenta, image, images, codigo, enConsignacion, nota, categoryId, marcaId, unidadId, proveedorId } }) => {
        try {
            // Extraer imágenes y limitar estrictamente a un máximo de 3
            const allExtracted = [
                ...extractFiles(images),
                ...extractFiles(image),
            ];
            // Deduplicar si se pasaron en ambos campos
            const uniqueFiles = allExtracted.filter((file, index, self) => {
                if (typeof file === 'string') {
                    return self.findIndex((f) => typeof f === 'string' && f === file) === index;
                }
                if (file instanceof File) {
                    return self.findIndex((f) => f instanceof File && f.name === file.name && f.size === file.size && f.lastModified === file.lastModified) === index;
                }
                return true;
            });

            if (uniqueFiles.length > 3) {
                return { ok: false, msg: 'Solo se permite un máximo de 3 imágenes' };
            }

            const filesToProcess = uniqueFiles.slice(0, 3);

            if (id) {
                const productoExiste = await db.query.products.findFirst({
                    where: { id: id },
                    with: {
                        categoria: { columns: { id: true } },
                        proveedor: { columns: { id: true } },
                        marca: { columns: { id: true } },
                        unidad: { columns: { id: true } },
                        imagenes: true,
                    }
                });
                if (!productoExiste) return { ok: false, msg: 'El producto no existe' };

                // Verificar si el código del producto ya existe en otro producto
                const codigoExiste = await db.query.products.findFirst({
                    where: { codigo: codigo.toLowerCase() },
                });
                if (codigoExiste && codigoExiste.id !== id) {
                    return { ok: false, msg: 'El código del producto ya existe, pruebe usando otro' };
                }

                // Verificar si la categoría existe
                const categoriaExiste = await db.query.categorias.findFirst({
                    where: { id: categoryId },
                });
                if (!categoriaExiste) return { ok: false, msg: 'La categoría no existe' };

                // Verificar si el proveedor existe
                const proveedorExiste = await db.query.proveedor.findFirst({
                    where: { id: proveedorId },
                });
                if (!proveedorExiste) return { ok: false, msg: 'El proveedor no existe' };

                // Verificar si la marca existe
                const marcaExiste = await db.query.marcas.findFirst({
                    where: { id: marcaId },
                });
                if (!marcaExiste) return { ok: false, msg: 'La marca no existe' };

                // Verificar si la unidad existe
                const unidadExiste = await db.query.unidades.findFirst({
                    where: { id: unidadId },
                });
                if (!unidadExiste) return { ok: false, msg: 'La unidad no existe' };

                await db.update(products).set({
                    ...(name && { name: name.toLowerCase() }),
                    ...(descripcion && { description: descripcion.toLowerCase() }),
                    ...(precioCompra !== undefined && { precioCompra }),
                    ...(precioVenta !== undefined && { precioVenta }),
                    ...(enConsignacion !== undefined && { enConsignacion }),
                    ...(codigo && { codigo: codigo.toLowerCase() }),
                    ...(nota !== undefined && { nota: nota?.toLowerCase() }),
                    ...(categoryId && { categoryId }),
                    ...(marcaId && { marcaId }),
                    ...(unidadId && { unidadId }),
                    ...(proveedorId && { proveedorId }),
                }).where(eq(products.id, id));

                // Actualizar imágenes si se proporcionaron
                if (filesToProcess.length > 0) {
                    const previousImages = await db
                        .select()
                        .from(imagenProducto)
                        .where(eq(imagenProducto.productoId, id));

                    for (const img of previousImages) {
                        try {
                            const publicId = extractPublicId(img.url);
                            if (publicId) await cloudinary.uploader.destroy(publicId);
                        } catch (err) {
                            console.error("Error al eliminar imagen de Cloudinary:", err);
                        }
                    }
                    await db.delete(imagenProducto).where(eq(imagenProducto.productoId, id));

                    const uploadedUrls = await uploadImages(filesToProcess);
                    if (uploadedUrls.length > 0) {
                        await db.insert(imagenProducto).values(
                            uploadedUrls.map((url) => ({
                                url,
                                productoId: id,
                            }))
                        );
                    }
                }

                revalidatePath("/dashboard/productos");
                revalidatePath("/productos");
                return { ok: true, msg: "Producto actualizado exitosamente" };
            }

            const existingProduct = await db.query.products.findFirst({
                where: {
                    name: name.toLowerCase(),
                    codigo: codigo.toLowerCase()
                },
            });

            if (existingProduct) return { ok: false, msg: "El producto ya existe" };

            // Verificar si el código del producto ya existe
            const codigoExiste = await db.query.products.findFirst({
                where: { codigo: codigo.toLowerCase() },
            });
            if (codigoExiste) return { ok: false, msg: 'El código del producto ya existe, pruebe usando otro' };

            // Verificar existencia de relaciones
            const categoriaExiste = await db.query.categorias.findFirst({
                where: { id: categoryId },
            });
            if (!categoriaExiste) return { ok: false, msg: 'La categoría no existe' };

            const proveedorExiste = await db.query.proveedor.findFirst({
                where: { id: proveedorId },
            });
            if (!proveedorExiste) return { ok: false, msg: 'El proveedor no existe' };

            const marcaExiste = await db.query.marcas.findFirst({
                where: { id: marcaId },
            });
            if (!marcaExiste) return { ok: false, msg: 'La marca no existe' };

            const unidadExiste = await db.query.unidades.findFirst({
                where: { id: unidadId },
            });
            if (!unidadExiste) return { ok: false, msg: 'La unidad no existe' };

            // Subir imágenes si se adjuntaron (máximo 3)
            let uploadedUrls: string[] = [];
            if (filesToProcess.length > 0) {
                uploadedUrls = await uploadImages(filesToProcess);
                if (uploadedUrls.length === 0 && filesToProcess.some((f) => f instanceof File)) {
                    return { ok: false, msg: 'Error al subir las imágenes a Cloudinary' };
                }
            }

            const [newProduct] = await db.insert(products).values({
                name: name.toLowerCase(),
                description: descripcion.toLowerCase(),
                precioCompra,
                precioVenta,
                ...(enConsignacion !== undefined && { enConsignacion }),
                codigo: codigo.toLowerCase(),
                ...(nota && { nota: nota.toLowerCase() }),
                categoryId,
                marcaId,
                unidadId,
                proveedorId,
            }).returning();

            // Insertar registros en imagen_producto asociados al producto creado
            if (uploadedUrls.length > 0 && newProduct?.id) {
                await db.insert(imagenProducto).values(
                    uploadedUrls.map((url) => ({
                        url,
                        productoId: newProduct.id,
                    }))
                );
            }

            revalidatePath("/dashboard/productos");
            revalidatePath("/dashboard/productos/new");
            revalidatePath("/productos");
            return { ok: true, msg: "Producto creado exitosamente" };
        } catch (error) {
            console.error(error);
            return { ok: false, msg: "Error al crear el producto" };
        }
    });

const uploadImage = async (image: File): Promise<string | null> => {
    try {
        const buffer = await image.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mimeType = image.type || 'image/png';
        const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Image}`, {
            folder: 'productos',
        });
        return result.secure_url;
    } catch (e) {
        console.error('Error al subir imagen a Cloudinary:', e);
        return null;
    }
};

const uploadImages = async (files: (File | string)[]): Promise<string[]> => {
    const uploadPromises = files.slice(0, 3).map(async (file) => {
        if (typeof file === "string" && file.trim().length > 0) {
            return file;
        }
        if (file instanceof File && file.size > 0) {
            return await uploadImage(file);
        }
        return null;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => Boolean(url));
};