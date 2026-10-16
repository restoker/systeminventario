'use client';

import React, { ReactNode, useRef, useState } from 'react'
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, CircleAlert, UserRound, AtSign, Mail, Phone, LockKeyhole, ShieldCheck, ArrowRight, Check, type LucideIcon } from 'lucide-react';
import { registerSchema, type RegisterSchema } from '@/types/register-schema';
import { useAction } from 'next-safe-action/hooks';
import { registerAction } from '@/server/actions/auth/register-auth';
import { toast } from 'sonner';
import { clsx } from 'cn';

const termsText = (
    <>
        Al crear una cuenta aceptas nuestros{" "}
        <a href="#" className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white">
            Términos de servicio
        </a>{" "}
        y la{" "}
        <a href="#" className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white">
            Política de privacidad
        </a>
    </>
);

// Entrada escalonada: cada fila aparece un poco después de la anterior
const rise = 'animate-rise motion-reduce:animate-none';

const RegisterForm = () => {
    const formRef = useRef<HTMLFormElement>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        control,
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

    const [password, confirmPassword] = useWatch({ control, name: ['password', 'confirmPassword'] });
    const passwordsMatch = confirmPassword.length >= 4 && password === confirmPassword;

    // Sacudida corta para avisar que algo falló (se omite con reduced-motion)
    const shake = () => {
        const el = formRef.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        el.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(0)' },
            ],
            { duration: 320, easing: 'ease-out' }
        );
    };

    const { execute, status } = useAction(registerAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                setSuccess(true)
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
                window.location.href = '/login';
            } else {
                shake()
                toast.error(data.msg, { closeButton: true, duration: 2000, position: "top-right" })
            }
        },
        onError: (error) => {
            shake()
            toast.error('Error en el Servidor al registrar', { closeButton: true, duration: 2000, position: "top-right" })
        }
    })

    const onSubmit = async (data: RegisterSchema) => {
        // Validación completa en cliente. Acciones de servidor pendientes de implementación.
        execute(data);
        // console.log(data);
    };

    const pending = isSubmitting || status === 'executing';
    const busy = pending || success;

    return (
        <form ref={formRef} onSubmit={handleSubmit(onSubmit, shake)} noValidate className="mt-6 space-y-3">
            <div className={`grid gap-2.5 sm:grid-cols-2 ${rise} [animation-delay:160ms]`}>
                <FieldBox
                    id="name"
                    label="Nombre completo"
                    icon={UserRound}
                    autoComplete="name"
                    placeholder="Juan Pérez"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <FieldBox
                    id="username"
                    label="Usuario"
                    icon={AtSign}
                    autoComplete="username"
                    placeholder="usuario123"
                    error={errors.username?.message}
                    {...register('username')}
                />
            </div>

            <div className={`grid gap-2.5 sm:grid-cols-2 ${rise} [animation-delay:220ms]`}>
                <FieldBox
                    id="email"
                    label="Correo"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <FieldBox
                    id="phone"
                    label="Teléfono"
                    icon={Phone}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
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

            <div className={`grid gap-2.5 sm:grid-cols-2 ${rise} [animation-delay:280ms]`}>
                <FieldBox
                    id="password"
                    label="Contraseña"
                    icon={LockKeyhole}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <FieldBox
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    icon={ShieldCheck}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    error={errors.confirmPassword?.message}
                    matched={passwordsMatch && !errors.confirmPassword}
                    {...register('confirmPassword')}
                />
            </div>

            <div className={`space-y-2 pt-1 text-xs leading-snug text-black/50 dark:text-white/45 ${rise} [animation-delay:340ms]`}>
                <CheckboxLine>{termsText}</CheckboxLine>
            </div>

            <div className={`${rise} [animation-delay:400ms]`}>
                <button
                    type="submit"
                    disabled={busy}
                    aria-live="polite"
                    className={clsx('group mt-4 flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/30 bg-black text-sm sm:text-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-black/85 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:outline-white motion-reduce:active:scale-100 cursor-pointer', {
                        'cursor-wait': status === 'executing',
                        'disabled:cursor-not-allowed disabled:active:scale-100': busy,
                    })}
                >
                    {success ? (
                        <span className="flex animate-in items-center gap-2 zoom-in-90 fade-in duration-200">
                            <Check className="size-4" />
                            Cuenta creada
                        </span>
                    ) : pending ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Registrando…</span>
                        </>
                    ) : (
                        <>
                            <span>Crear cuenta</span>
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
                        </>
                    )}
                </button>
            </div>

            <p className={`pt-1 text-center text-xs text-black/60 dark:text-white/50 ${rise} [animation-delay:460ms]`}>
                ¿Ya tienes cuenta?{' '}
                <Link
                    href="/login"
                    className="font-medium text-black underline underline-offset-2 hover:opacity-80 dark:text-white"
                >
                    Inicia sesión
                </Link>
            </p>
        </form>
    );
};

export default RegisterForm;

interface FieldBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    icon: LucideIcon;
    error?: string;
    matched?: boolean;
}

function FieldBox({
    id,
    label,
    icon: Icon,
    type = "text",
    placeholder,
    error,
    matched,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...props
}: FieldBoxProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const isPassword = type === "password";

    const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isPassword) setCapsLock(e.getModifierState('CapsLock'));
    };

    const describedBy = error ? `${id}-error` : capsLock ? `${id}-caps` : undefined;

    return (
        <div>
            <label
                htmlFor={id}
                className="block text-xs sm:text-sm font-medium text-black dark:text-white"
            >
                {label}
            </label>
            <div className="group relative mt-1">
                <Icon
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 left-3 my-auto size-4 transition-[color,transform] duration-200 group-focus-within:scale-110 ${error
                        ? "text-red-500"
                        : "text-black/35 group-focus-within:text-[#FC7819] dark:text-white/35"
                        }`}
                />
                <input
                    id={id}
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder || label}
                    aria-invalid={!!error}
                    aria-describedby={describedBy}
                    onKeyDown={(e) => { checkCaps(e); onKeyDown?.(e); }}
                    onKeyUp={(e) => { checkCaps(e); onKeyUp?.(e); }}
                    onBlur={(e) => { setCapsLock(false); onBlur?.(e); }}
                    className={`block w-full rounded-lg bg-white py-2 pl-9 text-sm text-black placeholder:text-black/30 focus:outline-none dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 transition-colors duration-200 ${error
                        ? "border border-red-500 focus:border-red-500 dark:border-red-500"
                        : "border border-black/20 hover:border-black/35 dark:border-white/15 dark:hover:border-white/30 focus:border-black/60 dark:focus:border-white/50"
                        } ${isPassword ? (matched ? "pr-14" : "pr-9") : "pr-3"}`}
                    {...props}
                />
                {matched && (
                    <Check
                        aria-label="Las contraseñas coinciden"
                        className="pointer-events-none absolute inset-y-0 right-9 my-auto size-4 animate-in text-green-600 zoom-in-50 fade-in duration-200 dark:text-green-400"
                    />
                )}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white focus:outline-none focus-visible:text-[#FC7819] cursor-pointer"
                    >
                        <span key={String(showPassword)} className="block animate-in zoom-in-75 fade-in duration-200 motion-reduce:animate-none">
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </span>
                    </button>
                )}
            </div>
            {error ? (
                <p id={`${id}-error`} className="mt-1 flex animate-rise items-start gap-1 text-xs text-red-600 [animation-duration:250ms] motion-reduce:animate-none dark:text-red-400">
                    <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                    {error}
                </p>
            ) : capsLock && (
                <p id={`${id}-caps`} role="status" className="mt-1 flex animate-rise items-center gap-1 text-xs font-medium text-[#C2570C] [animation-duration:250ms] motion-reduce:animate-none dark:text-[#FC7819]">
                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                    Bloq Mayús activado
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
                    className="peer size-full appearance-none rounded-[3px] border border-black/30 bg-white transition-colors checked:border-black checked:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FC7819] dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white cursor-pointer"
                />
                <svg viewBox="0 0 12 12" className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block peer-checked:animate-in peer-checked:zoom-in-50 dark:text-black" fill="none" aria-hidden="true">
                    <path d="M3 6.2 5 8.1 9 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span>{children}</span>
        </label>
    );
}