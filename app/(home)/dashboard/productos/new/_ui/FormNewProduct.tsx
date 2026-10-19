'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Package,
    Barcode,
    DollarSign,
    BadgePercent,
    CircleAlert,
    AlignLeft,
    FolderTree,
    Bookmark,
    Scale,
    Building2,
    Boxes,
    ShieldAlert,
    Plus,
    ArrowLeft,
    ChevronDown,
    Sparkles,
    Handshake,
    Store,
    Save,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { Categoria, Igv, Marca, Sucursal, Unidad, Proveedor } from '@/interfaces';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { productoSchema, ProductSchema } from '@/types/producto-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { nuevoProductoAction } from '@/server/actions/productos/nuevo-producto-action';
import { clsx } from 'cn';
import ModalCategoria from './ModalCategoria';
import ModalMarca from './ModalMarca';
import ModalUnidad from './ModalUnidad';
import ModalProveedor from './ModalProveedor';
import ModalSucursal from './ModalSucursal';
import ModalIgv from './ModalIgv';

interface Props {
    categorias: Categoria[];
    sucursales: Sucursal[];
    igv: Igv[];
    proveedor?: Proveedor[];
    unidad: Unidad[];
    marcas: Marca[];
}

type ModalType = 'categoria' | 'marca' | 'unidad' | 'igv' | 'sucursal' | 'proveedor' | null;

export default function FormNewProduct({
    categorias = [],
    sucursales = [],
    igv = [],
    proveedor = [],
    unidad = [],
    marcas = [],
}: Props) {
    const router = useRouter();

    // Estados auxiliares de inventario
    const [stockMinimo, setStockMinimo] = useState('');
    const [cantidadInicial, setCantidadInicial] = useState('');

    const form = useForm<ProductSchema>({
        resolver: zodResolver(productoSchema),
        defaultValues: {
            name: '',
            descripcion: '',
            precioCompra: 0,
            precioVenta: 0,
            image: '',
            codigo: '',
            enConsignacion: false,
            nota: '',
            categoryId: '',
            marcaId: '',
            unidadId: '',
            proveedorId: '',
            igv: '',
            sucursalId: '',
        },
        mode: 'onTouched',
    });


    const { execute, status } = useAction(nuevoProductoAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                form.reset();
                toast.success(data.msg);
            } else {
                toast.error(data.msg);
            }
        },
        onError: ({ error }) => {
            // console.log(error);
            toast.error('Error al crear el producto');
        }
    })


    const isConsignacion = useWatch({ control: form.control, name: 'enConsignacion' });

    // Estado del modal dinámico
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    // Generador automático de SKU / Código
    const generarCodigo = () => {
        const prefijo = 'PRD';
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const code = `${prefijo}-${randomNum}`;
        form.setValue('codigo', code, { shouldValidate: true });
        toast.info(`Código generado: ${code}`);
    };

    const handleOpenModal = (type: ModalType) => {
        setActiveModal(type);
    };

    const onSubmit = (data: ProductSchema) => {
        toast.success('Formulario listo. Datos preparados correctamente.', {
            description: `${data.name} (${data.codigo}) - Listo para guardar en la base de datos cuando se active la acción de servidor.`,
            duration: 4000,
        });
        console.log(data);
    };

    const onError = (formErrors: typeof form.formState.errors) => {
        const firstErrorKey = Object.keys(formErrors)[0] as keyof typeof formErrors;
        if (firstErrorKey && formErrors[firstErrorKey]?.message) {
            toast.error(formErrors[firstErrorKey]?.message);
        } else {
            toast.error('Por favor completa todos los campos obligatorios requeridos');
        }
    };

    const handleReset = () => {
        form.reset({
            name: '',
            descripcion: '',
            precioCompra: 0,
            precioVenta: 0,
            image: '',
            codigo: '',
            enConsignacion: false,
            nota: '',
            categoryId: '',
            marcaId: '',
            unidadId: '',
            proveedorId: '',
            igv: '',
            sucursalId: '',
        });
        setStockMinimo('');
        setCantidadInicial('');
        toast.info('Formulario restablecido');
    };

    // Estilos base coherentes con LoginForm y RegisterForm
    const inputBaseClass =
        'block w-full rounded-lg border border-black/20 bg-white py-2.5 pl-10 pr-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

    const selectBaseClass =
        'block w-full rounded-lg border border-black/20 bg-white py-2.5 pl-10 pr-9 text-sm text-black focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200 appearance-none cursor-pointer';

    const iconBaseClass =
        'pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-black/40 group-focus-within:text-[#FC7819] dark:text-white/40 dark:group-focus-within:text-[#FC7819] transition-[color,transform] duration-200 group-focus-within:scale-110';

    const addBtnClass =
        'flex items-center justify-center gap-1 rounded-lg border border-black/20 bg-white px-3 text-sm font-medium text-black/80 hover:border-[#FC7819] hover:text-[#FC7819] hover:bg-amber-500/5 active:scale-[0.97] dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-[#FC7819] dark:hover:text-[#FC7819] transition-all duration-150 cursor-pointer shrink-0';

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-16">
            {/* Cabecera del formulario */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/10 dark:border-white/10 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/productos"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Volver al catálogo</span>
                        </Link>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Registrar Producto<span className="text-[#FC7819]">.</span>
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ingresa las especificaciones, precios de venta, clasificación y stock inicial del artículo.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <RotateCcw className="size-4" />
                        <span>Limpiar</span>
                    </button>
                    {/* <button
                        type="button"
                        onClick={form.handleSubmit(onSubmit, onError)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#FC7819] hover:bg-[#e0650e] px-5 py-2 text-sm font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Save className="size-4" />
                        <span>Guardar Producto</span>
                    </button> */}
                </div>
            </div>

            {/* Formulario principal */}
            <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate className="space-y-8">
                {/* 1. INFORMACIÓN GENERAL */}
                <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-[#FC7819]">
                            <Package className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Información General
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Nombre comercial, código de barras o SKU y detalles de presentación.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        {/* Nombre */}
                        <div className="sm:col-span-2">
                            <label htmlFor="nombre" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Nombre del Producto <span className="text-red-500">*</span>
                            </label>
                            <div className="group relative">
                                <Package aria-hidden="true" className={iconBaseClass} />
                                <Controller
                                    control={form.control}
                                    name='name'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <input
                                                id="nombre"
                                                type="text"
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Ej. Aceite Vegetal Primor Premium 1L"
                                                className={`${inputBaseClass} ${form.formState.errors.name ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                required
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {form.formState.errors.name && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Código */}
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="codigo" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                                    Código / SKU / Barras <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generarCodigo}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#FC7819] hover:underline cursor-pointer"
                                >
                                    <Sparkles className="size-3" />
                                    <span>Autogenerar</span>
                                </button>
                            </div>
                            <div className="group relative">
                                <Barcode aria-hidden="true" className={iconBaseClass} />
                                <Controller
                                    control={form.control}
                                    name='codigo'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <input
                                                id="codigo"
                                                type="text"
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Ej. 7751234567890 o PRD-0042"
                                                className={`${inputBaseClass} ${form.formState.errors.codigo ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                required
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {form.formState.errors.codigo && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.codigo.message}
                                </p>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <label htmlFor="descripcion" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Descripción del Producto <span className="text-red-500">*</span>
                            </label>
                            <div className="group relative">
                                <AlignLeft aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-black/40 group-focus-within:text-[#FC7819] dark:text-white/40 dark:group-focus-within:text-[#FC7819] transition-colors" />
                                <Controller
                                    control={form.control}
                                    name='descripcion'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <textarea
                                                id="descripcion"
                                                rows={3}
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Añade características relevantes, notas de manipulación o información para el vendedor..."
                                                className={`block w-full rounded-lg border border-black/20 bg-white py-2.5 pl-10 pr-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200 resize-y ${form.formState.errors.descripcion ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {form.formState.errors.descripcion && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.descripcion.message}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. CLASIFICACIÓN Y UBICACIÓN (Selects con botón de modal) */}
                <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-[#FC7819]">
                            <FolderTree className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Clasificación y Asignación
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Categorización del artículo y sucursal de recepción inicial. Usa el botón <strong>+</strong> si requieres agregar una nueva opción.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        {/* Select Categoría */}
                        <div>
                            <label htmlFor="categoria" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Categoría <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <FolderTree aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='categoryId'
                                        render={({ field: { value, onChange } }) => {
                                            const noHayCategorias = categorias.length === 0;
                                            return (
                                                <select
                                                    id="categoria"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHayCategorias}
                                                    className={`${selectBaseClass} ${noHayCategorias ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.categoryId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHayCategorias ? 'No hay categorías disponibles' : 'Seleccionar categoría...'}
                                                    </option>
                                                    {categorias.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('categoria')}
                                    title="Crear nueva categoría"
                                    aria-label="Crear nueva categoría"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {categorias.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ninguna categoría agregada
                                </p>
                            ) : form.formState.errors.categoryId ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.categoryId.message}
                                </p>
                            ) : null}
                        </div>

                        {/* Select Marca */}
                        <div>
                            <label htmlFor="marca" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Marca <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <Bookmark aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='marcaId'
                                        render={({ field: { value, onChange } }) => {
                                            const noHayMarcas = marcas.length === 0;
                                            return (
                                                <select
                                                    id="marca"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHayMarcas}
                                                    className={`${selectBaseClass} ${noHayMarcas ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.marcaId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHayMarcas ? 'No hay marcas disponibles' : 'Seleccionar marca...'}
                                                    </option>
                                                    {marcas.map((marca) => (
                                                        <option key={marca.id} value={marca.id}>
                                                            {marca.nombre} {marca.pais ? `(${marca.pais})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('marca')}
                                    title="Crear nueva marca"
                                    aria-label="Crear nueva marca"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {marcas.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ninguna marca agregada
                                </p>
                            ) : form.formState.errors.marcaId ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.marcaId.message}
                                </p>
                            ) : null}
                        </div>

                        {/* Select Unidad (SUNAT / Base) */}
                        <div>
                            <label htmlFor="unidad" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Unidad (Estándar SUNAT) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <Scale aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='unidadId'
                                        render={({ field: { value, onChange } }) => {
                                            const noHayUnidades = unidad.length === 0;
                                            return (
                                                <select
                                                    id="unidad"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHayUnidades}
                                                    className={`${selectBaseClass} ${noHayUnidades ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.unidadId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHayUnidades ? 'No hay unidades disponibles' : 'Seleccionar unidad...'}
                                                    </option>
                                                    {unidad.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.nombre} ({u.abreviatura})
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('unidad')}
                                    title="Crear nueva unidad"
                                    aria-label="Crear nueva unidad"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {unidad.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ninguna unidad agregada
                                </p>
                            ) : form.formState.errors.unidadId ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.unidadId.message}
                                </p>
                            ) : null}
                        </div>

                        {/* Select Proveedor */}
                        <div>
                            <label htmlFor="proveedor" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Proveedor <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <Building2 aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='proveedorId'
                                        render={({ field: { value, onChange } }) => {
                                            const noHayProveedores = proveedor.length === 0;
                                            return (
                                                <select
                                                    id="proveedor"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHayProveedores}
                                                    className={`${selectBaseClass} ${noHayProveedores ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.proveedorId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHayProveedores ? 'No hay proveedores disponibles' : 'Seleccionar proveedor...'}
                                                    </option>
                                                    {proveedor.map((prov) => (
                                                        <option key={prov.id} value={prov.id}>
                                                            {prov.nombre} {prov.numeroDocumento ? `(${prov.numeroDocumento})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('proveedor')}
                                    title="Crear nuevo proveedor"
                                    aria-label="Crear nuevo proveedor"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {proveedor.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ningún proveedor agregado
                                </p>
                            ) : form.formState.errors.proveedorId ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.proveedorId.message}
                                </p>
                            ) : null}
                        </div>

                        {/* Select Sucursal */}
                        <div className="sm:col-span-2">
                            <label htmlFor="sucursal" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Sucursal / Almacén Inicial <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <Store aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='sucursalId'
                                        render={({ field: { value, onChange } }) => {
                                            const noHaySucursales = sucursales.length === 0;
                                            return (
                                                <select
                                                    id="sucursal"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHaySucursales}
                                                    className={`${selectBaseClass} ${noHaySucursales ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.sucursalId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHaySucursales ? 'No hay sucursales disponibles' : 'Seleccionar sucursal...'}
                                                    </option>
                                                    {sucursales.map((suc) => (
                                                        <option key={suc.id} value={suc.id}>
                                                            {suc.nombre} ({suc.codigo})
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('sucursal')}
                                    title="Crear nueva sucursal"
                                    aria-label="Crear nueva sucursal"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {sucursales.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ninguna sucursal agregada
                                </p>
                            ) : form.formState.errors.sucursalId ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.sucursalId.message}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                {/* 3. PRECIOS, IMPUESTOS Y CONSIGNACIÓN */}
                <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-[#FC7819]">
                            <DollarSign className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Precios e Impuestos
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Define márgenes de ganancia, régimen de IGV y condición de consignación.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                        {/* Precio Costo */}
                        <div>
                            <label htmlFor="precioCosto" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Precio Costo (Compra)
                            </label>
                            <div className="group relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 my-auto flex items-center text-xs font-semibold text-black/50 dark:text-white/50">
                                    S/
                                </span>
                                <Controller
                                    control={form.control}
                                    name='precioCompra'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <input
                                                id="precioCosto"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={isConsignacion}
                                                value={isConsignacion ? '' : (value === 0 ? '' : value)}
                                                onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                placeholder={isConsignacion ? 'En consignación' : '0.00'}
                                                className={`${inputBaseClass} ${isConsignacion ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.precioCompra ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {form.formState.errors.precioCompra && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.precioCompra.message}
                                </p>
                            )}
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                {isConsignacion
                                    ? 'No se fija costo directo al estar en consignación.'
                                    : 'Costo unitario de adquisición neto.'}
                            </p>
                        </div>

                        {/* Precio Venta */}
                        <div>
                            <label htmlFor="precioVenta" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Precio Venta al Público <span className="text-red-500">*</span>
                            </label>
                            <div className="group relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 my-auto flex items-center text-xs font-semibold text-[#FC7819]">
                                    S/
                                </span>
                                <Controller
                                    control={form.control}
                                    name='precioVenta'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <input
                                                id="precioVenta"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={value === 0 ? '' : value}
                                                onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                className={`${inputBaseClass} ${form.formState.errors.precioVenta ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                required
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {form.formState.errors.precioVenta && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.precioVenta.message}
                                </p>
                            )}
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Precio final de venta que se facturará en caja.
                            </p>
                        </div>

                        {/* Select IGV (+ botón modal) */}
                        <div>
                            <label htmlFor="igv" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Impuesto (IGV) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="group relative flex-1">
                                    <BadgePercent aria-hidden="true" className={iconBaseClass} />
                                    <Controller
                                        control={form.control}
                                        name='igv'
                                        render={({ field: { value, onChange } }) => {
                                            const noHayIgv = igv.length === 0;
                                            return (
                                                <select
                                                    id="igv"
                                                    value={value}
                                                    onChange={onChange}
                                                    disabled={noHayIgv}
                                                    className={`${selectBaseClass} ${noHayIgv ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''} ${form.formState.errors.igv ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                >
                                                    <option value="">
                                                        {noHayIgv ? 'No hay IGV disponible' : 'Seleccionar IGV...'}
                                                    </option>
                                                    {igv.map((item) => {
                                                        const pct = item.value < 1 ? item.value * 100 : item.value;
                                                        return (
                                                            <option key={item.id} value={item.id}>
                                                                {pct.toFixed(0)}% {pct === 18 ? '(Régimen General)' : pct === 0 ? '(Exonerado / Inafecto)' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            )
                                        }}
                                    />
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-black/40 dark:text-white/40" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal('igv')}
                                    title="Agregar tasa de IGV"
                                    aria-label="Agregar tasa de IGV"
                                    className={addBtnClass}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            {igv.length === 0 ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    No hay ningún IGV agregado
                                </p>
                            ) : form.formState.errors.igv ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {form.formState.errors.igv.message}
                                </p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Tasa tributaria aplicada para comprobantes electrónicos.
                            </p>
                        </div>
                    </div>

                    {/* Checkbox: Producto en Consignación */}
                    <div className="rounded-lg border border-black/10 bg-black/1 p-4 transition-colors hover:border-black/25 dark:border-white/10 dark:bg-white/2 dark:hover:border-white/20">
                        <label htmlFor="consignacion" className="flex items-start gap-3 cursor-pointer select-none">
                            <span className="relative mt-0.5 size-4 shrink-0">
                                <Controller
                                    control={form.control}
                                    name='enConsignacion'
                                    render={({ field: { value, onChange } }) => {
                                        return (
                                            <input
                                                id="consignacion"
                                                type="checkbox"
                                                checked={!!value}
                                                onChange={(e) => {
                                                    onChange(e.target.checked);
                                                    if (e.target.checked) {
                                                        form.setValue('precioCompra', 0);
                                                    }
                                                }}
                                                className="peer size-full appearance-none rounded border border-black/30 bg-white transition-colors checked:border-[#FC7819] checked:bg-[#FC7819] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FC7819] dark:border-white/30 dark:bg-white/5 dark:checked:border-[#FC7819] dark:checked:bg-[#FC7819] cursor-pointer"
                                            />
                                        )
                                    }}
                                />
                                <svg
                                    viewBox="0 0 12 12"
                                    className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block peer-checked:animate-in peer-checked:zoom-in-50"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M2.5 6.2 4.8 8.5 9.5 3.8"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <Handshake className="size-4 text-[#FC7819]" />
                                    <span className="text-sm font-semibold text-black dark:text-white">
                                        Producto en consignación
                                    </span>
                                </div>
                                <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
                                    Marca esta casilla si el producto pertenece a un tercero/proveedor y se liquida o paga únicamente tras efectuarse la venta.
                                </p>
                            </div>
                        </label>
                    </div>
                </section>

                {/* 4. CONTROL DE INVENTARIO Y STOCK */}
                <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-[#FC7819]">
                            <Boxes className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Inventario y Control de Stock
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Parámetros de existencias iniciales y umbrales para notificaciones de reabastecimiento.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        {/* Cantidad Inicial */}
                        <div>
                            <label htmlFor="cantidadInicial" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Cantidad Inicial (Stock de Apertura)
                            </label>
                            <div className="group relative">
                                <Boxes aria-hidden="true" className={iconBaseClass} />
                                <input
                                    id="cantidadInicial"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cantidadInicial}
                                    onChange={(e) => setCantidadInicial(e.target.value)}
                                    placeholder="Ej. 50"
                                    className={inputBaseClass}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Unidades físicas disponibles actualmente en el almacén seleccionado.
                            </p>
                        </div>

                        {/* Stock Mínimo */}
                        <div>
                            <label htmlFor="stockMinimo" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70 mb-1.5">
                                Stock Mínimo (Alerta de Reposición)
                            </label>
                            <div className="group relative">
                                <ShieldAlert aria-hidden="true" className={iconBaseClass} />
                                <input
                                    id="stockMinimo"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={stockMinimo}
                                    onChange={(e) => setStockMinimo(e.target.value)}
                                    placeholder="Ej. 10"
                                    className={inputBaseClass}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                El sistema alertará cuando las existencias desciendan de este umbral.
                            </p>
                        </div>
                    </div>
                </section>

                {/* BOTONES DE ACCIÓN INFERIORES */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <Link
                        href="/dashboard/productos"
                        className="w-full sm:w-auto text-center rounded-lg border border-black/20 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                        Cancelar
                    </Link>
                    <button
                        disabled={status === 'executing'}
                        type="submit"
                        className={clsx("w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer", status === 'executing' ? "bg-[#FC7819]/50" : "bg-[#FC7819] hover:bg-[#e0650e]")}
                    >
                        <Save className="size-4" />
                        <span>Guardar Producto</span>
                    </button>
                </div>
            </form>

            {/* MODALES INDIVIDUALES PARA AGREGAR OPCIONES */}
            <ModalCategoria
                isOpen={activeModal === 'categoria'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newCat) => {
                    form.setValue('categoryId', newCat.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />

            <ModalMarca
                isOpen={activeModal === 'marca'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newMarca) => {
                    form.setValue('marcaId', newMarca.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />

            <ModalUnidad
                isOpen={activeModal === 'unidad'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newUnidad) => {
                    form.setValue('unidadId', newUnidad.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />

            <ModalProveedor
                isOpen={activeModal === 'proveedor'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newProv) => {
                    form.setValue('proveedorId', newProv.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />

            <ModalSucursal
                isOpen={activeModal === 'sucursal'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newSuc) => {
                    form.setValue('sucursalId', newSuc.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />

            <ModalIgv
                isOpen={activeModal === 'igv'}
                onClose={() => setActiveModal(null)}
                onSuccess={(newIgv) => {
                    form.setValue('igv', newIgv.id, { shouldValidate: true });
                    setActiveModal(null);
                }}
            />
        </div>
    );
}