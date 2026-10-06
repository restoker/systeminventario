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
    emailAndPassword: {
        enabled: true,
    },
    plugins: [nextCookies(),]
});