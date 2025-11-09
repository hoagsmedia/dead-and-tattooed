import { z } from 'zod';

export const signInSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	rememberMe: z.boolean().default(false)
});

export const signUpSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

export type SignInSchema = typeof signInSchema;
export type SignUpSchema = typeof signUpSchema;
