import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signUp, useSession, signOut } = authClient