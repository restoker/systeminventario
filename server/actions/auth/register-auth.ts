'use server';

import { actionClient } from "@/lib/safe-action";
import { registerSchema } from "@/types/register-schema";

export const registerAction = actionClient
    .inputSchema(registerSchema)
    .action(async ({ parsedInput: { email, password, id } }) => {

        try {

        } catch (error) {

        }
    })