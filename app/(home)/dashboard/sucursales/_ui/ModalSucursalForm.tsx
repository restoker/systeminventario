'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Building2Icon,
    XIcon,
    CheckIcon,
    Loader2Icon,
    PlusIcon,
    ChevronDownIcon,
    MapPinIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { Sucursal } from '@/interfaces';
import { newSucursalSchema, NewSurcursalSchema } from '@/types/new-surcursal-schema';
import { newSucursalAction } from '@/server/actions/sucursal/new-sucursal-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getSucursalAction } from '@/server/actions/sucursal/get-sucursal-action';
import { getRucsEmpresaAction } from '@/server/actions/ruc/ruc-actions';
import ModalNewRucEmpresa from '@/app/(home)/dashboard/configuracion/_ui/ModalNewRucEmpresa';
import type { RucEmpresa } from '@/server/schema/ruc';
import { cn } from 'cn';

interface ModalSucursalFormProps {
    isOpen: boolean;
    onClose: () => void;
    sucursalToEdit?: Sucursal | null;
    initialRucs?: RucEmpresa[];
}

export default function ModalSucursalForm({
    isOpen,
    onClose,
    sucursalToEdit,
    initialRucs,
}: ModalSucursalFormProps) {
    const [loadingSucursal, setLoadingSucursal] = useState<boolean>(false);
    const [rucsList, setRucsList] = useState<RucEmpresa[]>(initialRucs || []);
    const [isLoadingRucs, setIsLoadingRucs] = useState<boolean>(false);
    const [isNewRucModalOpen, setIsNewRucModalOpen] = useState<boolean>(false);
    const hasLoadedRucsRef = useRef<boolean>(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const editMode = pathname?.includes('/dashboard/sucursales') ? searchParams.get('id') : null;
    const isEditing = Boolean(sucursalToEdit || editMode);

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<NewSurcursalSchema>({
        resolver: zodResolver(newSucursalSchema),
        defaultValues: {
            nombre: '',
            codigo: '',
            direccion: '',
            telefono: '',
            email: '',
            rucId: '',
            ruc: '',
            razonSocial: '',
            isActive: true,
        }
    });

    const selectedRucId = watch('rucId') || '';
    const currentRucNumber = watch('ruc') || '';

    // Buscar el RUC seleccionado con useMemo para evitar cálculos redundantes
    const selectedRuc = useMemo(() => {
        if (!selectedRucId && !currentRucNumber) return null;
        return (
            rucsList.find(r => r.id === selectedRucId) ||
            rucsList.find(r => r.numeroRuc === currentRucNumber) ||
            null
        );
    }, [rucsList, selectedRucId, currentRucNumber]);

    // Cargar RUCs exactamente UNA vez por apertura si no fueron provistos
    useEffect(() => {
        if (!isOpen) {
            hasLoadedRucsRef.current = false;
            return;
        }

        if (initialRucs && initialRucs.length > 0) {
            setRucsList(initialRucs);
            hasLoadedRucsRef.current = true;
        } else if (!hasLoadedRucsRef.current && rucsList.length === 0) {
            hasLoadedRucsRef.current = true;
            setIsLoadingRucs(true);
            getRucsEmpresaAction()
                .then(res => {
                    if (res?.data?.ok && res.data.data) {
                        setRucsList(res.data.data);
                    }
                })
                .catch(err => {
                    console.error('Error al cargar la lista de RUCs:', err);
                })
                .finally(() => {
                    setIsLoadingRucs(false);
                });
        }
    }, [isOpen, initialRucs?.length]);

    const handleSelectRuc = useCallback((newRucId: string) => {
        if (!newRucId) {
            setValue('rucId', '');
            setValue('ruc', '');
            setValue('razonSocial', '');
            return;
        }

        const found = rucsList.find(r => r.id === newRucId);
        if (found) {
            setValue('rucId', found.id);
            setValue('ruc', found.numeroRuc);
            setValue('razonSocial', found.razonSocial || found.nombre);
        }
    }, [rucsList, setValue]);

    const populateForm = useCallback((sucursal: Sucursal & { rucEmpresa?: { id?: string; numeroRuc: string; razonSocial?: string | null; nombre?: string } | null }) => {
        setValue('id', sucursal.id);
        setValue('nombre', sucursal.nombre || '');
        const cleanCodigo = (sucursal.codigo || '').replace(/^suc-?/i, '');
        setValue('codigo', cleanCodigo);
        setValue('direccion', sucursal.direccion || '');
        setValue('telefono', sucursal.telefono || '');
        setValue('email', sucursal.email || '');

        const rucNum = sucursal.rucEmpresa?.numeroRuc || sucursal.ruc || '';
        const matchingRuc = (sucursal.rucId ? rucsList.find(r => r.id === sucursal.rucId) : null)
            || (rucNum ? rucsList.find(r => r.numeroRuc === rucNum) : null);

        const targetRucId = matchingRuc ? matchingRuc.id : (sucursal.rucId || sucursal.rucEmpresa?.id || '');
        setValue('rucId', targetRucId);
        setValue('ruc', matchingRuc ? matchingRuc.numeroRuc : rucNum);
        setValue('razonSocial', matchingRuc ? (matchingRuc.razonSocial || matchingRuc.nombre) : (sucursal.razonSocial || sucursal.rucEmpresa?.razonSocial || ''));
        setValue('isActive', sucursal.activo ?? true);
    }, [rucsList, setValue]);

    const checkSucursal = useCallback(async (id: string) => {
        setLoadingSucursal(true);
        const { ok, data: sucursal, msg } = await getSucursalAction(id);
        setLoadingSucursal(false);

        if (!ok) {
            toast.error(msg);
            router.push('/dashboard/sucursales');
            return;
        }

        if (sucursal) {
            populateForm(sucursal);
        }
    }, [populateForm, router]);

    useEffect(() => {
        if (!isOpen) return;

        if (sucursalToEdit) {
            populateForm(sucursalToEdit);
        } else if (editMode) {
            checkSucursal(editMode);
        } else {
            reset({
                nombre: '',
                codigo: '',
                direccion: '',
                telefono: '',
                email: '',
                rucId: '',
                ruc: '',
                razonSocial: '',
                isActive: true,
            });
        }
    }, [isOpen, sucursalToEdit, editMode, checkSucursal, populateForm, reset]);

    const { execute, status } = useAction(newSucursalAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || (isEditing ? 'Sucursal actualizada' : 'Sucursal creada'));
                reset();
                onClose();
                router.refresh();
            } else {
                toast.error(data?.msg || 'Error al procesar la sucursal');
            }
        },
        onError: () => {
            toast.error('Ocurrió un error en el servidor al guardar la sucursal');
        }
    });

    const isPending = status === 'executing' || loadingSucursal;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending && !isNewRucModalOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending, isNewRucModalOpen]);

    if (!isOpen) return null;

    const onSubmit = (formData: NewSurcursalSchema) => {
        const id = sucursalToEdit?.id || formData.id || (editMode ?? undefined);
        execute({
            ...formData,
            ...(id ? { id } : {})
        });
    };

    const handleClose = () => {
        if (isPending || isNewRucModalOpen) return;
        reset();
        onClose();
    };

    const handleNewRucCreated = (newRuc: RucEmpresa) => {
        setRucsList(prev => {
            const exists = prev.some(r => r.id === newRuc.id);
            if (exists) return prev.map(r => r.id === newRuc.id ? newRuc : r);
            return [newRuc, ...prev];
        });
        setValue('rucId', newRuc.id);
        setValue('ruc', newRuc.numeroRuc);
        setValue('razonSocial', newRuc.razonSocial || newRuc.nombre);
        setIsNewRucModalOpen(false);
        toast.success(`RUC ${newRuc.numeroRuc} registrado y seleccionado para esta sede`);
    };

    return (
        <>
            <div
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200'
                role='dialog'
                aria-modal='true'
                onClick={e => {
                    if (e.target === e.currentTarget) handleClose();
                }}
            >
                <div data-ui className='relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border bg-card p-6 animate-in zoom-in-95 duration-200 space-y-5 text-card-foreground shadow-2xl'>
                    {/* Header */}
                    <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-xs font-semibold text-primary'>
                                <Building2Icon className='size-3.5' />
                                <span>{isEditing ? 'Actualizar Sede' : 'Nueva Sede'}</span>
                            </div>
                            <h3 className='text-lg font-bold tracking-tight text-foreground'>
                                {isEditing ? 'Editar Sucursal o Almacén' : 'Registrar Nueva Sucursal'}
                            </h3>
                            <p className='text-xs text-muted-foreground'>
                                {isEditing
                                    ? 'Modifica los datos operativos, de contacto o fiscales de esta sucursal.'
                                    : 'Registra un nuevo punto físico o centro de distribución para inventario.'}
                            </p>
                        </div>
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            onClick={handleClose}
                            disabled={isPending}
                            className='cursor-pointer text-muted-foreground hover:text-foreground'
                            aria-label='Cerrar modal'
                        >
                            <XIcon className='size-4' />
                        </Button>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                            {/* Nombre de la Sucursal */}
                            <div className='space-y-1.5 sm:col-span-2'>
                                <Label htmlFor='nombre' className='text-xs font-medium text-foreground'>
                                    Nombre de la Sucursal <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='nombre'
                                    placeholder='Ej. Sede Central Miraflores'
                                    {...register('nombre')}
                                    disabled={isPending}
                                    autoFocus
                                    className={errors.nombre ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                                />
                                {errors.nombre && (
                                    <p className='text-[11px] text-destructive'>{errors.nombre.message}</p>
                                )}
                            </div>

                            {/* Código Identificador */}
                            <div className='space-y-1.5'>
                                <Label htmlFor='codigo' className='text-xs font-medium text-foreground'>
                                    Código <span className='text-destructive'>*</span>
                                </Label>
                                <div className='flex rounded-md shadow-xs'>
                                    <span
                                        className={cn(
                                            'inline-flex h-9 items-center px-3 rounded-l-md border border-r-0 bg-muted text-xs sm:text-sm font-mono font-medium text-muted-foreground select-none',
                                            errors.codigo ? 'border-destructive text-destructive' : 'border-input',
                                            isPending && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        SUC-
                                    </span>
                                    <Input
                                        id='codigo'
                                        type='text'
                                        inputMode='numeric'
                                        pattern='[0-9]*'
                                        placeholder='01'
                                        {...register('codigo', {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.replace(/\D/g, '');
                                            }
                                        })}
                                        onKeyDown={(e) => {
                                            if (
                                                ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                                                (e.ctrlKey || e.metaKey)
                                            ) {
                                                return;
                                            }
                                            if (!/^\d$/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        disabled={isPending}
                                        className={cn(
                                            'rounded-l-none focus-visible:z-10 shadow-none',
                                            errors.codigo ? 'border-destructive focus-visible:ring-destructive/30' : ''
                                        )}
                                    />
                                </div>
                                {errors.codigo && (
                                    <p className='text-[11px] text-destructive'>{errors.codigo.message}</p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div className='space-y-1.5'>
                                <Label htmlFor='telefono' className='text-xs font-medium text-foreground'>
                                    Teléfono de Contacto
                                </Label>
                                <Input
                                    id='telefono'
                                    type='tel'
                                    placeholder='(01) 456-7890 / 987654321'
                                    {...register('telefono')}
                                    disabled={isPending}
                                />
                            </div>

                            {/* Dirección */}
                            <div className='space-y-1.5 sm:col-span-2'>
                                <Label htmlFor='direccion' className='text-xs font-medium text-foreground'>
                                    Dirección Física <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='direccion'
                                    placeholder='Ej. Av. Larco 1234, Oficina 502, Lima'
                                    {...register('direccion')}
                                    disabled={isPending}
                                    className={errors.direccion ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                                />
                                {errors.direccion && (
                                    <p className='text-[11px] text-destructive'>{errors.direccion.message}</p>
                                )}
                            </div>

                            {/* Campo de Selección / Creación de RUC Emisor */}
                            <div className='space-y-2 sm:col-span-2 pt-1'>
                                {rucsList.length === 0 ? (
                                    /* Estado sin RUCs registrados */
                                    <div className='rounded-lg border border-dashed border-border/80 bg-muted/20 p-3.5 space-y-2.5 text-center'>
                                        <div className='flex items-center justify-center gap-2 text-xs font-semibold text-foreground'>
                                            <Building2Icon className='size-3.5 text-muted-foreground' />
                                            <span>No hay RUCs de empresa registrados</span>
                                        </div>
                                        <p className='text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed'>
                                            Esta sucursal operará sin facturación fiscal hasta que vincules un RUC emisor. Puedes registrar uno ahora con consulta a SUNAT.
                                        </p>
                                        <div>
                                            <Button
                                                type='button'
                                                variant='outline'
                                                size='sm'
                                                onClick={() => setIsNewRucModalOpen(true)}
                                                disabled={isPending}
                                                className='cursor-pointer gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10'
                                            >
                                                <PlusIcon className='size-3.5' />
                                                <span>Registrar Nuevo RUC</span>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Selector de RUCs disponibles + Botón para agregar más */
                                    <div className='space-y-1.5'>
                                        <div className='flex items-center justify-between gap-2'>
                                            <Label htmlFor='select-ruc-empresa' className='text-xs font-medium text-foreground'>
                                                RUC Emisor Asociado <span className='text-muted-foreground font-normal'>(Opcional)</span>
                                            </Label>
                                            <Button
                                                type='button'
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => setIsNewRucModalOpen(true)}
                                                disabled={isPending}
                                                className='h-7 cursor-pointer gap-1 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10'
                                                title='Registrar un nuevo RUC de la empresa'
                                            >
                                                <PlusIcon className='size-3.5' />
                                                <span>Nuevo RUC</span>
                                            </Button>
                                        </div>

                                        <div className='relative'>
                                            <select
                                                id='select-ruc-empresa'
                                                value={selectedRuc?.id || selectedRucId}
                                                onChange={(e) => handleSelectRuc(e.target.value)}
                                                disabled={isPending || isLoadingRucs}
                                                className='w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-medium pr-8 cursor-pointer'
                                            >
                                                <option value=''>— Sin RUC asignado (Opcional) —</option>
                                                {rucsList.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.numeroRuc} — {r.razonSocial || r.nombre} {r.esPrincipal ? '★ (Principal)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'>
                                                <ChevronDownIcon className='size-4' />
                                            </div>
                                        </div>

                                        {/* Micro-tarjeta de resumen fiscal cuando hay un RUC activo seleccionado */}
                                        {selectedRuc && (
                                            <div className='rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs animate-in fade-in duration-150'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <div className='flex items-center gap-1.5'>
                                                        <span className='font-mono font-bold tracking-wider text-foreground text-xs'>
                                                            {selectedRuc.numeroRuc}
                                                        </span>
                                                        {selectedRuc.esPrincipal && (
                                                            <Badge variant='secondary' className='text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'>
                                                                Principal
                                                            </Badge>
                                                        )}
                                                        <Badge variant='outline' className='text-[10px] h-4 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'>
                                                            Activo
                                                        </Badge>
                                                    </div>
                                                    <button
                                                        type='button'
                                                        onClick={() => handleSelectRuc('')}
                                                        disabled={isPending}
                                                        className='text-[11px] text-muted-foreground hover:text-destructive cursor-pointer transition-colors'
                                                        title='Desvincular RUC de esta sucursal'
                                                    >
                                                        Desvincular
                                                    </button>
                                                </div>
                                                <p className='font-medium text-foreground truncate'>
                                                    {selectedRuc.razonSocial || selectedRuc.nombre}
                                                </p>
                                                {selectedRuc.direccionFiscal && (
                                                    <p className='text-[11px] text-muted-foreground flex items-center gap-1.5 truncate'>
                                                        <MapPinIcon className='size-3 shrink-0' />
                                                        <span className='truncate'>{selectedRuc.direccionFiscal}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Razón Social */}
                            <div className='space-y-1.5 sm:col-span-2'>
                                <Label htmlFor='razonSocial' className='text-xs font-medium text-foreground'>
                                    Razón Social / Nombre Fiscal {selectedRuc ? '(Sincronizado con RUC)' : '(Opcional)'}
                                </Label>
                                <Input
                                    id='razonSocial'
                                    placeholder='Empresa Comercial S.A.C.'
                                    {...register('razonSocial')}
                                    disabled={isPending || Boolean(selectedRuc)}
                                    className={selectedRuc ? 'bg-muted/50 cursor-not-allowed' : ''}
                                />
                            </div>

                            {/* Correo Electrónico */}
                            <div className='space-y-1.5 sm:col-span-2'>
                                <Label htmlFor='email' className='text-xs font-medium text-foreground'>
                                    Correo Electrónico de la Sucursal
                                </Label>
                                <Input
                                    id='email'
                                    type='email'
                                    placeholder='sucursal.larco@empresa.com'
                                    {...register('email')}
                                    disabled={isPending}
                                    className={errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                                />
                                {errors.email && (
                                    <p className='text-[11px] text-destructive'>{errors.email.message}</p>
                                )}
                            </div>

                            {/* Estado Activo / Inactivo */}
                            <div className='sm:col-span-2 pt-1'>
                                <Controller
                                    control={control}
                                    name='isActive'
                                    render={({ field: { value, onChange } }) => (
                                        <label
                                            htmlFor='isActive'
                                            className='flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-foreground'
                                        >
                                            <input
                                                id='isActive'
                                                type='checkbox'
                                                checked={!!value}
                                                onChange={e => onChange(e.target.checked)}
                                                disabled={isPending}
                                                className='size-4 rounded border-border text-primary focus:ring-primary/30 accent-primary'
                                            />
                                            <span>Sucursal activa para operaciones, ventas y gestión de stock</span>
                                        </label>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div data-ui className='flex items-center justify-end gap-2.5 pt-3 border-t'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleClose}
                                disabled={isPending}
                                className='cursor-pointer text-xs'
                            >
                                Cancelar
                            </Button>
                            <Button
                                type='submit'
                                disabled={isPending}
                                className='cursor-pointer gap-2 text-xs font-medium'
                            >
                                {isPending ? (
                                    <>
                                        <Loader2Icon className='size-4 animate-spin' />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className='size-4' />
                                        <span>{isEditing ? 'Actualizar Sucursal' : 'Crear Sucursal'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal para Registrar Nuevo RUC en el catálogo multi-RUC de la empresa (solo montado cuando está abierto) */}
            {isNewRucModalOpen && (
                <ModalNewRucEmpresa
                    isOpen={isNewRucModalOpen}
                    onClose={() => setIsNewRucModalOpen(false)}
                    onSuccess={handleNewRucCreated}
                    zIndexClass='z-[60]'
                />
            )}
        </>
    );
}
