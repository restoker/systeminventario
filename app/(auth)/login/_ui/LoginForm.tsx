'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { loginSchema, type LoginSchema } from '@/types/login-schema'
import { authClient } from '@/lib/auth-client'
import { useAction } from 'next-safe-action/hooks'
import { loginAction } from '@/server/actions/auth/login-action'
import { toast } from 'sonner'

const LoginForm = () => {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)

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
                toast('Inicio de sesión exitoso!', {
                    closeButton: true,
                    duration: 2000,
                    position: "top-right",
                    style: { color: "green" }
                })
                router.push('/dashboard')
                router.refresh()
            }
            toast(data.msg, {
                closeButton: true,
                duration: 2000,
                position: "top-right",
                style: { color: "red" }
            })
        },
        onError: (error) => {
            toast('Error en el Servidor al iniciar sesión', {
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

            <div>
                <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                    Username
                </label>
                <div className="mt-2">
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="usuario123"
                        aria-invalid={!!errors.username}
                        {...register('username')}
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 transition-colors ${errors.username
                            ? 'outline-red-500 focus:outline-red-500'
                            : 'outline-gray-300 focus:outline-amber-600 dark:outline-white/10 dark:focus:outline-amber-500'
                            }`}
                    />
                </div>
                {errors.username && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                        {errors.username.message}
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                    Password
                </label>
                <div className="relative mt-2">
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        {...register('password')}
                        className={`block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 transition-colors ${errors.password
                            ? 'outline-red-500 focus:outline-red-500'
                            : 'outline-gray-300 focus:outline-amber-600 dark:outline-white/10 dark:focus:outline-amber-500'
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none dark:hover:text-gray-200"
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                        {errors.password.message}
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

            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-500 dark:shadow-none dark:hover:bg-amber-400 dark:focus-visible:outline-amber-500 cursor-pointer transition-colors mt-10"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <span>Sign in</span>
                    )}
                </button>
            </div>
        </form>
    )
}

export default LoginForm