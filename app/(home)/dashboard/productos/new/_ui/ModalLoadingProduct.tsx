'use client';

import React, { useEffect } from 'react';

interface ModalLoadingProductProps {
    isOpen: boolean;
    title?: string;
    description?: string;
}

export default function ModalLoadingProduct({
    isOpen,
    title = 'Guardando nuevo producto',
    description = 'Procesando especificaciones, optimizando imagen y registrando en el inventario...',
}: ModalLoadingProductProps) {
    // Bloquear scroll de la pantalla mientras se procesa la solicitud
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-busy="true"
            aria-live="assertive"
            aria-labelledby="product-loading-title"
            aria-describedby="product-loading-description"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200 select-none cursor-wait"
        >
            <div
                className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white p-7 text-center shadow-2xl dark:border-white/10 dark:bg-neutral-900 animate-in zoom-in-95 duration-200 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Indicador de carga circular SVG de alto rendimiento y nítido */}
                <div className="relative mx-auto flex size-12 items-center justify-center">
                    <svg
                        className="size-12 animate-spin text-[#FC7819] motion-reduce:animate-none"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-20"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div>

                {/* Textos descriptivos del estado */}
                <div className="space-y-1.5">
                    <h3
                        id="product-loading-title"
                        className="text-base font-semibold text-gray-900 dark:text-white"
                    >
                        {title}
                    </h3>
                    <p
                        id="product-loading-description"
                        className="text-xs leading-relaxed text-gray-500 dark:text-gray-400"
                    >
                        {description}
                    </p>
                </div>

                {/* Estado de sincronización en servidor */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-medium text-black/55 dark:text-white/55">
                    <span className="size-1.5 rounded-full bg-[#FC7819] animate-pulse" />
                    <span>Sincronizando con la base de datos</span>
                </div>
            </div>
        </div>
    );
}
