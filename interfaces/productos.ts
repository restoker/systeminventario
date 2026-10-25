export interface Productos {
    id: string;
    name: string;
    image?: string | null;
    imagenes?: { id: string; url: string; productoId?: string }[];
    createdAt: Date;
    updatedAt: Date;
    codigo: string;
    description: string;
    precioCompra: number | null;
    precioVenta: number;
    igv: number | null;
    enConsignacion: boolean | null;
    nota: string | null;
    categoryId: string;
    marcaId: string | null;
    unidadId: string;
    proveedorId?: string | null;
    categoria?: { id: string; nombre: string } | null;
    marca?: { id: string; nombre: string } | null;
    unidad?: { id: string; nombre: string; abreviatura: string } | null;
    proveedor?: { id: string; nombre: string } | null;
    stocks?: { cantidad: number; stockMinimo: number; sucursalId: string }[];
}

