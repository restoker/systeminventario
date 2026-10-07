import db from "@/server";
import schema from "@/server/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseUrl: process.env.BETTER_AUTH_URL!,
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema: schema,
    }),
    user: {
        additionalFields: {
            username: {
                type: "string",
                length: 20,
                optional: false,
                unique: true,
                index: true,
            },
            phone: {
                type: "string",
                length: 9,
                unique: false,
                index: false,
            },
            role: {
                type: "string",
                values: ["admin", "saler"],
                unique: false,
                index: false,
                default: "saler",
            }
        }
    },
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 12 * 1, // 12 hours
        updateAge: 60 * 60 * 12, // 12 hours (every 12 hours the session expiration is updated)
    },
    plugins: [nextCookies(),]
});