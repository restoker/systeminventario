import { Toaster } from 'sonner'
import React from 'react'

const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <Toaster />
            {children}
        </div>
    )
}

export default Provider