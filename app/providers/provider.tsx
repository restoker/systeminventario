import { Toaster } from '@/components/ui/toast'
import React from 'react'

const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Toaster />
            {children}
        </>
    )
}

export default Provider