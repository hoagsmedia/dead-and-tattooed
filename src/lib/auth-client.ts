import { createAuthClient } from 'better-auth/svelte';

// No baseURL: default to the current origin so session state works on any
// host (a hardcoded localhost URL breaks the header's auth state in prod).
export const authClient = createAuthClient({});

export const { signIn, signUp, useSession } = authClient;
