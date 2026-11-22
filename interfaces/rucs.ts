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

export interface RucFacturacionResumen {
    id: string;
    rucEmpresaId: string;
    ubigeo: string | null;
    departamento: string | null;
    provincia: string | null;
    distrito: string | null;
    pathCert: string | null;
    logo: string | null;
    usuarioSol: string | null;
    claveSol: string | null;
    passwordCertificadoDigital: string | null;
    produccion: boolean;
    clienteId: string | null;
    clienteSecret: string | null;
    createdAt: string;
    updatedAt: string;
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
    facturacion: RucFacturacionResumen | null;
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
