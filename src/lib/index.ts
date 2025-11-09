// place files you want to import through the `$lib` alias in this folder.
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '$env/dynamic/private';
import * as schema from '../db/schema';

export const db = drizzle({
	connection: {
		connectionString: env.DATABASE_URL,
		ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
	},
	schema
});
