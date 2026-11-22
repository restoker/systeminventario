export interface RucSucursalResumen {
    id: string;
    nombre: string;
    codigo: string;
    activo: boolean;
}

export interface RucSerieResumen {
    id: string;
    nombre: string;
    serie: string;
    estado: boolean;
}

export interface RucEmpresaRow {
    id: string;
    numeroRuc: string;
    nombre: string;
    razonSocial: string | null;
    direccionFiscal: string | null;
    telefono: string | null;
    email: string | null;
    descripcion: string | null;
    activo: boolean;
    esPrincipal: boolean;
    createdAt: string;
    updatedAt: string;
    sucursales: RucSucursalResumen[];
    series: RucSerieResumen[];
    totalVentas: number;
    totalComprobantes: number;
    totalCompras: number;
}

export type RucEstadoFiltro = 'all' | 'activos' | 'inactivos';

export type RucOrdenFiltro =
    | 'principal'
    | 'nombre'
    | 'comprobantes'
    | 'recientes';
