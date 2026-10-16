'use client'

import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LoaderCircle, CircleAlert, UserRound, LockKeyhole, ArrowRight, Check } from 'lucide-react'
import { loginSchema, type LoginSchema } from '@/types/login-schema'
import { authClient } from '@/lib/auth-client'
import { useAction } from 'next-safe-action/hooks'
import { loginAction } from '@/server/actions/auth/login-action'
import { toast } from 'sonner'

const LoginForm = () => {
    const router = useRouter()
    const formRef = useRef<HTMLFormElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLock, setCapsLock] = useState(false)
    const [success, setSuccess] = useState(false)

    // Sacudida corta para avisar que algo falló (se omite con reduced-motion)
    const shake = () => {
        const el = formRef.current
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        el.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(0)' },
            ],
            { duration: 320, easing: 'ease-out' }
        )
    }

    const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
        setCapsLock(e.getModifierState('CapsLock'))
    }

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
        mode: 'onTouched',
    })

    const { execute, status } = useAction(loginAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                setSuccess(true)
                toast.success('Inicio de sesión exitoso!', {
                    closeButton: true,
                    duration: 2000,
                    position: "top-right",
                    style: { color: "green" }
                })
                router.push('/dashboard')
                router.refresh()
            } else {
                shake()
                toast.error(data.msg, {
                    closeButton: true,
                    duration: 2000,
                    position: "top-right",
                    style: { color: "red" }
                })
            }

        },
        onError: (error) => {
            shake()
            toast.error('Error en el Servidor al iniciar sesión', {
                closeButton: true,
                duration: 2000,
                position: "top-right",
                style: { color: "red" }
            })
        },
    })

    const onSubmit = async (data: LoginSchema) => {
        execute(data)
    }

    const pending = status === 'executing' || isSubmitting
    const busy = pending || success

    const inputClass = (hasError: boolean) =>
        `block w-full rounded-md bg-white py-2 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 transition-[outline-color,background-color] duration-200 ${hasError
            ? 'outline-red-500 focus:outline-red-500'
            : 'outline-gray-300 hover:outline-gray-400 focus:outline-amber-600 dark:outline-white/10 dark:hover:outline-white/20 dark:focus:outline-amber-500'
        }`

    const iconClass = (hasError: boolean) =>
        `pointer-events-none absolute inset-y-0 left-3 my-auto size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 ${hasError
            ? 'text-red-500'
            : 'text-gray-400 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-500'
        }`

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit, shake)}
            noValidate
            className="space-y-6"
        >

            <div className="animate-rise [animation-delay:200ms] motion-reduce:animate-none">
                <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                    Usuario
                </label>
                <div className="group relative mt-2">
                    <UserRound aria-hidden="true" className={iconClass(!!errors.username)} />
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="usuario123"
                        aria-invalid={!!errors.username}
                        aria-describedby={errors.username ? 'username-error' : undefined}
                        {...register('username')}
                        className={`${inputClass(!!errors.username)} pr-3`}
                    />
                </div>
                {errors.username && (
                    <p id="username-error" className="mt-1.5 flex animate-rise items-center gap-1.5 text-xs text-red-600 [animation-duration:250ms] motion-reduce:animate-none dark:text-red-400">
                        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                        {errors.username.message}
                    </p>
                )}
            </div>

            <div className="animate-rise [animation-delay:270ms] motion-reduce:animate-none">
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                    Contraseña
                </label>
                <div className="group relative mt-2">
                    <LockKeyhole aria-hidden="true" className={iconClass(!!errors.password)} />
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : capsLock ? 'caps-warning' : undefined}
                        onKeyDown={checkCaps}
                        onKeyUp={checkCaps}
                        {...register('password', { onBlur: () => setCapsLock(false) })}
                        className={`${inputClass(!!errors.password)} pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-md px-3 text-gray-400 transition-colors hover:text-gray-700 focus-visible:text-amber-600 focus-visible:outline-none dark:hover:text-gray-200"
                    >
                        <span key={String(showPassword)} className="block animate-in zoom-in-75 fade-in duration-200 motion-reduce:animate-none">
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </span>
                    </button>
                </div>
                {errors.password ? (
                    <p id="password-error" className="mt-1.5 flex animate-rise items-center gap-1.5 text-xs text-red-600 [animation-duration:250ms] motion-reduce:animate-none dark:text-red-400">
                        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                        {errors.password.message}
                    </p>
                ) : capsLock && (
                    <p id="caps-warning" role="status" className="mt-1.5 flex animate-rise items-center gap-1.5 text-xs font-medium text-amber-700 [animation-duration:250ms] motion-reduce:animate-none dark:text-amber-400">
                        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                        Bloq Mayús está activado
                    </p>
                )}
            </div>

            {/* <div className="flex items-center justify-between">
                <div className="flex gap-3">
                    <div className="flex h-6 shrink-0 items-center">
                        <div className="group grid size-4 grid-cols-1">
                            <input
                                id="remember-me"
                                type="checkbox"
                                {...register('rememberMe')}
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-amber-600 checked:bg-amber-600 indeterminate:border-amber-600 indeterminate:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-amber-500 dark:checked:bg-amber-500 dark:indeterminate:border-amber-500 dark:indeterminate:bg-amber-500 dark:focus-visible:outline-amber-500 forced-colors:appearance-auto cursor-pointer"
                            />
                            <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                            >
                                <path
                                    d="M3 8L6 11L11 3.5"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-checked:opacity-100"
                                />
                                <path
                                    d="M3 7H11"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-0 group-has-indeterminate:opacity-100"
                                />
                            </svg>
                        </div>
                    </div>
                    <label htmlFor="remember-me" className="block text-sm/6 text-gray-900 dark:text-gray-300 select-none cursor-pointer">
                        Remember me
                    </label>
                </div>

                <div className="text-sm/6">
                    <a
                        href="#"
                        className="font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                        Forgot password?
                    </a>
                </div>
            </div> */}

            <div className="animate-rise pt-4 [animation-delay:340ms] motion-reduce:animate-none">
                <button
                    type="submit"
                    disabled={busy}
                    aria-live="polite"
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm/6 font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-amber-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:active:scale-100 dark:bg-amber-500 dark:hover:bg-amber-400 dark:focus-visible:outline-amber-500 motion-reduce:active:scale-100"
                >
                    {success ? (
                        <span className="flex animate-in items-center gap-2 zoom-in-90 fade-in duration-200">
                            <Check className="size-4" />
                            Listo, entrando…
                        </span>
                    ) : pending ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Verificando…</span>
                        </>
                    ) : (
                        <>
                            <span>Iniciar sesión</span>
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}

export default LoginForm