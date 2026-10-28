'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2Icon, XIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { Sucursal } from '@/interfaces';
import { newSucursalSchema, NewSurcursalSchema } from '@/types/new-surcursal-schema';
import { newSucursalAction } from '@/server/actions/sucursal/new-sucursal-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSucursalAction } from '@/server/actions/sucursal/get-sucursal-action';

interface ModalSucursalFormProps {
    isOpen: boolean;
    onClose: () => void;
    sucursalToEdit?: Sucursal | null;
}

export default function ModalSucursalForm({
    isOpen,
    onClose,
    sucursalToEdit
}: ModalSucursalFormProps) {
    const [loadingCategoria, setLoadingCategoria] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const editMode = pathname?.includes('/dashboard/sucursales') ? searchParams.get('id') : null;

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<NewSurcursalSchema>({
        resolver: zodResolver(newSucursalSchema),
        defaultValues: {
            nombre: '',
            codigo: '',
            direccion: '',
            telefono: '',
            email: '',
            ruc: '',
            razonSocial: '',
            isActive: true,
        }
    });

    const checkSucursal = async () => {
        if (editMode) {
            setLoadingCategoria(true);
            const { ok, data: sucursal, msg } = await getSucursalAction(editMode);
            setLoadingCategoria(false);

            if (!ok) {
                toast.error(msg);
                router.push('/dashboard/market/products');
                return;
            }

            if (sucursal) {
                setValue('id', sucursal.id);
                setValue('nombre', sucursal.nombre || '');
                setValue('codigo', sucursal.codigo || '');
                setValue('direccion', sucursal.direccion || '');
                setValue('telefono', sucursal.telefono || '');
                setValue('email', sucursal.email || '');
                setValue('ruc', sucursal.ruc || '');
                setValue('razonSocial', sucursal.razonSocial || '');
                setValue('isActive', sucursal.activo ?? true);
            }
        }
    };

    useEffect(() => {
        if (editMode) {
            checkSucursal();
        }
    }, [editMode]);

    const { execute, status } = useAction(newSucursalAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || (editMode ? 'Sucursal actualizada' : 'Sucursal creada'));
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

    const isPending = status === 'executing';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending]);

    if (!isOpen) return null;

    const onSubmit = (formData: NewSurcursalSchema) => {
        execute({
            ...formData,
            ...(sucursalToEdit?.id ? { id: sucursalToEdit.id } : {})
        });
    };

    const handleClose = () => {
        if (isPending) return;
        reset();
        onClose();
    };

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200'
            role='dialog'
            aria-modal='true'
            onClick={e => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div data-ui className='relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border bg-card p-6 animate-in zoom-in-95 duration-200 space-y-5 text-card-foreground'>
                {/* Header */}
                <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-xs font-semibold text-primary'>
                            <Building2Icon className='size-3.5' />
                            <span>{editMode ? 'Actualizar Sede' : 'Nueva Sede'}</span>
                        </div>
                        <h3 className='text-lg font-bold tracking-tight text-foreground'>
                            {editMode ? 'Editar Sucursal o Almacén' : 'Registrar Nueva Sucursal'}
                        </h3>
                        <p className='text-xs text-muted-foreground'>
                            {editMode
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
                            <Input
                                id='codigo'
                                placeholder='SUC-01'
                                {...register('codigo')}
                                disabled={isPending}
                                className={errors.codigo ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                            />
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

                        {/* RUC */}
                        <div className='space-y-1.5'>
                            <Label htmlFor='ruc' className='text-xs font-medium text-foreground'>
                                RUC (11 dígitos)
                            </Label>
                            <Input
                                id='ruc'
                                placeholder='20601234567'
                                maxLength={11}
                                {...register('ruc')}
                                disabled={isPending}
                            />
                        </div>

                        {/* Razón Social */}
                        <div className='space-y-1.5'>
                            <Label htmlFor='razonSocial' className='text-xs font-medium text-foreground'>
                                Razón Social
                            </Label>
                            <Input
                                id='razonSocial'
                                placeholder='Empresa Comercial S.A.C.'
                                {...register('razonSocial')}
                                disabled={isPending}
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
                                    <span>{editMode ? 'Actualizar Sucursal' : 'Crear Sucursal'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
