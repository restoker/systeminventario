export interface Proveedor {
    id: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    nombre: string;
    telefono: string | null;
    direccion: string | null;
    numeroDocumento: string | null;
    activo: boolean | null;
    razonSocial: string | null;
}