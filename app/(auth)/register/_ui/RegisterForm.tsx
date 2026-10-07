'use client';

import React, { ReactNode, useState } from 'react'
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchema, type RegisterSchema } from '@/types/register-schema';
import { useAction } from 'next-safe-action/hooks';
import { registerAction } from '@/server/actions/auth/register-auth';
import { toast } from 'sonner';

const termsText = (
    <>
        By creating an account, you agree to our{" "}
        <a href="#" className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white">
            Terms and Services
        </a>{" "}
        and{" "}
        <a href="#" className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white">
            Privacy Policy
        </a>
    </>
);

const RegisterForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
        mode: 'onTouched',
    });

    const { execute, status } = useAction(registerAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg, {
                    style: {
                        '--normal-bg':
                            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                        '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                        '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                    } as React.CSSProperties,
                    closeButton: true,
                })
                reset();
            } else {
                toast.error(data.msg, { closeButton: true, duration: 2000, position: "top-right" })
            }
        },
        onError: (error) => {
            toast.error('Error en el Servidor al registrar', { closeButton: true, duration: 2000, position: "top-right" })
        }
    })

    const onSubmit = async (data: RegisterSchema) => {
        // Validación completa en cliente. Acciones de servidor pendientes de implementación.
        execute(data);
        // console.log(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
                <FieldBox
                    id="name"
                    label="Nombre completo"
                    placeholder="Juan Pérez"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <FieldBox
                    id="username"
                    label="Username"
                    placeholder="usuario123"
                    error={errors.username?.message}
                    {...register('username')}
                />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
                <FieldBox
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <FieldBox
                    id="phone"
                    label="Teléfono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="912345678"
                    error={errors.phone?.message}
                    {...register('phone', {
                        onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        },
                    })}
                    onKeyDown={(e) => {
                        if (
                            [
                                'Backspace',
                                'Delete',
                                'Tab',
                                'ArrowLeft',
                                'ArrowRight',
                                'Home',
                                'End',
                                'Enter',
                            ].includes(e.key) ||
                            e.ctrlKey ||
                            e.metaKey
                        ) {
                            return;
                        }
                        if (!/^\d$/.test(e.key)) {
                            e.preventDefault();
                        }
                    }}
                />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
                <FieldBox
                    id="password"
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <FieldBox
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    type="password"
                    placeholder="••••••••••••"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />
            </div>

            <div className="space-y-2 pt-1 text-xs leading-snug text-black/50 dark:text-white/45">
                <CheckboxLine>I don't want to receive emails about solaceui feature updates</CheckboxLine>
                <CheckboxLine>{termsText}</CheckboxLine>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/30 bg-black text-sm sm:text-base font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85 cursor-pointer"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Registrando...</span>
                    </>
                ) : (
                    <span>Crear cuenta</span>
                )}
            </button>

            <p className="pt-1 text-center text-xs text-black/60 dark:text-white/50">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-medium text-black underline underline-offset-2 hover:opacity-80 dark:text-white"
                >
                    Sign in
                </Link>
            </p>
        </form>
    );
};

export default RegisterForm;

interface FieldBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string;
}

function FieldBox({
    id,
    label,
    type = "text",
    placeholder,
    error,
    ...props
}: FieldBoxProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
        <div>
            <label
                htmlFor={id}
                className="block text-xs sm:text-sm font-medium text-black dark:text-white"
            >
                {label}
            </label>
            <div className="relative mt-1">
                <input
                    id={id}
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder || label}
                    aria-invalid={!!error}
                    className={`block w-full rounded-lg bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:outline-none dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 transition-colors ${error
                        ? "border border-red-500 focus:border-red-500 dark:border-red-500"
                        : "border border-black/20 dark:border-white/15 focus:border-black/60 dark:focus:border-white/50"
                        } ${isPassword ? "pr-9" : ""}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white focus:outline-none cursor-pointer"
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function CheckboxLine({ children }: { children: ReactNode }) {
    return (
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <span className="relative mt-0.5 size-3.5 shrink-0">
                <input
                    type="checkbox"
                    className="peer size-full appearance-none rounded-[3px] border border-black/30 bg-white checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white cursor-pointer"
                />
                <svg viewBox="0 0 12 12" className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black" fill="none" aria-hidden="true">
                    <path d="M3 6.2 5 8.1 9 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span>{children}</span>
        </label>
    );
}