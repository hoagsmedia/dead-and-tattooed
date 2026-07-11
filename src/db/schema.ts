import { pgTable, text, timestamp, boolean, numeric, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const artwork = pgTable('artwork', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').default('').notNull(),
	price: numeric('price', { precision: 10, scale: 2 }),
	images: text('images').array().default([]).notNull(),
	published: boolean('published').default(false).notNull(),
	status: text('status').default('available').notNull(), // available, reserved, sold
	reservedUntil: timestamp('reserved_until'),
	sortOrder: integer('sort_order').default(0).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const order = pgTable('order', {
	id: text('id').primaryKey(),
	paymentIntentId: text('payment_intent_id').notNull().unique(),
	customerName: text('customer_name').notNull(),
	customerEmail: text('customer_email').notNull(),
	customerPhone: text('customer_phone'),
	shippingAddress: text('shipping_address').notNull(), // JSON string
	billingAddress: text('billing_address').notNull(), // JSON string
	total: numeric('total', { precision: 10, scale: 2 }).notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull().default('pending'), // pending, completed, cancelled
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const orderItem = pgTable('order_item', {
	id: text('id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.references(() => order.id, { onDelete: 'cascade' }),
	productId: text('product_id').notNull(),
	priceId: text('price_id').notNull(),
	artworkId: text('artwork_id'),
	name: text('name').notNull(),
	price: numeric('price', { precision: 10, scale: 2 }).notNull(),
	currency: text('currency').notNull().default('usd'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
