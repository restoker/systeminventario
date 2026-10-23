'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlusIcon, XIcon, CheckIcon, Loader2Icon, UserCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'

import { Usuario } from '@/interfaces'
import { registerSchema, RegisterSchema } from '@/types/register-schema'
import { registerAction } from '@/server/actions/auth/register-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getUserAction } from '@/server/actions/auth/get-user-action'

interface ModalNuevoVendedorProps {
  isOpen: boolean
  onClose: () => void
  userToEdit?: Usuario | null
}

export default function ModalNuevoVendedor({
  isOpen,
  onClose,
  userToEdit
}: ModalNuevoVendedorProps) {
  const [loadingUser, setLoadingUser] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const editMode = searchParams.get('id')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'saler' as const
    }
  })

  const checkUser = async () => {
    if (editMode) {
      setLoadingUser(true)
      const { ok, data: user, msg } = await getUserAction(editMode)
      setLoadingUser(false)

      if (!ok) {
        toast.error(msg)
        router.push('/dashboard/vendedores')
        return
      }

      if (user) {
        setValue('id', user.id)
        setValue('name', user.name || '')
        setValue('username', user.username || '')
        setValue('phone', user.phone || '')
        setValue('email', user.email || '')
        setValue('role', (user.role as 'admin' | 'saler') || 'saler')
        setValue('password', '')
        setValue('confirmPassword', '')
      }
    }
  }

  useEffect(() => {
    if (editMode) {
      checkUser()
    }
  }, [editMode])

  const { execute, status } = useAction(registerAction, {
    onSuccess: ({ data }) => {
      if (data?.ok) {
        toast.success(data.msg || (editMode ? 'Vendedor actualizado correctamente' : 'Vendedor registrado correctamente'))
        reset()
        if (editMode) {
          router.push('/dashboard/vendedores')
        }
        onClose()
        router.refresh()
      } else {
        toast.error(data?.msg || 'Error al procesar el vendedor')
      }
    },
    onError: () => {
      toast.error('Ocurrió un error en el servidor al guardar el vendedor')
    }
  })

  const isPending = status === 'executing'

  const handleClose = () => {
    if (isPending) return
    reset()
    if (editMode) {
      router.push('/dashboard/vendedores')
    }
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        handleClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isPending, editMode])

  if (!isOpen) return null

  const onSubmit = (formData: RegisterSchema) => {
    execute({
      ...formData,
      role: 'saler',
      ...(editMode ? { id: editMode } : userToEdit?.id ? { id: userToEdit.id } : {})
    })
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200'
      role='dialog'
      aria-modal='true'
      onClick={e => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className='relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5 text-card-foreground'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <div className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider'>
              {editMode ? (
                <UserCheckIcon className='size-3.5' />
              ) : (
                <UserPlusIcon className='size-3.5' />
              )}
              <span>{editMode ? 'Actualizar Personal' : 'Gestión de Personal'}</span>
            </div>
            <h3 className='text-lg font-bold tracking-tight text-foreground'>
              {editMode ? 'Editar Vendedor' : 'Registrar Nuevo Vendedor'}
            </h3>
            <p className='text-xs text-muted-foreground'>
              {editMode
                ? 'Modifica los datos del colaborador vendedor en la plataforma.'
                : 'Crea una cuenta para un nuevo colaborador con rol de vendedor en la plataforma.'}
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
            {/* Nombre completo */}
            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='name' className='text-xs font-medium text-foreground'>
                Nombre Completo <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='Ej. Carlos Mendoza'
                {...register('name')}
                disabled={isPending || loadingUser}
                autoFocus
                className={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.name && (
                <p className='text-[11px] text-destructive'>{errors.name.message}</p>
              )}
            </div>

            {/* Nombre de usuario */}
            <div className='space-y-1.5'>
              <Label htmlFor='username' className='text-xs font-medium text-foreground'>
                Usuario <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='username'
                placeholder='Ej. cmendoza'
                {...register('username')}
                disabled={isPending || loadingUser}
                className={errors.username ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.username && (
                <p className='text-[11px] text-destructive'>{errors.username.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className='space-y-1.5'>
              <Label htmlFor='phone' className='text-xs font-medium text-foreground'>
                Teléfono (9 dígitos) <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='phone'
                placeholder='987654321'
                maxLength={9}
                {...register('phone')}
                disabled={isPending || loadingUser}
                className={errors.phone ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.phone && (
                <p className='text-[11px] text-destructive'>{errors.phone.message}</p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='email' className='text-xs font-medium text-foreground'>
                Correo Electrónico <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='carlos@empresa.com'
                {...register('email')}
                disabled={isPending || loadingUser}
                className={errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.email && (
                <p className='text-[11px] text-destructive'>{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className='space-y-1.5'>
              <Label htmlFor='password' className='text-xs font-medium text-foreground'>
                Contraseña {editMode ? <span className='text-[11px] text-muted-foreground font-normal'>(Opcional)</span> : <span className='text-destructive'>*</span>}
              </Label>
              <Input
                id='password'
                type='password'
                placeholder={editMode ? 'Dejar en blanco para conservar' : '••••••••'}
                {...register('password')}
                disabled={isPending || loadingUser}
                className={errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.password && (
                <p className='text-[11px] text-destructive'>{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className='space-y-1.5'>
              <Label htmlFor='confirmPassword' className='text-xs font-medium text-foreground'>
                Confirmar Contraseña {editMode ? <span className='text-[11px] text-muted-foreground font-normal'>(Opcional)</span> : <span className='text-destructive'>*</span>}
              </Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder={editMode ? 'Dejar en blanco para conservar' : '••••••••'}
                {...register('confirmPassword')}
                disabled={isPending || loadingUser}
                className={errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {errors.confirmPassword && (
                <p className='text-[11px] text-destructive'>{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className='flex items-center justify-end gap-2.5 pt-3 border-t'>
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
              disabled={isPending || loadingUser}
              className='cursor-pointer gap-2 text-xs font-medium'
            >
              {isPending ? (
                <>
                  <Loader2Icon className='size-4 animate-spin' />
                  <span>{editMode ? 'Actualizando...' : 'Registrando...'}</span>
                </>
              ) : (
                <>
                  <CheckIcon className='size-4' />
                  <span>{editMode ? 'Actualizar Vendedor' : 'Guardar Vendedor'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
